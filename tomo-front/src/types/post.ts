import { PublicUser } from "./user";
import { Comment } from "@/types/comment";

export interface Post {
  _id: string;
  creator: PublicUser;
  text: string;
  media?: string;
  likes: PublicUser[];
  comments: Comment[];
  date: Date;
}