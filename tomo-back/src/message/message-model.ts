import { ObjectId, ClientSession } from "mongodb";
import { getDb } from "@App/utils/mongo";

export interface Message {
  content: string;
  sender: ObjectId;
  conversation: ObjectId;
  sentAt: Date;
}

export const getMessageCollection = () => {
  return getDb().collection<Message>("messages");
};

export const insertMessage = async (
  content: string,
  sender: ObjectId,
  conversation: ObjectId
) => {
  const collection = getMessageCollection();
  const message: Message = {
    content,
    sender,
    conversation,
    sentAt: new Date(),
  };

  return await collection.insertOne(message);
};

export const updateMessageById = async (
  messageId: ObjectId,
  newContent: string
) => {
  const collection = getMessageCollection();

  return await collection.findOneAndUpdate(
    { _id: messageId },
    { $set: { content: newContent } }
  );
};

export const deleteMessageById = async (messageId: ObjectId) => {
  const collection = getMessageCollection();

  return await collection.findOneAndDelete({ _id: messageId });
};

export const findMessagesByConversation = async (conversationId: ObjectId) => {
  const collection = getMessageCollection();

  return await collection.find({ conversation: conversationId });
};
