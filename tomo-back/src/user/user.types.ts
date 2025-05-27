export interface CreateUserRequest {
  username: string;
  email: string;
}

export interface SendFriendRequestRequest {
  senderId: string;
}

export interface RemoveFriendRequest {
  userId: string;
  friendId: string;
}
