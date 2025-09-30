import express from "express";

import { CreateUserRequest, RemoveFriendRequest } from "./user.types";
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
  getUserCollection,
  findPublicUsersByName,
  findPrivateUserByUserId,
  findUserByUserId,
  findPublicUserByUserId,
  pullNotificationFromUser,
} from "./user-model";

import { ObjectId } from "mongodb";
import { getClient } from "../utils/mongo";
import { ApiError } from "../utils/api-error";
import { deletePostsByUserId } from "../post/post-model";
import { deleteCommentsByUserId } from "../comment/comment-model";
import {
  getUserFriendRequests,
  insertFriendRequest,
  pullFriendRequest,
} from "../friend-request/friend-request-model";
import { insertConversation } from "@App/conversation/conversation-model";
import {
  deleteNotificationById,
  deleteNotificationByResource,
  insertNotification,
} from "@App/notification/notification-model";
import { getIO, userSocketMap } from "@App/utils/socket";

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
  req: express.Request<{ userId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  const userId = new ObjectId(req.params.userId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    const deletedUser = await deleteUserById(userId, session);
    if (!deletedUser)
      throw new ApiError(`Could not find User with ID=${userId}`, 404);

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
  req: express.Request<{ userId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log("sent friend request");
  if (!req.user) return new ApiError("Unauthorized", 401);
  const senderId = new ObjectId(req.user._id);
  const receiverId = new ObjectId(req.params.userId);

  const session = getClient().startSession();
  let insertResult;
  try {
    session.startTransaction();

    //Creates friend request in collection
    insertResult = await insertFriendRequest(senderId, receiverId, session);
    if (!insertResult.acknowledged)
      throw new ApiError("Failed to insert Friend Request", 500);

    //Pushes request onto receiver's incoming requests
    const addToReceiverResult = await addFriendRequestToReceiver(
      insertResult.insertedId,
      receiverId,
      session
    );
    if (!addToReceiverResult.acknowledged)
      throw new ApiError("Failed to insert Friend Request", 500);

    //Pushes request onto sender's outgoing requests
    const addToSenderResult = await addFriendRequestToSender(
      insertResult.insertedId,
      senderId,
      session
    );
    if (!addToSenderResult.acknowledged)
      throw new ApiError("Failed to insert Friend Request", 500);

    //Create new notification and send to receiver
    const date = new Date();
    const insertNotificationResult = await insertNotification(
      receiverId,
      "newRequest",
      insertResult.insertedId,
      senderId,
      date
    );
    if (!insertNotificationResult.acknowledged)
      throw new ApiError("Failed to insert Friend Request", 500);

    const userSockets = userSocketMap.get(req.params.userId);

    const sender = await findPublicUserByUserId(senderId);

    if (userSockets) {
      userSockets.forEach((socket) => {
        socket.emit(
          "notification",
          "newRequest",
          insertNotificationResult.insertedId,
          sender,
          date
        );
      });
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }

  return res.status(201).json({
    message: `Created new Friend Request with ID=${insertResult.insertedId}`,
    requestId: insertResult.insertedId.toString(),
  });
};

export const cancelFriendRequest = async (
  req: express.Request<{ requestId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log(req.params.requestId);
  const requestId = new ObjectId(req.params.requestId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    //Delete friend request from collection
    const deletedRequest = await pullFriendRequest(requestId);
    if (!deletedRequest)
      throw new ApiError("Failed to delete Friend Request", 500);

    //Remove friend request from sender's outgoing requests
    const pullFromSenderResult = await pullFriendRequestFromSender(
      requestId,
      deletedRequest.senderId,
      session
    );
    if (!pullFromSenderResult.acknowledged)
      throw new ApiError("Failed to delete Friend Request", 500);

    //Remove friend request from receiver's incoming requests
    const pullFromReceiverResult = await pullFriendRequestFromReceiver(
      requestId,
      deletedRequest.receiverId,
      session
    );
    if (!pullFromReceiverResult.acknowledged)
      throw new ApiError("Failed to delete Friend Request", 500);

    //Delete notifcation created from sending friend request
    const deleteNotificationResult = await deleteNotificationByResource(
      deletedRequest._id
    );
    if (!deleteNotificationResult)
      throw new ApiError("Failed to delete Friend Request", 500);

    //Remove notification from receiver's notifications
    const pullNotifFromReceiverResult = await pullNotificationFromUser(
      deletedRequest.receiverId,
      deleteNotificationResult._id
    );
    if (!pullNotifFromReceiverResult.acknowledged)
      throw new ApiError("Failed to pull Notification from Receiver", 500);

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
  req: express.Request<{ requestId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));
  const requestId = new ObjectId(req.params.requestId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    //Deletes friend request from collection
    const acceptedRequest = await pullFriendRequest(requestId);
    if (!acceptedRequest)
      throw new ApiError("Failed to accept Friend Request", 500);
    if (acceptedRequest.receiverId.toString() !== req.user._id)
      throw new ApiError("Unauthorized", 401);

    //Removes request from Sender's outgoing requests
    const pullFromSenderResult = await pullFriendRequestFromSender(
      requestId,
      acceptedRequest.senderId,
      session
    );
    if (!pullFromSenderResult.acknowledged)
      throw new ApiError("Failed to accept Friend Request", 500);

    //Removes request from Receiver's incoming requests
    const pullFromReceiverResult = await pullFriendRequestFromReceiver(
      requestId,
      acceptedRequest.receiverId,
      session
    );
    if (!pullFromReceiverResult.acknowledged)
      throw new ApiError("Failed to accept Friend Request", 500);

    //Push users onto each other's friends lists
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

    //Create new conversation between the two users
    const insertConversationResult = await insertConversation([
      acceptedRequest.receiverId,
      acceptedRequest.senderId,
    ]);
    if (!insertConversationResult.acknowledged)
      throw new ApiError("Failed to add Users to Conversation", 500);

    //Create accepted notification document to Sender
    const date = new Date();
    const insertNotificationResult = await insertNotification(
      acceptedRequest.senderId,
      "requestAccepted",
      acceptedRequest._id,
      acceptedRequest.receiverId,
      date
    );
    if (!insertNotificationResult.acknowledged)
      throw new ApiError(
        "Failed to create Notification for Friend Request",
        500
      );

    //Emits accepted notification via socket to Sender
    const userSockets = userSocketMap.get(acceptedRequest.senderId.toString());
    const receiver = await findPublicUserByUserId(acceptedRequest.receiverId);

    if (userSockets) {
      userSockets.forEach((socket) => {
        socket.emit(
          "notification",
          "acceptedRequest",
          insertNotificationResult.insertedId,
          receiver,
          date
        );
      });
    }

    //Now that request is accepted, deleted request notification and pulls from Receiver
    const deletedNotif = await deleteNotificationByResource(
      acceptedRequest._id
    );
    if (deletedNotif) {
      const pullNotifFromReceiverResult = await pullNotificationFromUser(
        acceptedRequest.receiverId,
        deletedNotif._id
      );
      if (!pullNotifFromReceiverResult.acknowledged)
        throw new ApiError(
          "Failed to pull Request Notification from Receiver",
          500
        );
    }

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
  req: express.Request<{ requestId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));
  const requestId = new ObjectId(req.params.requestId);

  const session = getClient().startSession();
  try {
    session.startTransaction();

    //Delete friend request from collection
    const deletedRequest = await pullFriendRequest(requestId);
    if (!deletedRequest) throw new ApiError("Friend Request not found", 404);
    if (deletedRequest.receiverId.toString() != req.user._id)
      throw new ApiError("Unauthorized", 401);

    //Remove request from sender's outgoing requests
    const pullFromSenderResult = await pullFriendRequestFromSender(
      requestId,
      deletedRequest.senderId,
      session
    );
    if (!pullFromSenderResult.acknowledged)
      throw new ApiError("Failed to delete Friend Request", 500);

    //Remove request from receiver's incoming requests
    const pullFromReceiverResult = await pullFriendRequestFromReceiver(
      requestId,
      deletedRequest.receiverId,
      session
    );
    if (!pullFromReceiverResult.acknowledged)
      throw new ApiError("Failed to delete Friend Request", 500);

    //Delete request notification
    const pulledNotification = await deleteNotificationByResource(
      deletedRequest._id
    );
    if (!pulledNotification) throw new ApiError("Notification not found", 404);

    //Remove notification from receiver's notifications
    const pullNotifFromReceiverResult = await pullNotificationFromUser(
      deletedRequest.receiverId,
      pulledNotification._id
    );

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

export const getFriends = async (
  req: express.Request<{ userId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  const userId = new ObjectId(req.params.userId);
  // const user = await findUserByUserId(userId);
  // if (!user) return next(new ApiError("User not found", 404));

  // res.status(200).json(user.friends)

  const collection = getUserCollection();
  const friends = await collection
    .aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: "users",
          localField: "friends",
          foreignField: "_id",
          as: "friendsDetails",
        },
      },
      {
        $project: {
          _id: 0,
          friends: "$friendsDetails",
        },
      },
      { $unwind: "$friends" },
      { $replaceRoot: { newRoot: "$friends" } },
      { $project: { friends: 0 } },
    ])
    .toArray();
  if (req.user && req.params.userId == req.user._id) {
    const friendRequests = await getUserFriendRequests(userId);
    return res
      .status(200)
      .json({ friends: friends, friendRequests: friendRequests });
  }

  return res.status(200).json(friends);
};

export const searchUsersByName = async (
  req: express.Request<{}, {}, { search: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  const name = req.body.search;
  let searchResult = await findPublicUsersByName(req.body.search);
  if (req.user) {
    const authId = req.user._id;
    searchResult = searchResult.filter((user) => user._id != authId);
  }

  res.status(200).json(searchResult);
};

export const getUserData = async (
  req: express.Request<{ userId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  const userId = new ObjectId(req.params.userId);
  let user;
  console.log("finding user", req.user);
  if (req.user) {
    const authId = new ObjectId(req.user._id);
    user = await findPrivateUserByUserId(userId, authId);
  } else {
    user = await findUserByUserId(userId);
  }

  if (!user) return next(new ApiError("User not found", 404));
  return res.status(200).json(user);
};
