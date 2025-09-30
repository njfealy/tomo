import express from "express";
import {
  resolveConversation,
  getConversation,
  getConversations,
} from "./conversation-controller";
import { sendMessage } from "../message/message-controller";
const router = express.Router();

router.get("/", getConversations);
router.post("/:conversationId/messages", sendMessage);
router.get("/:conversationId", getConversation);
router.post("/", resolveConversation);


export default router;
