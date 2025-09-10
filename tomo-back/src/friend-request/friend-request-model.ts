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

export const getUserFriendRequests = async (userId: ObjectId) => {
  const collection = getFriendRequestCollection();

  return await collection
    .aggregate([
      {
        $match: {
          receiverId: userId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "sender",
        },
      },
      {
        $unwind: "$sender",
      },
      {
        $lookup: {
          from: "users",
          localField: "receiverId",
          foreignField: "_id",
          as: "receiver",
        },
      },
      {
        $unwind: "$receiver",
      },
      {
        $set: {
          mutualFriends: {
            $setIntersection: ["$sender.friends", "$receiver.friends"]
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "mutualFriends",
          foreignField: "_id",
          as: "mutualFriends",
        },
      },
      {
        $project: {
          _id: 1,
          sentAt: 1,
          "sender._id": 1,
          "sender.displayName": 1,
          "sender.pictureUri": 1,
          "mutualFriends._id": 1,
          "mutualFriends.displayName": 1,
          "mutualFriends.pictureUri": 1,
        },
      },
    ])
    .toArray();
};
