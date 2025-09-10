import { ObjectId } from "mongodb";
import { getDb } from "@App/utils/mongo";

export type NotifType =
  | "newRequest"
  | "requestAccepted"
  | "postLike"
  | "postComment"
  | "commentLike"
  | "commentRespond";

export interface Notification {
  user: ObjectId;
  type: NotifType;
  date: Date;
  resource: ObjectId;
  actor: ObjectId;
}

export const getNotificationCollection = () => {
  return getDb().collection<Notification>("notifications");
};

export const insertNotification = async (
  userId: ObjectId,
  type: NotifType,
  resourceId: ObjectId,
  actorId: ObjectId,
  date?: Date
) => {
  const collection = getNotificationCollection();
  const notification: Notification = {
    user: userId,
    type,
    date: date ?? new Date(),
    resource: resourceId,
    actor: actorId,
  };

  return await collection.insertOne(notification);
};

export const deleteNotificationById = async (notificationId: ObjectId) => {
  const collection = getNotificationCollection();

  return await collection.findOneAndDelete({ _id: notificationId });
};

export const deleteNotificationByResource = async (resourceId: ObjectId) => {
  const collection = getNotificationCollection();

  return await collection.findOneAndDelete({ resource: resourceId });
};

export const getUserNotifications = async (userId: ObjectId) => {
  const collection = getNotificationCollection();

  return await collection
    .aggregate([
      {
        $match: {
          user: userId,
        },
      },
      {
        $sort: {
          date: 1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "actor",
          foreignField: "_id",
          as: "actor",
        },
      },

      {
        $unwind: "$actor",
      },
      {
        $project: {
          _id: 1,
          type: 1,
          date: 1,
          resource: 1,
          "actor._id": 1,
          "actor.displayName": 1,
          "actor.pictureUri": 1,
        },
      },
    ])
    .toArray();
};
