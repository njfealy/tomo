import { getConversationCollection } from "@App/conversation/conversation-model";
import { ApiError } from "@App/utils/api-error";
import express from "express";
import { ObjectId } from "mongodb";

export const setupSocket = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) return next(new ApiError("Unauthorized", 401));
  const userId = new ObjectId(req.user._id);
  try {
    console.log(userId.toString())
    const convoCollection = getConversationCollection();
    const convoRooms = await convoCollection.aggregate([
      {
        $match: {
          members: userId
        },
      },
      {
        $project: {
            _id: 1
        }
      },
      {
        $group: {
            _id: null,
            ids: { $push: "$_id"},
        }
      },
      {
        $project: {
            _id: 0,
            ids: 1
        }
      }
    ]).toArray();

    console.log("convo rooms: ", convoRooms);
    return res.status(200).json(convoRooms[0] || {ids: []} );
  } catch (error) {
    console.log(error);
    return next(new ApiError((error as Error).message, 500));
  }
};
