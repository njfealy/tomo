import express, { NextFunction } from "express";

import {
  insertPost,
  deletePostById,
  findPostById,
  findPostsById,
  addLikeToPost,
  pullLikeFromPost,
  findAllPosts,
} from "./post-model";
import { addPostToUser, pullPostFromUser } from "../user/user-model";
import { deleteCommentsByPostId } from "@App/comment/comment-model";

import { ObjectId } from "mongodb";
import { getClient } from "@App/utils/mongo";
import { ApiError } from "../utils/api-error";
import { addEngagement, removeEngagement } from "@App/utils/trending";
import { redis } from "@App/utils/redis";

export const createPost = async (
  req: express.Request<{}, {}, { postText: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));
  const creatorId = new ObjectId(req.user._id);
  const postText = req.body.postText;

  let postId: ObjectId;
  const session = getClient().startSession();
  try {
    session.startTransaction();

    const insertPostResult = await insertPost(creatorId, postText, session);
    if (!insertPostResult || !insertPostResult.acknowledged)
      throw new ApiError("DB Error", 500);

    postId = insertPostResult.insertedId;
    const addPostToUserResult = await addPostToUser(creatorId, postId, session);
    if (!addPostToUserResult || !addPostToUserResult.acknowledged)
      throw new ApiError("DB Error", 500);

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  return res
    .status(201)
    .json({ message: "Post created", _id: postId.toString() });
};

export const deletePost = async (
  req: express.Request<{ postId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));
  const postId = new ObjectId(req.params.postId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const deletePostResult = await deletePostById(postId, session);
    if (!deletePostResult)
      throw new ApiError(`Could not find Post with ID=${postId}`, 404);
    if (deletePostResult.creator.toString() != req.user._id)
      throw new ApiError("Unauthorized", 401);

    const deletePostCommentsResult = await deleteCommentsByPostId(
      postId,
      session
    );
    if (!deletePostCommentsResult || !deletePostCommentsResult.acknowledged)
      throw new ApiError("DB Error", 500);

    const creatorId = deletePostResult.creator;
    const pullPostFromUserResult = await pullPostFromUser(
      creatorId,
      postId,
      session
    );
    if (!pullPostFromUserResult || !pullPostFromUserResult.acknowledged)
      throw new ApiError("DB Error", 500);

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  return res.status(204).json({ message: `Deleted Post with ID=${postId}` });
};

export const getPost = async (
  req: express.Request<{ postId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  const postId = new ObjectId(req.params.postId);

  const post = await findPostById(postId);
  if (!post) {
    return next(new ApiError(`Could not find Post ID=${postId}`, 404));
  }
  res.status(200).json(post);
};

export const getAllPosts = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const allPosts = await findAllPosts();
  console.log(allPosts);
  return res.status(200).json(allPosts);
};

export const likePost = async (
  req: express.Request<{ postId: string }>,
  res: express.Response,
  next: NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));
  const likerId = new ObjectId(req.user._id);
  const postId = new ObjectId(req.params.postId);
  const now = new Date();

  const likePostResult = await addLikeToPost(postId, likerId, now);
  if (!likePostResult) return next(new ApiError("DB Error", 500));

  await addEngagement(postId.toString(), "likes", likerId.toString(), now);

  return res
    .status(200)
    .json({ message: `User ID=${likerId} liked Post ID=${postId}` });
};

export const unlikePost = async (
  req: express.Request<{ postId: string }>,
  res: express.Response,
  next: NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));
  const likerId = new ObjectId(req.user._id);
  const postId = new ObjectId(req.params.postId);

  const session = await getClient().startSession();
  session.startTransaction();
  try {
    console.log("pullLikeFromPost");
    const likePostResult = await pullLikeFromPost(postId, likerId, session);
    if (!likePostResult) throw new ApiError("DB Error", 500);
    const like = likePostResult.likes?.find((like) =>
      like.user.equals(likerId)
    );
    if (!like) throw new ApiError("DB Error", 500);

    console.log("pullEngagement");
    await removeEngagement(
      "likes",
      postId.toString(),
      likerId.toString(),
      like.date.getTime()
    );

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  return res
    .status(200)
    .json({ message: `User ID=${likerId} unliked Post ID=${postId}` });
};

export const getTrendingPosts = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  const topPostIds = (await redis.zRange("posts:trending", 0, 19, {
    REV: true,
  })) as string[];
  console.log(topPostIds);
  const _ids = topPostIds.map((id) => new ObjectId(id));

  const posts = await findPostsById(_ids);

  return res.status(200).json(posts);
};
