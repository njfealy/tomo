import express from "express";

import { ObjectId } from "mongodb";
import { getClient } from "../utils/mongo";
import { ApiError } from "../utils/api-error";

import { insertMessage, Message } from "./message-model";

export const sendMessage = async (
  req: express.Request<
    { conversationId: string },
    {},
    { senderId: string; content: string }
  >,
  res: express.Response,
  next: express.NextFunction
) => {
  const conversationid = new ObjectId(req.params.conversationId);
  const senderId = new ObjectId(req.body.senderId);
  const content = req.body.content;

  console.log(req.body.content)
  console.log(req.body.senderId)
  const insertResult = await insertMessage(content, senderId, conversationid);
  if (!insertResult.acknowledged) return next(new ApiError("DB Error", 500));

  return res
    .status(201)
    .json({
      message: "Successfully sent message",
      messageId: insertResult.insertedId,
    });
};
