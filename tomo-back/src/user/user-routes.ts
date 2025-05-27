import express from "express";
const router = express.Router();

import {
  acceptFriendRequest,
  cancelFriendRequest,
  createUser,
  declineFriendRequest,
  deleteUser,
  removeFriend,
  sendFriendRequest,
} from "./user-controller";

router.post("/", createUser);
router.post("/:userId/friend-requests", sendFriendRequest);
router.patch("/:userId/friend-requests/:requestId/accept", acceptFriendRequest);
router.delete(
  "/:userId/friend-requests/:requestId/cancel",
  cancelFriendRequest
);
router.delete(
  "/:userId/friend-requests/:requestId/decline",
  declineFriendRequest
);
router.delete("/:userId", deleteUser);
router.patch("/:userId", removeFriend);

export default router;
