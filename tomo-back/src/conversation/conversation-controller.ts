import express from "express";

import { ObjectId } from "mongodb";
import { getClient } from "../utils/mongo";
import { ApiError } from "../utils/api-error";

import {
  findConversationById,
  findUserConversations,
  getConversationCollection,
  insertConversation,
} from "./conversation-model";
import { findMessagesByConversation } from "@App/message/message-model";

export const resolveConversation = async (
  req: express.Request<
    {},
    {},
    {
      memberIds: string[];
    }
  >,
  res: express.Response,
  next: express.NextFunction
) => {
  const collection = getConversationCollection();
  console.log(req.body);
  const memberIds = req.body.memberIds.map(
    (memberId) => new ObjectId(memberId)
  );

  const conversation = await collection.findOne({
    members: {
      $all: memberIds,
      $size: memberIds.length,
    },
  });

  if (!conversation) {
    const insertResult = await insertConversation(memberIds);
    if (!insertResult.acknowledged) return next(new ApiError("DB Error", 500));
    return res.status(201).json({
      message: "Conversation created",
      conversationId: insertResult.insertedId,
    });
  }

  return res.status(200).json(conversation);
};

export const getConversation = async (
  req: express.Request<{ conversationId: string }>,
  res: express.Response,
  next: express.NextFunction
) => {
  const conversationId = new ObjectId(req.params.conversationId);
  const conversation = await findConversationById(conversationId);
  if (!conversation) return next(new ApiError("Conversation not found", 404));

  const query = await findMessagesByConversation(conversationId);
  const messages = await query.toArray();
  return res.status(200).json({ conversation, messages });
};

export const getConversations = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user = req.user;
  if (!user) return next(new ApiError("Unauthorized", 401));

  const userId = new ObjectId(req.user?._id);
  const conversations = await findUserConversations(userId);
  //console.log(conversations)
  return res.status(200).json(conversations)
};
