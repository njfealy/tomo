"use client";

import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { Comment } from "@/types/comment";
import { formatDistanceToNow } from "date-fns";
import ReplyItem from "./Reply";

const CommentItem = (props: {
  comment: Comment;
  onLike: (commentId: string) => void;
  onUnlike: (commentId: string) => void;
  onReply: (commentId: string, replyText: string) => void;
  onLikeReply: (commentId: string, replyId: string) => void;
  onUnlikeReply: (commentId: string, replyId: string) => void;
}) => {
  const { auth } = useContext(AuthContext)!;
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const isLiked =
    auth && props.comment.likes.some((user) => user._id === auth!._id);

  const toggleLikeHandler = () => {
    if (isLiked) {
      return props.onUnlike(props.comment._id);
    }
    return props.onLike(props.comment._id);
  };

  const inputChangeHandler = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInput(event.target.value);
  };

  const submitReplyHandler = () => {
    setIsReplying(false);
    props.onReply(props.comment._id, input);
    setInput("")
  };

  return (
    <div className="flex w-full px-3 py-1 gap-3 items-start">
      <Link href={`http://localhost:3000/${props.comment.creator._id}`}>
        <Image
          src={props.comment.creator.pictureUri}
          alt=""
          height={40}
          width={40}
          className="rounded-full h-[40px] w-[40px] flex-shrink-0"
        />
      </Link>

      <div className="w-full">
        <div className="flex-1 max-w-full bg-[#404040] text-[#E0E0E0] p-1 px-2 rounded-lg break-words whitespace-pre-wrap overflow-hidden">
          <Link
            href={`http://localhost:3000/${props.comment.creator._id}`}
            className="font-semibold"
          >
            {props.comment.creator.displayName}
          </Link>
          <div>{props.comment.text}</div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between pl-1 gap-3">
            <div className="text-[#A0A0A0] text-xs">
              {formatDistanceToNow(props.comment.date, { addSuffix: true })}
            </div>

            <div className="flex text-[#A0A0A0] text-xs gap-3">
              <div className="text-[#A0A0A0] text-xs">
                {props.comment.likes.length > 0 &&
                  `${props.comment.likes.length} like${
                    props.comment.likes.length > 1 ? "s" : ""
                  }`}
              </div>
              <button
                onClick={toggleLikeHandler}
                className={`${
                  isLiked
                    ? "text-blue-500 hover:text-blue-300"
                    : "hover:text-[#D0D0D0]"
                } transition duration-200 hover:underline`}
              >
                {isLiked ? "Liked" : "Like"}
              </button>
              <button onClick={() => setIsReplying((prev) => !prev)}>
                Reply
              </button>
            </div>
          </div>

          <ul className="w-full">
            {props.comment.replies &&
              props.comment.replies.map((reply) => (
                <li key={reply._id}>                 
                  <ReplyItem
                    reply={reply}
                    onLike={(replyId: string) =>
                      props.onLikeReply(props.comment._id, replyId)
                    }
                    onUnlike={(replyId: string) =>
                      props.onUnlikeReply(props.comment._id, replyId)
                    }
                  />
                </li>
              ))}
          </ul>

          {isReplying && (
            <div className="w-full flex gap-3 pl-2 py-2">
              <Link href={`http://localhost:3000/${props.comment.creator._id}`}>
                <Image
                  src={auth!.pictureUri}
                  alt=""
                  height={30}
                  width={30}
                  className="rounded-full h-[40px] w-[40px] flex-shrink-0"
                />
              </Link>
              <div className="bg-[#404040] rounded-lg px-2 py-1 w-full">
                <textarea
                  spellCheck={false}
                  rows={2}
                  value={input}
                  onChange={inputChangeHandler}
                  placeholder={`Reply to ${props.comment.creator.displayName}...`}
                  className="resize-none focus:outline-hidden caret-[#D0D0D0] text-[#E0E0E0]  "
                ></textarea>
                <div className="w-full flex justify-end">
                  <button
                    disabled={input.length == 0}
                    onClick={submitReplyHandler}
                    className={`p-1 rounded-lg ${
                      input.length == 0 ? "text-[#B0B0B0]" : "text-blue-500"
                    }`}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
