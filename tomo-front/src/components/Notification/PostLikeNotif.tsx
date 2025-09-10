"use client";

import { Notification } from "@/types/notification";
import Image from "next/image";
import { useEffect } from "react";
import Link from "next/link";

const PostLikeNotif = (props: { notification: Notification }) => {
  useEffect(() => {
    console.log(props);
  });

  return (
    <div className="flex bg-[#111111] items-center rounded-lg text-white p-2 gap-2">
      <Link href={`http://localhost:3000/${props.notification.actor._id}`}>
        <Image
          src={props.notification.actor.pictureUri}
          alt=""
          width={40}
          height={40}
          className="rounded-full w-[70px] h-[70px]"
        />
      </Link>

      <div>
        <span className="text-blue-700">
          {props.notification.actor.displayName}
        </span>
        <span>liked your post.</span>
      </div>
    </div>
  );
};

export default PostLikeNotif;
