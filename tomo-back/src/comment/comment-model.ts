import { ObjectId, ClientSession } from "mongodb";
import { getDb } from "../utils/mongo";

export interface Reply {
  _id: ObjectId;
  creator: ObjectId;
  //mentions: ObjectId[];
  replyText: string;
  date: Date;
  likes: ObjectId[];
}

export interface Comment {
  post: ObjectId;
  creator: ObjectId;
  text: string;
  likes: ObjectId[];
  date: Date;
  replies: Reply[];
}

const getCommentCollection = () => {
  return getDb().collection<Comment>("comments");
};

export const insertComment = async (
  postId: ObjectId,
  creatorId: ObjectId,
  text: string,
  date: Date,
  session?: ClientSession
) => {
  const collection = getCommentCollection();
  const document: Comment = {
    post: postId,
    creator: creatorId,
    text,
    date,
    likes: [],
    replies: [],
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

export const addLikeToComment = async (
  commentId: ObjectId,
  userId: ObjectId,
  session?: ClientSession
) => {
  const collection = getCommentCollection();

  return await collection.findOneAndUpdate(
    { _id: commentId },
    {
      $addToSet: {
        likes: userId,
      },
    },
    {
      session,
    }
  );
};

export const pullLikeFromComment = async (
  commentId: ObjectId,
  userId: ObjectId,
  session?: ClientSession
) => {
  const collection = getCommentCollection();

  return await collection.findOneAndUpdate(
    { _id: commentId },
    {
      $pull: {
        likes: userId,
      },
    },
    {
      session,
    }
  );
};

export const pushReplyToComment = async (
  commentId: ObjectId,
  userId: ObjectId,
  replyText: string,
  session?: ClientSession
) => {
  const collection = getCommentCollection();

  const _id = new ObjectId();
  const newReply: Reply = {
    _id,
    creator: userId,
    replyText,
    date: new Date(),
    likes: [],
  };

  const updateResult = await collection.findOneAndUpdate(
    { _id: commentId },
    {
      $push: {
        replies: newReply,
      },
    },
    {
      session,
    }
  );

  if (updateResult)
    return { replyId: _id.toString(), updatedComment: updateResult };
  return null;
};

export const pushLikeToReply = async (
  userId: ObjectId,
  commentId: ObjectId,
  replyId: ObjectId
) => {
  const collection = getCommentCollection();

  const result = await collection.updateOne(
    {
      _id: commentId,
      "replies._id": replyId,
      "replies.likes": { $ne: userId },
    },
    {
      $addToSet: { "replies.$[reply].likes": userId },
    },
    {
      arrayFilters: [{ "reply._id": replyId }],
    }
  );

  return result;
};

export const pullLikeFromReply = async (
  userId: ObjectId,
  commentId: ObjectId,
  replyId: ObjectId,
) => {
  const collection = getCommentCollection();
  
  const result = await collection.updateOne(
    {
      _id: commentId,
      "replies._id": replyId,
      "replies.likes": { $ne: userId }
    },
    {
      $pull: { "replies.$[reply].likes": userId }
    },
    {
      arrayFilters: [
        { "reply._id": replyId }
      ]
    }
  );

  return result;
    
}