"use client";
import { ChangeEvent, useState } from "react";
import Image from "next/image";

type Comment = {
  username: string;
  userPictureURI?: string;
  text: string;
};

const Post = (props: {
  post: {
    userPictureURI?: string;
    username: string;
    text: string;
    likes?: string[];
    liked: boolean;
    comments?: Comment[];
    date: Date;
  };
}) => {
  const [likes, setLikes] = useState(props.post.likes || ([] as string[]));
  const [likedByUser, setLikedByUser] = useState(props.post.liked);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState(
    props.post.comments || ([] as Comment[])
  );

  const likeHandler = () => {
    if (!likedByUser) {
      console.log("Liking");
      setLikes((prevState) => [...prevState, "newLike"]);
      return setLikedByUser(true);
    }
    console.log("Unliking");
    setLikes((prevState) => prevState.filter((item) => item !== "newLike"));
    setLikedByUser(false);
  };

  const commentInputChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log(event.target.value);
    setCommentInput(event.target.value);
  };

  const commentHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      console.log("Submit");
      setComments((prevState) => [
        ...prevState,
        { username: "test", text: commentInput } as Comment,
      ]);
      setCommentInput("");
    }
  };

  return (
    <div className="flex flex-col justify-between p-10 w-[85vh] h-[30vh] bg-white rounded-xl">
      <div className="flex gap-4">
        <Image
          src={props.post.userPictureURI || "test"}
          alt="/test.png"
          width={32}
          height={32}
          className="rounded-full"
        />
        <div className="font-semibold">{props.post.username}</div>
      </div>

      <div>{props.post.text}</div>

      <div className="flex justify-between">
        <div>
          {likes.length > 0 &&
            `Liked by ${likes.length} ${
              likes.length === 1 ? "person" : "people"
            }`}
        </div>
        <div className="flex gap-2">
          <button onClick={likeHandler}>
            <Image src="/like.svg" alt="/like.svg" width={32} height={32} />
          </button>
          <button>
            <Image
              src="/comment.svg"
              alt="/comment.svg"
              width={32}
              height={32}
            />
          </button>
        </div>
      </div>

      <div>
        <ul>
          {comments.map((comment) => (
            <li>
              <div>
                <div>{comment.username}</div>
                <div>{comment.text}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <input
        onChange={commentInputChangeHandler}
        onKeyDown={commentHandler}
        placeholder="Add a comment..."
        value={commentInput}
      ></input>
    </div>
  );
};

export default Post;
