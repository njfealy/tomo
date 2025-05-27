import { ObjectId, ClientSession } from "mongodb";
import { getDb } from "../utils/mongo";
import { get } from "http";

export interface Comment {
  post: ObjectId;
  creator: ObjectId;
  text: string;
  likes?: ObjectId[];
}

const getCommentCollection = () => {
  return getDb().collection<Comment>("comments");
};

export const insertComment = async (
  postId: ObjectId,
  creatorId: ObjectId,
  text: string,
  session?: ClientSession
) => {
  const collection = getCommentCollection();
  const document: Comment = {
    post: postId,
    creator: creatorId,
    text,
  };

  return await collection.insertOne(document, { session });
};

export const findCommentById = async (commentId: ObjectId) => {
  const collection = getCommentCollection();

  return await collection.findOne<Comment>(commentId);
};

export const deleteCommentById = async (
  commentId: ObjectId,
  session?: ClientSession
) => {
  const collection = getCommentCollection();

  return await collection.findOneAndDelete(commentId, { session });
};

export const updateCommentById = async (
  commentId: ObjectId,
  newText: string
) => {
  const collection = getCommentCollection();

  return await collection.findOneAndUpdate(
    { _id: commentId },
    { $set: { text: newText } }
  );
};

export const deleteCommentsByPostId = async (
  postId: ObjectId,
  session?: ClientSession
) => {
  const collection = getCommentCollection();

  return await collection.deleteMany({ post: postId }, { session });
};

export const deleteCommentsByUserId = async (
  userId: ObjectId,
  session?: ClientSession
) => {
  const collection = getCommentCollection();

  return await collection.deleteMany({ creator: userId }, { session });
};
