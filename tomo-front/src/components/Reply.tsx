import { Reply } from "@/types/comment";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { AuthContext } from "@/context/AuthContext";
import { useContext } from "react";

const ReplyItem = (props: {
  reply: Reply;
  onLike: (replyId: string) => void;
  onUnlike: (replyId: string) => void;
}) => {
  const { auth } = useContext(AuthContext)!;

  const isLiked =
    auth && props.reply.likes.some((user) => user._id === auth!._id);

  const toggleLikeHandler = () => {
    if (isLiked) {
      return props.onUnlike(props.reply._id);
    }
    return props.onLike(props.reply._id);
  };

  return (
    <div className="flex w-full pl-3 py-1 gap-2 items-start">
      <Link href={`http://localhost:3000/${props.reply.creator._id}`}>
        <Image
          src={props.reply.creator.pictureUri}
          alt=""
          height={30}
          width={30}
          className="rounded-full h-[40px] w-[40px] flex-shrink-0"
        />
      </Link>

      <div className="w-full">
        <div className="flex-1 max-w-full bg-[#404040] text-[#E0E0E0] p-1 px-2 rounded-lg break-words whitespace-pre-wrap overflow-hidden">
          <Link
            href={`http://localhost:3000/${props.reply.creator._id}`}
            className="font-semibold"
          >
            {props.reply.creator.displayName}
          </Link>
          <div>{props.reply.replyText}</div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between pl-1 gap-3">
            <div className="text-[#A0A0A0] text-sm">
              {formatDistanceToNow(props.reply.date, { addSuffix: true })}
            </div>

            <div className="flex text-[#A0A0A0] text-xs gap-3">
              <div className="text-[#A0A0A0] text-sm">
                {props.reply.likes.length > 0 &&
                  `${props.reply.likes.length} like${
                    props.reply.likes.length > 1 ? "s" : ""
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
                { isLiked ? "Liked" : "Like"}
              </button>
              {/* <button onClick={() => setIsReplying((prev) => !prev)}>
              Reply
            </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyItem;
