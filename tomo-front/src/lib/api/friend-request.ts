import { API_HOST } from "../config";
export const sendFriendRequest = async (userId: string) => {
  console.log("Sending friend request");
  const res = await fetch(
    `${API_HOST}/users/` + userId + "/friend-requests",
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  const data: { message: string; requestId: string } = await res.json();
  console.log(data);

  return data;
};

export const cancelFriendRequest = async (
  userId: string,
  requestId: string
) => {
  console.log("cancelling friend request");
  const res = await fetch(
    `${API_HOST}/users/${userId}/friend-requests/${requestId}/cancel`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();
  console.log(data);
};

export const acceptFriendRequest = async (
  userId: string,
  requestId: string
) => {
  console.log("Accepting friend request");
  const res = await fetch(
    `${API_HOST}/users/${userId}/friend-requests/${requestId}/accept`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();
  console.log(data);
};

export const declineFriendRequest = async (
  userId: string,
  requestId: string
) => {
  console.log("Declining friend request");
  const res = await fetch(
    `${API_HOST}/users/${userId}/friend-requests/${requestId}/decline`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();
  console.log(data);
};

export const unfriend = async () => {};
