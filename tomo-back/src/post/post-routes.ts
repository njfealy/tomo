import express from "express";
const router = express.Router();

import {
  createPost,
  deletePost,
  getAllPosts,
  getPost,
  likePost,
  unlikePost,
  getTrendingPosts,
} from "./post-controller";
import {
  deleteComment,
  editComment,
  likeComment,
  makeComment,
  unlikeComment,
  replyToComment,
  likeReply,
  unlikeReply,
} from "../comment/comment-controller";

router.get("/trending", getTrendingPosts);
router.post("/", createPost);
router.get("/", getAllPosts);

router.patch("/:postId/comments/:commentId/replies/:replyId/like", likeReply);
router.patch(
  "/:postId/comments/:commentId/replies/:replyId/unlike",
  unlikeReply
);
router.post("/:postId/comments/:commentId/replies", replyToComment);
router.patch("/:postId/comments/:commentId/like", likeComment);
router.patch("/:postId/comments/:commentId/unlike", unlikeComment);
router.delete("/:postId/comments/:commentId", deleteComment);
router.patch("/:postId/comments/:commentId", editComment);

router.post("/:postId/comments", makeComment);

router.patch("/:postId/like", likePost);
router.patch("/:postId/unlike", unlikePost);

router.delete("/:postId", deletePost);
router.get("/:postId", getPost);

export default router;
