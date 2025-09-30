import { PublicUser } from "@/types/user";
import { useState } from "react";
import Image from "next/image";

const CreatePostModal = (props: {
  auth: PublicUser;
  onToggle: () => void;
  onPost: (postText: string) => void;
}) => {
  const [input, setInput] = useState<string>("");

  const inputChangeHandler = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInput(event.target.value);
  };

  const submitPostHandler = () => {
    props.onToggle();
    props.onPost(input);
  };

  return (
    <div className="absolute flex items-center justify-center w-full h-full bg-black/50">
      <div className="bg-[rgb(40,40,40)] w-lg min-h-2xl rounded-lg ">
        <div className="flex relative justify-center items-center p-3 border-b-[1px] border-b-[#606060]">
          <div className="text-white font-bold text-xl">Create Post</div>
          <button
            onClick={props.onToggle}
            className="p-2 absolute right-2 rounded-full bg-[#484848] text-[#999999] w-[40px] h-[40px]"
          >
            x
          </button>
        </div>

        <div className="flex flex-col p-5 gap-3 h-full w-full">
          <div className="flex gap-2 items-center">
            <Image
              src={props.auth.pictureUri}
              alt=""
              height="40"
              width="40"
              className="rounded-full"
            />
            <div className="text-white">{props.auth.displayName}</div>
          </div>

          <textarea
            rows={4}
            placeholder={`What's on your mind, ${
              props.auth.displayName.split(" ")[0]
            }?`}
            spellCheck={false}
            value={input}
            onChange={inputChangeHandler}
            className=" resize-none scroll-text-2xl text-[#E0E0E0] text-xl placeholder:text-[#B0B0B0] focus:outline-hidden "
          />

          <button
            disabled={input.length == 0}
            onClick={submitPostHandler}
            className={`w-full p-1 rounded-lg ${input.length == 0 ? "bg-[#404040] text-[#B0B0B0]" : "bg-blue-600 text-white"}`}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
