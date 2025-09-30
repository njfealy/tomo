import { PublicUser } from "./user";

export interface Comment {
  _id: string;
  creator: PublicUser;
  text: string;
  likes: PublicUser[];
  date: Date;
  replies: Reply[];
}

export interface Reply {
  _id: string;
  creator: PublicUser;
  //mentions: ObjectId[];
  replyText: string;
  date: Date;
  likes: PublicUser[];
}
