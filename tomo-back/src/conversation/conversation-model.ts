import { ObjectId } from "mongodb";
import { getDb } from "@App/utils/mongo";

export interface Conversation {
  members: ObjectId[];
  lastMessage?: ObjectId;
  isGroup: boolean;
  groupName: string | null;
}

export const getConversationCollection = () => {
  return getDb().collection<Conversation>("conversations");
};

export const insertConversation = async (members: ObjectId[]) => {
  const collection = getConversationCollection();
  const conversation: Conversation = {
    members,
    isGroup: false,
    groupName: null,
  };

  return await collection.insertOne(conversation);
};

export const findConversationById = async (conversationId: ObjectId) => {
  const collection = getConversationCollection();
  return await collection
    .aggregate([
      { $match: { _id: conversationId } },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "members",
        },
      },
      {
        $project: {
          "members.displayName": 1,
          "members._id": 1,
          "members.pictureUri": 1,
        },
      },
    ])
    .toArray();
};

export const findUserConversations = async (userId: ObjectId) => {
  const collection = getConversationCollection();
  const result = await collection
    .aggregate([
      {
        $match: {
          members: userId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "members",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "lastMessage",
          foreignField: "_id",
          as: "lastMessage",
        },
      },
      {
        $set: {
          lastMessage: { $arrayElemAt: ["$lastMessage", 0] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "lastMessage.sender",
          foreignField: "_id",
          as: "lastMessageSender",
        },
      },
      {
        $set: {
          "lastMessage.sender": { $arrayElemAt: ["$lastMessageSender", 0] },
        },
      },
      {
        $project: {
          "lastMessageSender": 0
        }
      }
      
    ])
    .toArray();
  //console.dir(result);
  return result;
};

export const updateConversationLastMessage = async (
  conversationId: ObjectId,
  newMessageId: ObjectId
) => {
  const collection = getConversationCollection();
  const conversation = await collection.findOneAndUpdate(
    { _id: conversationId },
    {
      $set: {
        lastMessage: newMessageId,
      },
    }
  );
};
