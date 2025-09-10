"use client";

import { Notification } from "@/types/notification";
import Image from "next/image";
import { useEffect } from "react";
import Link from "next/link";
import Button from "../Button";
import {
  acceptFriendRequest,
  declineFriendRequest,
} from "@/lib/api/friend-request";

const RequestNotif = (props: { notification: Notification }) => {
  useEffect(() => {
    console.log(props);
  });

  const acceptFriendRequestHandler = async () => {
    const data = await acceptFriendRequest(
      props.notification.actor._id,
      props.notification.resource
    );
  };

  const declineFriendRequestHandler = async () => {
    const data = await declineFriendRequest(
      props.notification.actor._id,
      props.notification.resource
    );
  };

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
        <span> sent you a friend request.</span>

        <div className="flex justify-end gap-1">
          <Button type="primary" onClick={acceptFriendRequestHandler}>
            Accept
          </Button>
          <Button type="secondary" onClick={declineFriendRequestHandler}>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestNotif;
