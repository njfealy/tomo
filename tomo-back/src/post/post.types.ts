export type CreatePostRequest = {
  creatorId: string;
  postText: string;
};

// export type DeletePostRequest = {
//   postId: string;
// };

export type LikePostRequest = {
  likerId: string;
};

export type UnlikePostRequest = {
  likerId: string;
};
