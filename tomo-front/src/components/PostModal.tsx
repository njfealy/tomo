"use client";
import { Post } from "@/types/post";
import { PublicUser } from "@/types/user";
import { useState, useRef } from "react";
import PostItem from "./Post";
import Image from "next/image";
import CommentItem from "./Comment";

const PostModal = (props: {
  postId: string;
  posts: Post[];
  auth: PublicUser;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onComment: (postId: string, commentText: string) => void;
  onLikeComment: (postId: string, commentId: string) => void;
  onUnlikeComment: (postId: string, commentId: string) => void;
  onReplyComment: (
    postId: string,
    commentId: string,
    replyText: string
  ) => void;
  onLikeReply: (postId: string, commentId: string, replyId: string) => void;
  onUnlikeReply: (postId: string, commentId: string, replyId: string) => void;
  onClose: () => void;
}) => {
  const [input, setInput] = useState<string>("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const post = props.posts.find((p) => p._id === props.postId);

  if (!post) return null;

  const inputChangeHandler = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInput(event.target.value);
  };

  const focusCommentInput = () => {
    textAreaRef.current?.focus();
  };

  const submitCommentHandler = () => {
    props.onComment(post._id, input);
    setInput("");
  };

  return (
    <div className="absolute flex flex-col items-center justify-center w-full h-full bg-black/50">
      <div className="bg-[#282828] w-lg rounded-lg">
        <div className="flex relative justify-center items-center p-3 border-b-[1px] border-b-[#606060]">
          <div className="text-white font-bold text-xl">
            {post.creator.displayName.split(" ")[0]}&apos;s Post
          </div>
          <button
            onClick={props.onClose}
            className="p-2 absolute right-2 rounded-full bg-[#484848] hover:bg-[#686868] hover:text-[#BBBBBB] text-[#999999] transition duration-200 w-[40px] h-[40px]"
          >
            x
          </button>
        </div>
        <div
          className="max-h-[50vh] w-full overflow-auto rounded-lg bg-[#282828] "
          style={{
            scrollbarColor: "rgba(255, 255, 255, 0.5) #282828",
            scrollbarWidth: "thin",
          }}
        >
          <div className="border-b-[#606060] border-b-[1px] pb-1">
            <PostItem
              post={post}
              onLike={props.onLike}
              onUnlike={props.onUnlike}
              onComment={focusCommentInput}
            />
          </div>
          {post.comments.length > 0 ? (
            <ul className="flex flex-col pt-1">
              {post.comments.map((comment) => (
                <li key={comment._id}>
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    onLike={() =>
                      props.onLikeComment(props.postId, comment._id)
                    }
                    onUnlike={() =>
                      props.onUnlikeComment(props.postId, comment._id)
                    }
                    onReply={(commentId: string, replyText: string) =>
                      props.onReplyComment(props.postId, comment._id, replyText)
                    }
                    onLikeReply={(commentId: string, replyId: string) =>
                      props.onLikeReply(props.postId, commentId, replyId)
                    }
                    onUnlikeReply={(commentId: string, replyId: string) =>
                      props.onUnlikeReply(props.postId, commentId, replyId)
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xl flex justify-center items-center w-full h-56 text-[#D0D0D0]">
              No comments yet
            </div>
          )}
        </div>

        <div className="w-full rounded-b-lg bg-[#282828] border-t-1 border-t-[#282828] inset-shadow-xl inset-shadow-white flex p-3 gap-2 ">
          <Image
            src={props.auth.pictureUri}
            alt=""
            height="40"
            width={40}
            className="rounded-full h-[40px] w-[40px]"
          />
          <div className="w-full bg-[#404040] p-1 px-2 rounded-lg">
            <textarea
              ref={textAreaRef}
              rows={2}
              placeholder="Leave a comment..."
              spellCheck={false}
              value={input}
              onChange={inputChangeHandler}
              className="resize-none focus:outline-hidden w-full  caret-[#D0D0D0] text-[#E0E0E0]"
            />
            <div className="w-full flex justify-end">
              <button
                disabled={input.length == 0}
                onClick={submitCommentHandler}
                className={`p-1 rounded-lg ${
                  input.length == 0 ? "text-[#B0B0B0]" : "text-blue-500"
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
