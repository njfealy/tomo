import { Post } from "@/types/post";

export interface PublicUser {
  _id: string;
  displayName: string;
  pictureUri: string;
}

export interface PrivateUser extends PublicUser {
  googleId: string;
  email?: string;
  friends?: string[];
  posts?: Post[];
  friendStatus: FriendStatus;
}

export type StatusType = "friends" | "pending" | "unanswered" | null;

export interface FriendStatus {
  status: StatusType;
  requestId: string | null;
}
