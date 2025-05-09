export type User = {
  id: string;
  username: string;
  pictureURI: string;
  friends: string[];
  posts: string[];
};

export type Post = {
  id: string;
  creator: string;
  text: string;
  media?: string;
  date: Date;
  comments: Comment[];
  likes: string[];
};

export type Comment = {
  id: string;
  post: string;
  creator: string;
  text: string;
  date: Date;
};

export type Notification = {
  id: string;
  event: string;
  agents: string[];
};
