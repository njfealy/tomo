import { ObjectId, ClientSession } from "mongodb";
import { getDb } from "../utils/mongo";

export interface User {
  displayName: string;
  googleId: string;
  email?: string;
  friends?: ObjectId[];
  posts?: ObjectId[];
  friendRequestsIncoming?: ObjectId[];
  friendRequestsOutgoing?: ObjectId[];
}

const getUserCollection = () => {
  return getDb().collection<User>("users");
};

export const insertUser = async (displayName: string, googleId: string) => {
  const collection = getUserCollection();
  const user: User = {
    displayName,
    googleId,
  };

  return await collection.insertOne(user);
};

export const deleteUserById = async (
  userId: ObjectId,
  session?: ClientSession
) => {
  const collection = getUserCollection();

  return await collection.findOneAndDelete(userId, { session });
};

export const findUserByGoogleId = async (googleId: string) => {
  const collection = getUserCollection();

  return await collection.findOne({ googleId });
};

export const addFriend = async (
  userId: ObjectId,
  friendId: ObjectId,
  session?: ClientSession
) => {
  const collection = getUserCollection();

  return await collection.updateOne(
    { _id: userId },
    { $addToSet: { friends: friendId } },
    { session }
  );
};

export const pullFriend = async (
  userId: ObjectId,
  friendId: ObjectId,
  session?: ClientSession
) => {
  const collection = getUserCollection();

  return await collection.updateOne(
    { _id: userId },
    { $pull: { friends: friendId } },
    { session }
  );
};

export const addFriendRequestToReceiver = async (
  requestId: ObjectId,
  receiverId: ObjectId,
  session?: ClientSession
) => {
  const collection = getUserCollection();

  return await collection.updateOne(
    { _id: receiverId },
    { $addToSet: { friendRequestsIncoming: requestId } },
    { session }
  );
};

export const pullFriendRequestFromReceiver = async (
  requestId: ObjectId,
  receiverId: ObjectId,
  session?: ClientSession
) => {
  const collection = getUserCollection();

  return await collection.updateOne(
    { _id: receiverId },
    { $pull: { friendRequestsIncoming: requestId } },
    { session }
  );
};

export const addFriendRequestToSender = async (
  requestId: ObjectId,
  senderId: ObjectId,
  session?: ClientSession
) => {
  const collection = getUserCollection();

  return await collection.updateOne(
    { _id: senderId },
    { $addToSet: { friendRequestsOutgoing: requestId } },
    { session }
  );
};

export const pullFriendRequestFromSender = async (
  requestId: ObjectId,
  senderId: ObjectId,
  session?: ClientSession
) => {
  const collection = getUserCollection();

  return await collection.updateOne(
    { _id: senderId },
    { $pull: { friendRequestsOutgoing: requestId } },
    { session }
  );
};

export const addPostToUser = async (
  userId: ObjectId,
  postId: ObjectId,
  session?: ClientSession
) => {
  const collection = getUserCollection();

  return await collection.updateOne(
    { _id: userId },
    { $addToSet: { posts: postId } },
    { session }
  );
};

export const pullPostFromUser = async (
  userId: ObjectId,
  postId: ObjectId,
  session?: ClientSession
) => {
  const collection = getUserCollection();

  return await collection.updateOne(
    { _id: userId },
    { $pull: { post: postId } },
    { session }
  );
};

export const pullUserFromFriendsLists = async (
  userId: ObjectId,
  session?: ClientSession
) => {
  const collection = getUserCollection();

  return await collection.updateMany(
    { friends: userId },
    { $pull: { friends: userId } },
    { session }
  );
};
