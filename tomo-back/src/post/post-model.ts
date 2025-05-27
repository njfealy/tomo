import { Db, ObjectId, WithId, Document, ClientSession } from "mongodb";
import { getDb } from "../utils/mongo";

export interface Post {
  creator: ObjectId;
  text: string;
  media?: string;
  likes?: ObjectId[];
  comments?: ObjectId[];
}

const getPostCollection = () => {
  return getDb().collection<Post>("posts");
};

export const insertPost = async (
  creatorId: ObjectId,
  text: string,
  session?: ClientSession
) => {
  const collection = getPostCollection();
  const document: Post = {
    creator: creatorId,
    text,
  };

  return await collection.insertOne(document, { session });
};

export const findPostById = async (postId: ObjectId) => {
  const collection = getPostCollection();

  return await collection.findOne<Post>(postId);
};

export const deletePostById = async (
  postId: ObjectId,
  session?: ClientSession
) => {
  const collection = getPostCollection();

  return await collection.findOneAndDelete(postId, { session });
};

export const deletePostsByUserId = async (
  userId: ObjectId,
  session?: ClientSession
) => {
  const collection = getPostCollection();

  return await collection.deleteMany({ creator: userId }, { session });
};

export const addCommentToPost = async (
  postId: ObjectId,
  commentId: ObjectId,
  session?: ClientSession
) => {
  const collection = getPostCollection();

  return await collection.findOneAndUpdate(
    {
      _id: postId,
    },
    {
      $addToSet: { comments: commentId },
    },
    { session }
  );
};

export const pullCommentFromPost = async (
  postId: ObjectId,
  commentId: ObjectId,
  session?: ClientSession
) => {
  const collection = getPostCollection();

  return await collection.findOneAndUpdate(
    {
      _id: postId,
    },
    { $pull: { comments: commentId } },
    { session }
  );
};

export const addLikeToPost = async (postId: ObjectId, likerId: ObjectId) => {
  const collection = getPostCollection();

  return await collection.findOneAndUpdate(
    {
      _id: postId,
    },
    {
      $addToSet: { likes: likerId },
    }
  );
};

export const pullLikeFromPost = async (postId: ObjectId, likerId: ObjectId) => {
  const collection = getPostCollection();

  return await collection.findOneAndUpdate(
    {
      _id: postId,
    },
    {
      $pull: { likes: likerId },
    }
  );
};
