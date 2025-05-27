import express from "express";

import {
  CreateUserRequest,
  RemoveFriendRequest,
  SendFriendRequestRequest,
} from "./user.types";
import {
  addFriendRequestToReceiver,
  addFriendRequestToSender,
  addFriend,
  deleteUserById,
  insertUser,
  pullFriendRequestFromReceiver,
  pullFriendRequestFromSender,
  pullFriend,
  pullUserFromFriendsLists,
} from "./user-model";

import { ObjectId } from "mongodb";
import { getClient } from "../utils/mongo";
import { ApiError } from "../utils/api-error";
import { deletePostsByUserId } from "../post/post-model";
import { deleteCommentsByUserId } from "../comment/comment-model";
import {
  insertFriendRequest,
  pullFriendRequest,
} from "../friend-request/friend-request-model";

export const createUser = async (
  req: express.Request<{}, {}, CreateUserRequest>,
  res: express.Response,
  next: express.NextFunction
) => {
  const username = req.body.username;
  const email = req.body.email;

  const insertUserResult = await insertUser(username, email);
  if (!insertUserResult.acknowledged)
    return next(new ApiError("DB Error", 500));

  const userId = insertUserResult.insertedId;
  return res.status(201).json({ message: "User created", userId });
};

export const deleteUser = async (
  req: express.Request<{userId: string}>,
  res: express.Response,
  next: express.NextFunction
) => {
  const userId = new ObjectId(req.params.userId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const deletedUser = await deleteUserById(userId, session);
    if (!deletedUser)
      throw new ApiError(`Could not find User with ID=${userId}`);

    const deleteUserPostsResult = await deletePostsByUserId(userId, session);
    if (!deleteUserPostsResult.acknowledged)
      throw new ApiError("DB Error", 500);

    const deleteUserCommentsResult = await deleteCommentsByUserId(
      userId,
      session
    );
    if (!deleteUserCommentsResult.acknowledged)
      throw new ApiError("DB Error", 500);

    const removeFriendsResult = await pullUserFromFriendsLists(userId, session);
    if (!removeFriendsResult.acknowledged) throw new ApiError("DB Error", 500);
    if (removeFriendsResult.matchedCount !== deletedUser.friends?.length)
      throw new ApiError("DB Error", 500);

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  return res.status(204).json({ message: `Deleted User with ID=${userId}` });
};

export const sendFriendRequest = async (
  req: express.Request<{userId: string}, {}, SendFriendRequestRequest>,
  res: express.Response,
  next: express.NextFunction
) => {
  const senderId = new ObjectId(req.body.senderId);
  const receiverId = new ObjectId(req.params.userId);

  const session = getClient().startSession();
  let insertResult;
  try {
    session.startTransaction();

    insertResult = await insertFriendRequest(senderId, receiverId, session);
    if (!insertResult.acknowledged)
      throw new ApiError("Failed to insert Friend Request", 500);

    const addToReceiverResult = await addFriendRequestToReceiver(
      insertResult.insertedId,
      receiverId,
      session
    );
    if (!addToReceiverResult.acknowledged)
      throw new ApiError("Failed to insert Friend Request", 500);

    const addToSenderResult = await addFriendRequestToSender(
      insertResult.insertedId,
      senderId,
      session
    );
    if (!addToSenderResult.acknowledged)
      throw new ApiError("Failed to insert Friend Request", 500);

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  return res.status(201).json({
    message: `Created new Friend Request with ID=${insertResult.insertedId}`,
  });
};

export const cancelFriendRequest = async (
  req: express.Request<{requestId: string}>,
  res: express.Response,
  next: express.NextFunction
) => {
  const requestId = new ObjectId(req.params.requestId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const deletedRequest = await pullFriendRequest(requestId);
    if (!deletedRequest)
      throw new ApiError("Failed to delete Friend Request", 500);

    const pullFromSenderResult = await pullFriendRequestFromSender(
      requestId,
      deletedRequest.senderId,
      session
    );
    if (!pullFromSenderResult.acknowledged)
      throw new ApiError("Failed to delete Friend Request", 500);

    const pullFromReceiverResult = await pullFriendRequestFromReceiver(
      requestId,
      deletedRequest.receiverId,
      session
    );
    if (!pullFromReceiverResult.acknowledged)
      throw new ApiError("Failed to delete Friend Request", 500);

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  res.status(200).json({ message: "Successfully cancelled Friend Request" });
};

export const acceptFriendRequest = async (
  req: express.Request<{requestId: string}>,
  res: express.Response,
  next: express.NextFunction
) => {
  const requestId = new ObjectId(req.params.requestId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const acceptedRequest = await pullFriendRequest(requestId);
    if (!acceptedRequest)
      throw new ApiError("Failed to accept Friend Request", 500);

    const pullFromSenderResult = await pullFriendRequestFromSender(
      requestId,
      acceptedRequest.senderId,
      session
    );
    if (!pullFromSenderResult.acknowledged)
      throw new ApiError("Failed to accept Friend Request", 500);

    const pullFromReceiverResult = await pullFriendRequestFromReceiver(
      requestId,
      acceptedRequest.receiverId,
      session
    );
    if (!pullFromReceiverResult.acknowledged)
      throw new ApiError("Failed to accept Friend Request", 500);

    const addFriendToSenderResult = await addFriend(
      acceptedRequest.senderId,
      acceptedRequest.receiverId,
      session
    );
    if (!addFriendToSenderResult.acknowledged)
      throw new ApiError("Failed to accept Friend Request");

    const addFriendToReceiverResult = await addFriend(
      acceptedRequest.receiverId,
      acceptedRequest.senderId,
      session
    );
    if (!addFriendToReceiverResult.acknowledged)
      throw new ApiError("Failed to accept Friend Request");

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  res.status(200).json({ message: "Successfully accepted Friend Request" });
};

export const declineFriendRequest = async (
  req: express.Request<{requestId: string}>,
  res: express.Response,
  next: express.NextFunction
) => {
  const requestId = new ObjectId(req.params.requestId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const deletedRequest = await pullFriendRequest(requestId);
    if (!deletedRequest)
      throw new ApiError("Failed to delete Friend Request", 500);

    const pullFromSenderResult = await pullFriendRequestFromSender(
      requestId,
      deletedRequest.senderId,
      session
    );
    if (!pullFromSenderResult.acknowledged)
      throw new ApiError("Failed to delete Friend Request", 500);

    const pullFromReceiverResult = await pullFriendRequestFromReceiver(
      requestId,
      deletedRequest.receiverId,
      session
    );
    if (!pullFromReceiverResult.acknowledged)
      throw new ApiError("Failed to delete Friend Request", 500);

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  res.status(200).json({ message: "Successfully declined Friend Request" });
};

export const removeFriend = async (
  req: express.Request<{}, {}, RemoveFriendRequest>,
  res: express.Response,
  next: express.NextFunction
) => {
  const userId = new ObjectId(req.body.userId);
  const friendId = new ObjectId(req.body.friendId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const removeFromUserResult = await pullFriend(userId, friendId, session);
    if (!removeFromUserResult.acknowledged)
      throw new ApiError("Failed to remove Friend", 500);

    const removeFromFriendResult = await pullFriend(friendId, userId, session);
    if (!removeFromFriendResult.acknowledged)
      throw new ApiError("Failed to remove Friend", 500);

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  res.status(200).json({ message: "Successfully removed Friend" });
};
