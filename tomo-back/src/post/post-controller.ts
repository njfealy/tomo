import express, { NextFunction } from "express";
import {
  CreatePostRequest,
  LikePostRequest,
  UnlikePostRequest,
} from "./post.types";

import {
  insertPost,
  deletePostById,
  findPostById,
  addLikeToPost,
  pullLikeFromPost,
} from "./post-model";
import { addPostToUser, pullPostFromUser } from "../user/user-model";
import { deleteCommentsByPostId } from "@App/comment/comment-model";

import { ObjectId } from "mongodb";
import { getClient } from "@App/utils/mongo";
import { ApiError } from "../utils/api-error";

export const createPost = async (
  req: express.Request<{}, {}, CreatePostRequest>,
  res: express.Response,
  next: express.NextFunction
) => {
  const creatorId = new ObjectId(req.body.creatorId);
  const postText = req.body.postText;

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const insertPostResult = await insertPost(creatorId, postText, session);
    if (!insertPostResult || !insertPostResult.acknowledged)
      throw new ApiError("DB Error", 500);

    const postId = insertPostResult.insertedId;
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

  return res.status(201).json({ message: "Post created" });
};

export const deletePost = async (
  req: express.Request<{ postId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  const postId = new ObjectId(req.params.postId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const deletePostResult = await deletePostById(postId, session);
    if (!deletePostResult)
      throw new ApiError(`Could not find Post with ID=${postId}`, 404);

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

export const likePost = async (
  req: express.Request<{ postId: string }, {}, LikePostRequest>,
  res: express.Response,
  next: NextFunction
) => {
  const postId = new ObjectId(req.params.postId);
  const likerId = new ObjectId(req.body.likerId);

  const likePostResult = await addLikeToPost(postId, likerId);
  if (!likePostResult) return next(new ApiError("DB Error", 500));

  return res
    .status(200)
    .json({ message: `User ID=${likerId} liked Post ID=${postId}` });
};

export const unlikePost = async (
  req: express.Request<{ postId: string }, {}, UnlikePostRequest>,
  res: express.Response,
  next: NextFunction
) => {
  const postId = new ObjectId(req.params.postId);
  const likerId = new ObjectId(req.body.likerId);

  const likePostResult = await pullLikeFromPost(postId, likerId);
  if (!likePostResult) return next(new ApiError("DB Error", 500));

  return res
    .status(200)
    .json({ message: `User ID=${likerId} unliked Post ID=${postId}` });
};
