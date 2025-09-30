export type MakeCommentRequest = {
  creatorId: string;
  text: string;
};

export type DeleteCommentRequest = {
  commentId: string;
};

export type EditCommentRequest = {
  commentId: string;
  newText: string;
};