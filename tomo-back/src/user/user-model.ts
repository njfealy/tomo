import { ObjectId, ClientSession } from "mongodb";
import { getDb } from "../utils/mongo";

export interface User {
  displayName: string;
  googleId: string;
  pictureUri: string;
  email?: string;
  friends: ObjectId[];
  posts?: ObjectId[];
  friendRequestsIncoming?: ObjectId[];
  friendRequestsOutgoing?: ObjectId[];
}

export const getUserCollection = () => {
  return getDb().collection<User>("users");
};

export const insertUser = async (
  displayName: string,
  googleId: string,
  pictureUri?: string
) => {
  const collection = getUserCollection();
  const user: User = {
    displayName,
    googleId,
    pictureUri:
      pictureUri ||
      "https://www.vectorstock.com/royalty-free-vectors/blank-profile-picture-vectors",
    friends: [],
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

  return await collection.findOne({ googleId: googleId });
};

export const findUserByUserId = async (userId: ObjectId) => {
  const collection = getUserCollection();
  //console.log("getting public user");
  return await collection.findOne({ _id: userId });
};

export const findPublicUserByUserId = async (userId: ObjectId) => {
  const collection = getUserCollection();
  return await collection
    .aggregate([
      {
        $match: {
          _id: userId,
        },
      },
      {
        $project: {
          _id: 1,
          displayName: 1,
          pictureUri: 1,
        },
      },
    ])
    .toArray()
    .then((result) => result[0]);
};

export const findPrivateUserByUserId = async (
  userId: ObjectId,
  authId: ObjectId
) => {
  console.log("getting private user");
  const collection = getUserCollection();

  console.log("user", userId);
  console.log("auth", authId);

  const result = await collection
    .aggregate([
      {
        $match: {
          _id: userId,
        },
      },
      {
        $lookup: {
          from: "friend-requests",
          foreignField: "_id",
          localField: "friendRequestsIncoming",
          as: "friendRequestsIncoming",
        },
      },
      {
        $lookup: {
          from: "friend-requests",
          foreignField: "_id",
          localField: "friendRequestsOutgoing",
          as: "friendRequestsOutgoing",
        },
      },
      {
        $addFields: {
          friendStatus: {
            $switch: {
              branches: [
                {
                  case: { $in: [authId, { $ifNull: ["$friends", []] }] },
                  then: { status: "friend" },
                },

                {
                  case: {
                    $in: [
                      authId,
                      { $ifNull: ["$friendRequestsIncoming.senderId", []] },
                    ],
                  },
                  then: {
                    $let: {
                      vars: {
                        matched: {
                          $first: {
                            $filter: {
                              input: "$friendRequestsIncoming",
                              as: "req",
                              cond: { $eq: ["$$req.senderId", authId] },
                            },
                          },
                        },
                      },
                      in: {
                        status: "pending",
                        requestId: "$$matched._id",
                      },
                    },
                  },
                },

                {
                  case: {
                    $in: [
                      authId,
                      { $ifNull: ["$friendRequestsOutgoing.receiverId", []] },
                    ],
                  },
                  then: {
                    $let: {
                      vars: {
                        matched: {
                          $first: {
                            $filter: {
                              input: "$friendRequestsOutgoing",
                              as: "req",
                              cond: { $eq: ["$$req.receiverId", authId] },
                            },
                          },
                        },
                      },
                      in: {
                        status: "unanswered",
                        requestId: "$$matched._id",
                      },
                    },
                  },
                },
              ],
              default: { status: null, requestId: null },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          displayName: 1,
          friendStatus: 1,
          friends: 1,
          pictureUri: 1,
        },
      },
    ])
    .toArray();

  return result[0];
};

export const findPublicUsersByName = async (queryString: string) => {
  const collection = getUserCollection();

  return await collection
    .aggregate([
      {
        $match: { $text: { $search: queryString } },
      },
      {
        $project: {
          _id: 1,
          displayName: 1,
          pictureUri: 1,
        },
      },
    ])
    .toArray();
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

export const getUserPicture = async (userId: ObjectId) => {
  const collection = getUserCollection();

  return await collection.findOne(
    { _id: userId },
    {
      projection: {
        pictureUri: 1,
      },
    }
  );
};

export const pullNotificationFromUser = async (
  userId: ObjectId,
  notificationId: ObjectId
) => {
  const collection = getUserCollection();

  return await collection.updateOne(
    { _id: userId },
    { $pull: { notifications: { _id: notificationId } } },
  );
};
