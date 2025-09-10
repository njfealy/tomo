"use client";
import { io } from "socket.io-client";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  displayName: string;
  googleId?: string;
  pictureUri: string;
}

interface FriendRequest {
  _id: string;
  sender: {
    _id: string;
    displayName: string;
    pictureUri: string;
  };
  mutualFriends: User[];
  sentAt: Date;
}

const Friends = () => {
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const { auth } = useContext(AuthContext)!;
  const router = useRouter();

  useEffect(() => {
    const fetchFriends = async (userId: string) => {
      console.log("fetching friends");
      const response = await fetch(
        `http://localhost:5001/users/${userId}/friends`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      console.log("friends data: ", data);
      setFriends(data.friends);
      setFriendRequests(data.friendRequests as FriendRequest[]);
    };

    if (loading && auth?._id) {
      fetchFriends(auth._id);
      setLoading(false);
    }
  }, [loading, auth]);

  const acceptFriendRequestHandler = async (userId: string, requestId: string) => {
    const response = await fetch(`http://localhost:5001/users/${userId}/friend-requests/${requestId}/accept`, {
      method: "PATCH",
      credentials: "include"
    })
    if(response.ok) {
      setFriendRequests((prev) => {
        if(!prev) return null;
        return prev.filter((request) => request._id != requestId)
      })
      const data = await response.json();
      console.log("Accept friend request result: ",data)
    }
  }

  const declineFriendRequestHandler = () => {

  }

  const findConversation = async (userId: string, friendId: string) => {
    const body = JSON.stringify({
      memberIds: [userId, friendId],
    });
    const response = await fetch(`http://localhost:5001/conversations/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    });
    const conversation = await response.json();
    console.log(conversation);
    router.push(`/conversation/${conversation._id}`);
  };

  return (
    <div className="bg-[#222222] h-full flex p-3">
      <div className="mr-4">
        <div className="text-white">Requests</div>
        <ul>
          {friendRequests != null &&
            friendRequests.map((request) => (
              <li key={request._id} className="bg-[#111111] p-2 rounded-lg flex flex-col gap-4">
                <div className="flex items-end gap-2">
                  <Image src={request.sender.pictureUri} alt="https://kawaius.com/wp-content/uploads/2018/04/GL10-Polished-Ebony.jpg" width={60} height={60} className="rounded-md"/>
                  <div className="text-white">{request.sender.displayName}</div>
                </div>
                <div className="text-white">
                  {request.mutualFriends.length} mutual friends
                </div>
                <div className="flex items-end gap-1">
                  <button onClick={() => acceptFriendRequestHandler(request.sender._id, request._id)} className="p-1 bg-blue-700 rounded-lg text-[#DDDDDD]">Accept</button>
                  <button className="p-1 bg-[#444444] rounded-lg text-[#DDDDDD]">Decline</button>
                  <div className="text-white">{((new Date().getTime() - new Date(request.sentAt).getTime()) / 1000 / 60).toFixed(0)} min ago</div>
                </div>
              </li>
            ))}
        </ul>
        {/* <button onClick={() => console.log(friendRequests[0].sender)}className="bg-white">Test</button> */}
      </div>
      <div>
        <div>Friends</div>
        <ul>
          {friends.map((friend) => (
            <li key={friend._id}>
              <div className="flex flex-col items-start border-[1] border-gray-300 rounded-2xl p-10">
                <div className="flex">
                  <Image
                    src={friend.pictureUri}
                    alt={""}
                    width={50}
                    height={50}
                  />
                  <div>{friend.displayName}</div>
                </div>

                <button
                  onClick={() =>
                    findConversation("683e2f609858f0b69c41ee94", friend._id)
                  }
                  className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-2xl hover:bg-blue-700 transition"
                >
                  Message
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Friends;
