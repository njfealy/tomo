"use client";

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Post } from "@/types/post";
import { Comment, Reply } from "@/types/comment";
import {
  createPost,
  getAllPosts,
  likeComment,
  likePost,
  likeReply,
  makeComment,
  replyToComment,
  unlikeComment,
  unlikePost,
  unlikeReply,
} from "@/lib/api/post";
import Image from "next/image";
import CreatePostModal from "@/components/CreatePostModal";
import PostModal from "@/components/PostModal";
import PostItem from "@/components/Post";

const Home = () => {
  const { auth } = useContext(AuthContext)!;
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreatePostModal, setShowCreatePostModal] =
    useState<boolean>(false);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const toggleCreateHandler = () => {
    setShowCreatePostModal((prev) => !prev);
  };

  const submitPostHandler = async (postText: string) => {
    console.log(postText);
    const createPostResult = await createPost(postText);
    const newPost: Post = {
      _id: createPostResult._id,
      creator: auth!,
      text: postText,
      likes: [],
      comments: [],
      date: new Date(),
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  const likePostHandler = async (postId: string) => {
    setPosts((prev) => {
      const index = prev.findIndex((post) => post._id === postId);
      if (index === -1) return prev;

      const post = prev[index];
      const updatedPost = {
        ...post,
        likes: [...post.likes, auth!],
      };

      return [...prev.slice(0, index), updatedPost, ...prev.slice(index + 1)];
    });
    // const likePostResult = await likePost(postId);
    await likePost(postId);
  };

  const unlikePostHandler = async (postId: string) => {
    // const unlikePostResult = await unlikePost(postId);
    await unlikePost(postId);
    setPosts((prev) => {
      const index = prev.findIndex((post) => post._id === postId);
      if (index === -1) return prev;

      const post = prev[index];

      const updatedPost = {
        ...post,
        likes: post.likes.filter((user) => user._id !== auth!._id),
      };

      return [...prev.slice(0, index), updatedPost, ...prev.slice(index + 1)];
    });
  };

  const commentHandler = async (postId: string, commentText: string) => {
    const makeCommentResult = await makeComment(postId, commentText);
    const newComment: Comment = {
      _id: makeCommentResult.commentId,
      creator: auth!,
      text: commentText,
      likes: [],
      date: new Date(),
      replies: [],
    };
    setPosts((prev) => {
      const index = prev.findIndex((post) => post._id === postId);
      if (index === -1) return prev;

      const post = prev[index];

      const updatedPost = {
        ...post,
        comments: [...post.comments, newComment],
      };

      return [...prev.slice(0, index), updatedPost, ...prev.slice(index + 1)];
    });
  };

  const likeCommentHandler = async (postId: string, commentId: string) => {
    console.log("test");
    // const likeCommentResult = await likeComment(postId, commentId);
    await likeComment(postId, commentId);

    setPosts((prev) => {
      const postIndex = prev.findIndex((post) => post._id == postId);
      if (postIndex == -1) return prev;

      const post = prev[postIndex];
      const commentIndex = post.comments.findIndex(
        (comment) => comment._id == commentId
      );
      const comment = post.comments[commentIndex];

      const updatedComment = {
        ...comment,
        likes: [...comment.likes, auth!],
      };

      const updatedPost = {
        ...post,
        comments: [
          ...post.comments.slice(0, commentIndex),
          updatedComment,
          ...post.comments.slice(commentIndex + 1),
        ],
      };

      return [
        ...prev.slice(0, postIndex),
        updatedPost,
        ...prev.slice(postIndex + 1),
      ];
    });
  };

  const unlikeCommentHandler = async (postId: string, commentId: string) => {
    // const unlikeCommentResult = await unlikeComment(postId, commentId);
    await unlikeComment(postId, commentId);
    setPosts((prev) => {
      const postIndex = prev.findIndex((post) => post._id == postId);
      if (postIndex == -1) return prev;

      const post = prev[postIndex];
      const commentIndex = post.comments.findIndex(
        (comment) => comment._id == commentId
      );
      const comment = post.comments[commentIndex];
      console.log(comment._id);
      const updatedComment = {
        ...comment,
        likes: comment.likes.filter((user) => user._id != auth!._id),
      };

      const updatedPost = {
        ...post,
        comments: [
          ...post.comments.slice(0, commentIndex),
          updatedComment,
          ...post.comments.slice(commentIndex + 1),
        ],
      };

      return [
        ...prev.slice(0, postIndex),
        updatedPost,
        ...prev.slice(postIndex + 1),
      ];
    });
  };

  const replyToCommentHandler = async (
    postId: string,
    commentId: string,
    replyText: string
  ) => {
    console.log({ postId, commentId, replyText });
    const replyResult = await replyToComment(postId, commentId, replyText);
    setPosts((prev) => {
      const postIndex = prev.findIndex((post) => post._id == postId);
      if (postIndex == -1) return prev;

      const post = prev[postIndex];
      const commentIndex = post.comments.findIndex(
        (comment) => comment._id == commentId
      );
      const comment = post.comments[commentIndex];
      const newReply: Reply = {
        _id: replyResult.insertedId,
        creator: auth!,
        replyText,
        date: new Date(),
        likes: [],
      };

      const updatedComment = {
        ...comment,
        replies: [...comment.replies, newReply],
      };

      const updatedPost = {
        ...post,
        comments: [
          ...post.comments.slice(0, commentIndex),
          updatedComment,
          ...post.comments.slice(commentIndex + 1),
        ],
      };

      return [
        ...prev.slice(0, postIndex),
        updatedPost,
        ...prev.slice(postIndex + 1),
      ];
    });
  };

  const likeReplyHandler = async (
    postId: string,
    commentId: string,
    replyId: string
  ) => {
    await likeReply(postId, commentId, replyId)
    setPosts((prev) => {
      const postIndex = prev.findIndex((post) => post._id == postId);
      if (postIndex == -1) return prev;
      const post = prev[postIndex];

      const commentIndex = post.comments.findIndex(
        (comment) => comment._id == commentId
      );
      if (commentIndex == -1) return prev;
      const comment = post.comments[commentIndex];

      const replyIndex = comment.replies.findIndex(
        (reply) => reply._id == replyId
      );
      if (replyIndex == -1) return prev;
      const reply = comment.replies[replyIndex];

      const updatedReply = {
        ...reply,
        likes: [...reply.likes, auth!],
      };

      const updatedComment = {
        ...comment,
        replies: [
          ...comment.replies.slice(0, replyIndex),
          updatedReply,
          ...comment.replies.slice(replyIndex + 1),
        ],
      };

      const updatedPost = {
        ...post,
        comments: [
          ...post.comments.slice(0, commentIndex),
          updatedComment,
          ...post.comments.slice(commentIndex + 1),
        ],
      };

      return [
        ...prev.slice(0, postIndex),
        updatedPost,
        ...prev.slice(postIndex + 1),
      ];
    });
  };

  const unlikeReplyHandler = async (
    postId: string,
    commentId: string,
    replyId: string
  ) => {
    await unlikeReply(postId, commentId, replyId);
    setPosts((prev) => {
      const postIndex = prev.findIndex((post) => post._id == postId);
      if (postIndex == -1) return prev;
      const post = prev[postIndex];

      const commentIndex = post.comments.findIndex(
        (comment) => comment._id == commentId
      );
      if (commentIndex == -1) return prev;
      const comment = post.comments[commentIndex];

      const replyIndex = comment.replies.findIndex(
        (reply) => reply._id == replyId
      );
      if (replyIndex == -1) return prev;
      const reply = comment.replies[replyIndex];

      const updatedReply = {
        ...reply,
        likes: reply.likes.filter((user) => user._id != auth!._id),
      };

      const updatedComment = {
        ...comment,
        replies: [
          ...comment.replies.slice(0, replyIndex),
          updatedReply,
          ...comment.replies.slice(replyIndex + 1),
        ],
      };

      const updatedPost = {
        ...post,
        comments: [
          ...post.comments.slice(0, commentIndex),
          updatedComment,
          ...post.comments.slice(commentIndex + 1),
        ],
      };

      return [
        ...prev.slice(0, postIndex),
        updatedPost,
        ...prev.slice(postIndex + 1),
      ];
    });
  };

  useEffect(() => {
    const getPostsHandler = async () => {
      const fetchedPosts: Post[] = await getAllPosts();
      console.log(fetchedPosts);
      setPosts(fetchedPosts);
    };
    getPostsHandler();
  }, []);

  return (
    <div className="flex w-full h-full justify-center bg-[#202020]">
      <div className="w-2xl flex flex-col py-5 gap-3">
        {auth && (
          <>
            <div className="rounded-xl flex gap-3 items-center bg-[#303030] p-3">
              <Image
                src={auth.pictureUri}
                alt=""
                height="40"
                width="40"
                className="rounded-full h-[40px] w-[40px]"
              />
              <button
                onClick={toggleCreateHandler}
                className="text-[#A8A8A8] text-left p-2 px-3 bg-[#404040] w-full rounded-full hover:bg-[#585858] transition duration-200"
              >{`What's on your mind, ${
                auth.displayName.split(" ")[0]
              }?`}</button>
            </div>
          </>
        )}

        {posts.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {posts.map((post) => (
              <li key={post._id}>
                <PostItem
                  post={post}
                  onLike={likePostHandler}
                  onUnlike={unlikePostHandler}
                  onComment={() => setSelectedPostId(post._id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-white">No posts.</div>
        )}
      </div>

      {selectedPostId && auth && (
        <PostModal
          postId={selectedPostId}
          posts={posts}
          auth={auth}
          onClose={() => setSelectedPostId(null)}
          onLike={likePostHandler}
          onUnlike={unlikePostHandler}
          onComment={commentHandler}
          onLikeComment={likeCommentHandler}
          onUnlikeComment={unlikeCommentHandler}
          onReplyComment={replyToCommentHandler}
          onLikeReply={likeReplyHandler}
          onUnlikeReply={unlikeReplyHandler}
        />
      )}

      {showCreatePostModal && auth && (
        <CreatePostModal
          auth={auth}
          onToggle={toggleCreateHandler}
          onPost={submitPostHandler}
        />
      )}
    </div>
  );
};

export default Home;
