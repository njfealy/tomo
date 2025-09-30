import { ObjectId, ClientSession } from "mongodb";
import { getDb } from "../utils/mongo";

export interface Post {
  creator: ObjectId;
  text: string;
  media?: string;
  likes?: { user: ObjectId; date: Date }[];
  comments?: ObjectId[];
  date: Date;
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
    date: new Date(),
  };

  return await collection.insertOne(document, { session });
};

export const findPostById = async (postId: ObjectId) => {
  const collection = getPostCollection();

  return await collection
    .aggregate([
      { $match: { _id: postId } },

      // Join post creator
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: "$creator" },

      // Join post likes (array of users)
      {
        $lookup: {
          from: "users",
          localField: "likes",
          foreignField: "_id",
          as: "likes",
        },
      },

      // Join and populate comments
      {
        $lookup: {
          from: "comments",
          localField: "comments",
          foreignField: "_id",
          as: "comments",
          pipeline: [
            // Join comment creator
            {
              $lookup: {
                from: "users",
                localField: "creator",
                foreignField: "_id",
                as: "creator",
              },
            },
            { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },

            // Join comment likes
            {
              $lookup: {
                from: "users",
                localField: "likes",
                foreignField: "_id",
                as: "likes",
              },
            },

            {
              $lookup: {
                from: "users",
                localField: "replies.creator",
                foreignField: "_id",
                as: "replies.creator",
              },
            },
          ],
        },
      },

      // Final projection
      {
        $project: {
          _id: 1,
          text: 1,
          media: 1,
          date: 1,

          creator: {
            _id: "$creator._id",
            displayName: "$creator.displayName",
            pictureUri: "$creator.pictureUri",
          },

          likes: {
            $map: {
              input: "$likes",
              as: "user",
              in: {
                _id: "$$user._id",
                displayName: "$$user.displayName",
                pictureUri: "$$user.pictureUri",
              },
            },
          },

          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                _id: "$$comment._id",
                text: "$$comment.text",
                date: "$$comment.date",
                creator: {
                  _id: "$$comment.creator._id",
                  displayName: "$$comment.creator.displayName",
                  pictureUri: "$$comment.creator.pictureUri",
                },
                likes: {
                  $map: {
                    input: "$$comment.likes",
                    as: "user",
                    in: {
                      _id: "$$user._id",
                      displayName: "$$user.displayName",
                      pictureUri: "$$user.pictureUri",
                    },
                  },
                },
                replies: {
                  $map: {
                    input: "$$comment.replies",
                    as: "reply",
                    in: {
                      _id: "$$reply._id",
                      replyText: "$$reply.replyText",
                      date: "$$reply.date",
                      creator: {
                        _id: "$$reply.creator._id",
                        displayName: "$$reply.creator.displayName",
                        pictureUri: "$$reply.creator.pictureUri",
                      },
                      likes: {
                        $map: {
                          input: "$$reply.likes",
                          as: "user",
                          in: {
                            _id: "$$user._id",
                            displayName: "$$user.displayName",
                            pictureUri: "$$user.pictureUri",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ])
    .toArray()
    .then((result) => result[0]);
};

export const findPostsById = async (postIds: ObjectId[]) => {
  const collection = getPostCollection();

  const posts = await collection
    .aggregate([
      { $match: { _id: { $in: postIds } } },
      // 1. Join post creator
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: "$creator" },

      // 2. Join post likes
      {
        $lookup: {
          from: "users",
          localField: "likes.user",
          foreignField: "_id",
          as: "likes",
        },
      },

      // 3. Join and populate comments
      {
        $lookup: {
          from: "comments",
          localField: "comments",
          foreignField: "_id",
          as: "comments",
          pipeline: [
            // 3.1 Join comment creator
            {
              $lookup: {
                from: "users",
                localField: "creator",
                foreignField: "_id",
                as: "creator",
              },
            },
            { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },

            // 3.2 Join comment likes
            {
              $lookup: {
                from: "users",
                localField: "likes",
                foreignField: "_id",
                as: "likes",
              },
            },

            // 3.3 Collect reply creator IDs
            {
              $addFields: {
                replyCreatorIds: {
                  $map: {
                    input: "$replies",
                    as: "reply",
                    in: "$$reply.creator",
                  },
                },
              },
            },

            // 3.4 Lookup all reply creators
            {
              $lookup: {
                from: "users",
                localField: "replyCreatorIds",
                foreignField: "_id",
                as: "replyCreators",
              },
            },

            // 3.5 Collect reply like user IDs
            {
              $addFields: {
                replyLikeUserIds: {
                  $reduce: {
                    input: "$replies",
                    initialValue: [],
                    in: {
                      $concatArrays: ["$$value", "$$this.likes"],
                    },
                  },
                },
              },
            },

            // 3.6 Lookup all reply like users
            {
              $lookup: {
                from: "users",
                localField: "replyLikeUserIds",
                foreignField: "_id",
                as: "replyLikeUsers",
              },
            },
          ],
        },
      },

      // 4. Final projection
      {
        $project: {
          _id: 1,
          text: 1,
          media: 1,
          date: 1,

          creator: {
            _id: "$creator._id",
            displayName: "$creator.displayName",
            pictureUri: "$creator.pictureUri",
          },

          likes: {
            $map: {
              input: "$likes",
              as: "user",
              in: {
                _id: "$$user._id",
                displayName: "$$user.displayName",
                pictureUri: "$$user.pictureUri",
              },
            },
          },

          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                _id: "$$comment._id",
                text: "$$comment.text",
                date: "$$comment.date",

                creator: {
                  _id: "$$comment.creator._id",
                  displayName: "$$comment.creator.displayName",
                  pictureUri: "$$comment.creator.pictureUri",
                },

                likes: {
                  $map: {
                    input: "$$comment.likes",
                    as: "user",
                    in: {
                      _id: "$$user._id",
                      displayName: "$$user.displayName",
                      pictureUri: "$$user.pictureUri",
                    },
                  },
                },

                replies: {
                  $map: {
                    input: "$$comment.replies",
                    as: "reply",
                    in: {
                      _id: "$$reply._id",
                      replyText: "$$reply.replyText",
                      date: "$$reply.date",

                      creator: {
                        $let: {
                          vars: {
                            matchedUser: {
                              $first: {
                                $filter: {
                                  input: "$$comment.replyCreators",
                                  as: "rc",
                                  cond: {
                                    $eq: ["$$rc._id", "$$reply.creator"],
                                  },
                                },
                              },
                            },
                          },
                          in: {
                            _id: "$$matchedUser._id",
                            displayName: "$$matchedUser.displayName",
                            pictureUri: "$$matchedUser.pictureUri",
                          },
                        },
                      },

                      likes: {
                        $map: {
                          input: "$$reply.likes",
                          as: "likeId",
                          in: {
                            $let: {
                              vars: {
                                likedUser: {
                                  $first: {
                                    $filter: {
                                      input: "$$comment.replyLikeUsers",
                                      as: "user",
                                      cond: {
                                        $eq: ["$$user._id", "$$likeId"],
                                      },
                                    },
                                  },
                                },
                              },
                              in: {
                                _id: "$$likedUser._id",
                                displayName: "$$likedUser.displayName",
                                pictureUri: "$$likedUser.pictureUri",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ])
    .toArray();

  console.log(posts);
  return posts;
};

export const findAllPosts = async () => {
  const collection = getPostCollection();

  const posts = await collection
    .aggregate([
      // 1. Join post creator
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: "$creator" },

      // 2. Join post likes
      {
        $lookup: {
          from: "users",
          localField: "likes.user",
          foreignField: "_id",
          as: "likes",
        },
      },

      // 3. Join and populate comments
      {
        $lookup: {
          from: "comments",
          localField: "comments",
          foreignField: "_id",
          as: "comments",
          pipeline: [
            // 3.1 Join comment creator
            {
              $lookup: {
                from: "users",
                localField: "creator",
                foreignField: "_id",
                as: "creator",
              },
            },
            { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },

            // 3.2 Join comment likes
            {
              $lookup: {
                from: "users",
                localField: "likes",
                foreignField: "_id",
                as: "likes",
              },
            },

            // 3.3 Collect reply creator IDs
            {
              $addFields: {
                replyCreatorIds: {
                  $map: {
                    input: "$replies",
                    as: "reply",
                    in: "$$reply.creator",
                  },
                },
              },
            },

            // 3.4 Lookup all reply creators
            {
              $lookup: {
                from: "users",
                localField: "replyCreatorIds",
                foreignField: "_id",
                as: "replyCreators",
              },
            },

            // 3.5 Collect reply like user IDs
            {
              $addFields: {
                replyLikeUserIds: {
                  $reduce: {
                    input: "$replies",
                    initialValue: [],
                    in: {
                      $concatArrays: ["$$value", "$$this.likes"],
                    },
                  },
                },
              },
            },

            // 3.6 Lookup all reply like users
            {
              $lookup: {
                from: "users",
                localField: "replyLikeUserIds",
                foreignField: "_id",
                as: "replyLikeUsers",
              },
            },
          ],
        },
      },

      // 4. Final projection
      {
        $project: {
          _id: 1,
          text: 1,
          media: 1,
          date: 1,

          creator: {
            _id: "$creator._id",
            displayName: "$creator.displayName",
            pictureUri: "$creator.pictureUri",
          },

          likes: {
            $map: {
              input: "$likes",
              as: "user",
              in: {
                _id: "$$user._id",
                displayName: "$$user.displayName",
                pictureUri: "$$user.pictureUri",
              },
            },
          },

          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                _id: "$$comment._id",
                text: "$$comment.text",
                date: "$$comment.date",

                creator: {
                  _id: "$$comment.creator._id",
                  displayName: "$$comment.creator.displayName",
                  pictureUri: "$$comment.creator.pictureUri",
                },

                likes: {
                  $map: {
                    input: "$$comment.likes",
                    as: "user",
                    in: {
                      _id: "$$user._id",
                      displayName: "$$user.displayName",
                      pictureUri: "$$user.pictureUri",
                    },
                  },
                },

                replies: {
                  $map: {
                    input: "$$comment.replies",
                    as: "reply",
                    in: {
                      _id: "$$reply._id",
                      replyText: "$$reply.replyText",
                      date: "$$reply.date",

                      creator: {
                        $let: {
                          vars: {
                            matchedUser: {
                              $first: {
                                $filter: {
                                  input: "$$comment.replyCreators",
                                  as: "rc",
                                  cond: {
                                    $eq: ["$$rc._id", "$$reply.creator"],
                                  },
                                },
                              },
                            },
                          },
                          in: {
                            _id: "$$matchedUser._id",
                            displayName: "$$matchedUser.displayName",
                            pictureUri: "$$matchedUser.pictureUri",
                          },
                        },
                      },

                      likes: {
                        $map: {
                          input: "$$reply.likes",
                          as: "likeId",
                          in: {
                            $let: {
                              vars: {
                                likedUser: {
                                  $first: {
                                    $filter: {
                                      input: "$$comment.replyLikeUsers",
                                      as: "user",
                                      cond: {
                                        $eq: ["$$user._id", "$$likeId"],
                                      },
                                    },
                                  },
                                },
                              },
                              in: {
                                _id: "$$likedUser._id",
                                displayName: "$$likedUser.displayName",
                                pictureUri: "$$likedUser.pictureUri",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ])
    .toArray();

  console.log(posts);
  return posts;
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

export const addLikeToPost = async (
  postId: ObjectId,
  likerId: ObjectId,
  date: Date
) => {
  const collection = getPostCollection();

  const newLike = {
    user: likerId,
    date,
  };

  return await collection.findOneAndUpdate(
    {
      _id: postId,
    },
    {
      $addToSet: { likes: newLike },
    }
  );
};

export const pullLikeFromPost = async (
  postId: ObjectId,
  likerId: ObjectId,
  session?: ClientSession
) => {
  const collection = getPostCollection();

  return await collection.findOneAndUpdate(
    {
      _id: postId,
    },
    {
      $pull: { likes: { user: likerId } },
    },
    { session, returnDocument: "before" }
  );
};
