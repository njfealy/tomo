"use client";

import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import Image from "next/image";
import { Post } from "@/types/post";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const PostItem = (props: {
  post: Post;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onComment: () => void;
}) => {
  const { auth } = useContext(AuthContext)!;
  const isLiked = auth &&  props.post.likes.some(user => user._id === auth!._id);

  const toggleLikeHandler = () => {
    if (isLiked) {
      return props.onUnlike(props.post._id);
      //return setIsLiked(false);
    }
    return props.onLike(props.post._id);
    //return setIsLiked(true);
  };


  return (
    <div className="flex flex-col gap-3 w-full items-start rounded-xl bg-[#282828] px-3 pt-3 pb-1">
      <div className="flex w-full items-center gap-3">
        <Link href={`http://${process.env.FRONT_URL}/${props.post.creator._id}`}>
          <Image
            src={props.post.creator.pictureUri}
            alt=""
            height="40"
            width="40"
            className="rounded-full h-[40px] w-[40px]"
          />
        </Link>
        <div>
          <div className="text-[#E0E0E0]">{props.post.creator.displayName}</div>
          <div className="text-[#A0A0A0]">
            {formatDistanceToNow(props.post.date, { addSuffix: true })}
          </div>
        </div>
      </div>
      <div className="text-lg text-[#E0E0E0] pl-1">{props.post.text}</div>
      <div className="w-full flex">
        { props.post.likes.length > 0 && <div className=" right-0 text-sm p-1 text-[#A0A0A0]">{props.post.likes.length} like{props.post.likes.length > 1 && "s"}</div>}
        { props.post.comments.length > 0 && <div className="flex text-end text-sm p-1 text-[#A0A0A0]">{props.post.comments.length} comments</div>}
      </div>
      <div className="flex w-full justify-between">
        <button
          onClick={toggleLikeHandler}
          className={`flex-1/2 text-center font-semibold rounded-lg hover:bg-[#555555] transition duration-200 ${
            !isLiked ? "text-[#B0B0B0]" : "text-blue-500 hover:text-blue-300"
          }`}
        >
          {isLiked ? "Liked" : "Like"}
        </button>
        <button onClick={props.onComment} className="flex-1/2 text-center text-[#B0B0B0] font-semibold rounded-lg hover:bg-[#555555] hover:text-[#D0D0D0] transition duration-200">
          Comment
        </button>
      </div>
    </div>
  );
};

export default PostItem;
