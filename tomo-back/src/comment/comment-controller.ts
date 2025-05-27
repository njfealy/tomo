import express from "express";
import {
  MakeCommentRequest,
  DeleteCommentRequest,
  EditCommentRequest,
} from "./comment.types";

import {
  insertComment,
  deleteCommentById,
  updateCommentById,
} from "./comment-model";
import { addCommentToPost, pullCommentFromPost } from "../post/post-model";

import { ObjectId } from "mongodb";
import { getClient } from "@App/utils/mongo";
import { ApiError } from "@App/utils/api-error";

export const makeComment = async (
  req: express.Request<{ postId: string }, {}, MakeCommentRequest>,
  res: express.Response,
  next: express.NextFunction
) => {
  const postId = new ObjectId(req.params.postId);
  const creatorId = new ObjectId(req.body.creatorId);
  const commentText = req.body.text;

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const insertCommentResult = await insertComment(
      postId,
      creatorId,
      commentText,
      session
    );
    if (!insertCommentResult || !insertCommentResult.acknowledged)
      throw new ApiError("DB Error", 500);

    const commentId = insertCommentResult.insertedId;

    const addToPostResult = await addCommentToPost(postId, commentId, session);
    if (!addToPostResult) throw new ApiError("DB Error");

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  return res
    .status(201)
    .json({ message: `Comment made on Post ID =${postId}` });
};

export const deleteComment = async (
  req: express.Request<{ postId: string }, {}, DeleteCommentRequest>,
  res: express.Response,
  next: express.NextFunction
) => {
  const postId = new ObjectId(req.params.postId);
  const commentId = new ObjectId(req.body.commentId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const deleteCommentResult = await deleteCommentById(commentId);
    if (!deleteCommentResult)
      throw new ApiError(`Could not find Comment with ID=${commentId}`, 404);

    const pullCommentFromPostResult = await pullCommentFromPost(
      postId,
      commentId,
      session
    );
    if (!pullCommentFromPostResult)
      throw new ApiError(`Could not find Post with ID=${postId}`, 404);

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
  req: express.Request<{}, {}, EditCommentRequest>,
  res: express.Response,
  next: express.NextFunction
) => {
  const commentId = new ObjectId(req.body.commentId);
  const newText = req.body.newText;

  const editResult = await updateCommentById(commentId, newText);
  if (!editResult)
    return next(
      new ApiError(`Could not find Comment with ID=${commentId}`, 404)
    );
  return res
    .status(204)
    .json({ message: `Edited Comment with ID=${commentId}` });
};