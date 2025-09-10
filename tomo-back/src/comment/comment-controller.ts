import express from "express";

import {
  insertComment,
  deleteCommentById,
  updateCommentById,
  findCommentById,
  addLikeToComment,
  pullLikeFromComment,
  pushReplyToComment,
  pushLikeToReply,
  pullLikeFromReply,
} from "./comment-model";
import { addCommentToPost, pullCommentFromPost } from "../post/post-model";

import { ObjectId } from "mongodb";
import { getClient } from "@App/utils/mongo";
import { ApiError } from "@App/utils/api-error";
import { addEngagement, removeEngagement } from "@App/utils/trending";

export const makeComment = async (
  req: express.Request<{ postId: string }, {}, { commentText: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));
  const postId = new ObjectId(req.params.postId);
  const creatorId = new ObjectId(req.user._id);
  const commentText = req.body.commentText;

  const session = getClient().startSession();
  let commentId: ObjectId;
  try {
    session.startTransaction();

    const now = new Date();
    const insertCommentResult = await insertComment(
      postId,
      creatorId,
      commentText,
      now,
      session
    );
    if (!insertCommentResult || !insertCommentResult.acknowledged)
      throw new ApiError("DB Error", 500);

    commentId = insertCommentResult.insertedId;

    const addToPostResult = await addCommentToPost(postId, commentId, session);
    if (!addToPostResult) throw new ApiError("DB Error");

    await addEngagement(
      postId.toString(),
      "comments",
      creatorId.toString(),
      now
    );

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  return res.status(201).json({
    message: `Comment made on Post ID =${postId}`,
    commentId: commentId.toString(),
  });
};

export const deleteComment = async (
  req: express.Request<{ postId: string; commentId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));
  const postId = new ObjectId(req.params.postId);
  const commentId = new ObjectId(req.params.commentId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const deleteCommentResult = await deleteCommentById(commentId, session);
    if (!deleteCommentResult)
      throw new ApiError(`Could not find Comment with ID=${commentId}`, 404);

    if (deleteCommentResult.creator.toString() != req.user._id)
      throw new ApiError("Unauthorized", 401);

    const pullCommentFromPostResult = await pullCommentFromPost(
      postId,
      commentId,
      session
    );
    if (!pullCommentFromPostResult)
      throw new ApiError(`Could not find Post with ID=${postId}`, 404);

    await removeEngagement(
      "comments",
      postId.toString(),
      deleteCommentResult.creator.toString(),
      deleteCommentResult.date.getTime()
    );

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  return res
    .status(204)
    .json({ message: `Deleted Comment with ID=${commentId}` });
};

export const editComment = async (
  req: express.Request<{ commentId: string }, {}, { newText: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));

  const commentId = new ObjectId(req.params.commentId);
  const newText = req.body.newText;

  const comment = await findCommentById(commentId);
  if (!comment)
    return next(
      new ApiError(`Could not find Comment with ID=${commentId}`, 404)
    );
  if (comment.creator.toString() != req.user._id)
    return next(new ApiError("Unauthorized", 401));

  const editResult = await updateCommentById(commentId, newText);
  if (!editResult)
    return next(
      new ApiError(`Could not find Comment with ID=${commentId}`, 404)
    );

  return res
    .status(204)
    .json({ message: `Edited Comment with ID=${commentId}` });
};

export const likeComment = async (
  req: express.Request<{ commentId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));

  const commentId = new ObjectId(req.params.commentId);
  const userId = new ObjectId(req.user._id);

  const updateResult = await addLikeToComment(commentId, userId);
  if (!updateResult) return next(new ApiError("Comment not found", 404));

  return res.status(200).json({
    message: "Successfully liked comment",
  });
};

export const unlikeComment = async (
  req: express.Request<{ commentId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));

  const commentId = new ObjectId(req.params.commentId);
  const userId = new ObjectId(req.user._id);

  const updateResult = await pullLikeFromComment(commentId, userId);
  if (!updateResult) return next(new ApiError("Comment not found", 404));

  return res.status(200).json({
    message: "Successfully unliked comment",
  });
};

export const replyToComment = async (
  req: express.Request<{ commentId: string }, {}, { replyText: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));

  const userId = new ObjectId(req.user._id);
  //const postId = new ObjectId(req.params.postId);
  const parentId = new ObjectId(req.params.commentId);

  const replyText = req.body.replyText;

  const pushResult = await pushReplyToComment(parentId, userId, replyText);
  if (!pushResult) return next(new ApiError("Failed to reply to comment", 500));

  return res.status(200).json({ insertedId: pushResult.replyId });
};

export const likeReply = async (
  req: express.Request<{ commentId: string; replyId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));

  const commentId = new ObjectId(req.params.commentId);
  const replyId = new ObjectId(req.params.replyId);
  const userId = new ObjectId(req.user._id);

  const likeResult = await pushLikeToReply(userId, commentId, replyId);
  if (!likeResult.acknowledged)
    return next(new ApiError("Failed to like reply", 500));

  return res.status(200).json({
    message: "Successfully liked reply",
  });
};

export const unlikeReply = async (
  req: express.Request<{ commentId: string; replyId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));

  const commentId = new ObjectId(req.params.commentId);
  const replyId = new ObjectId(req.params.replyId);
  const userId = new ObjectId(req.user._id);

  const likeResult = await pullLikeFromReply(userId, commentId, replyId);
  if (!likeResult.acknowledged)
    return next(new ApiError("Failed to unlike reply", 500));

  return res.status(200).json({
    message: "Successfully unliked reply",
  });
};
