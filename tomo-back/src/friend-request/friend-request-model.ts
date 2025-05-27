import { ObjectId, ClientSession } from "mongodb";
import { getDb } from "../utils/mongo";

export interface FriendRequest {
  senderId: ObjectId;
  receiverId: ObjectId;
  sentAt: Date;
}

const getFriendRequestCollection = () => {
  return getDb().collection<FriendRequest>("friend-requests");
};

export const insertFriendRequest = async (
  senderId: ObjectId,
  receiverId: ObjectId,
  session?: ClientSession
) => {
  const collection = getFriendRequestCollection();

  const request: FriendRequest = {
    senderId,
    receiverId,
    sentAt: new Date(),
  };

  return await collection.insertOne(request, { session });
};

export const pullFriendRequest = async (
  requestId: ObjectId,
  session?: ClientSession
) => {
  const collection = getFriendRequestCollection();

  return await collection.findOneAndDelete({ _id: requestId }, { session });
};