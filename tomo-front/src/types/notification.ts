import { PublicUser } from "./user";

export type NotifType =
  | "newRequest"
  | "requestAccepted"
  | "postLike"
  | "postComment"
  | "commentLike"
  | "commentRespond";

export interface Notification {
  _id: string;
  type: NotifType;
  actor: PublicUser;
  date: Date;
  resource: string;
}
