import express from "express";
const router = express.Router();

import {
  createPost,
  deletePost,
  getPost,
  likePost,
  unlikePost,
} from "./post-controller";
import { deleteComment, editComment, makeComment } from "../comment/comment-controller";

router.post("/", createPost);
router.delete("/", deletePost);
router.post("/:postId/comment", makeComment);
router.delete("/:postId/comment", deleteComment);
router.patch("/:postId/comment", editComment)
router.patch("/:postId/like", likePost);
router.patch("/:postId/unlike", unlikePost);
router.get("/:postId", getPost);

export default router;
