"use client";
import { Notification } from "@/types/notification";
import RequestNotif from "./RequestNotif";
import AcceptedNotif from "./AcceptedNotif";
import PostLikeNotif from "./PostLikeNotif";
import PostCommentNotif from "./PostCommentNotif";

const NotificationCard = (props: { notification: Notification }) => {
  switch (props.notification.type) {
    case "newRequest":
      return <RequestNotif notification={props.notification} />;
    case "requestAccepted":
      return <AcceptedNotif notification={props.notification} />;
    case "postComment":
      return <PostCommentNotif notification={props.notification} />;
    case "postLike":
      return <PostLikeNotif notification={props.notification} />;
    case "commentRespond":
    case "commentLike":
    default:
      return null;
  }
};

export default NotificationCard;
