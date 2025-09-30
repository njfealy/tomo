"use client";
import { PrivateUser } from "@/types/user";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
} from "@/lib/api/friend-request";

import Image from "next/image";
import Button from "@/components/Button";
import { API_HOST } from "@/lib/config";

const User = () => {
  const params = useParams() as { userId: string };
  const [userInfo, setUserInfo] = useState<PrivateUser | null>(null);
  const { auth } = useContext(AuthContext)!;
  const [showFriendMenu, setShowFriendMenu] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);

  const sendFriendRequestHandler = async () => {
    const data = await sendFriendRequest(params.userId);
    setUserInfo((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        friendStatus: {
          status: "pending",
          requestId: data.requestId,
        },
      };
    });
  };

  const cancelFriendRequestHandler = async () => {
    if (!userInfo?.friendStatus.requestId) return;

    await cancelFriendRequest(
      params.userId,
      userInfo.friendStatus.requestId
    );
    setUserInfo((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        friendStatus: {
          status: null,
          requestId: null,
        },
      };
    });
  };

  // const unfriendHandler = async () => {};

  const acceptFriendRequestHandler = async () => {
    if (!userInfo?.friendStatus.requestId) return;

    await acceptFriendRequest(
      params.userId,
      userInfo.friendStatus.requestId
    );
    setUserInfo((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        friendStatus: {
          status: "friends",
          requestId: null,
        },
      };
    });
  };

  const declineFriendRequestHandler = async () => {
    if (!userInfo?.friendStatus.requestId) return;

    await declineFriendRequest(
      params.userId,
      userInfo.friendStatus.requestId
    );
    setUserInfo((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        friendStatus: {
          status: null,
          requestId: null,
        },
      };
    });
  };

  const toggleModal = () => {
    setModal((prev) => !prev);
  };

  useEffect(() => {
    // console.log(params);
    const fetchUserData = async () => {
      const res = await fetch(`${API_HOST}/users/` + params.userId, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await res.json();
      // console.log("userInfo: ", data);
      setUserInfo(data);
    };
    fetchUserData();
  }, [params.userId]);
  return (
    <div className={"bg-[#222222] h-full"}>
      {modal && (
        <div className="flex justify-center items-center fixed left-0 z-50 top-0 h-screen w-screen bg-black/20 ">
          <div className="flex flex-col justify-between w-[60vw] h-[40vh] bg-[#999999] text-white p-3">
            <div>{userInfo?.displayName}&apos;s friends</div>
            <div>
              <ul>
                {userInfo!.friends!.map((friend) => (
                  <li key={friend}>{friend}</li>
                ))}
              </ul>
            </div>
            <button onClick={toggleModal} className="flex justify-end">
              x
            </button>
          </div>
        </div>
      )}
      {userInfo && (
        <div className="p-3 h-full ">
          <div className="flex items-end h-auto">
            <Image
              src={userInfo.pictureUri}
              alt={""}
              width={80}
              height={80}
              className="rounded-full mr-6"
            />

            <div>
              <div className="text-3xl font-semibold text-white">
                {userInfo.displayName}
              </div>
              <div className="flex gap-2 text-white text-lg font-semibold">
                <div className="text-white">
                  {userInfo.posts?.length || "0"} posts
                </div>
                <button onClick={toggleModal} className="text-white">
                  {userInfo.friends ? userInfo.friends.length : 0} friends
                </button>
              </div>
            </div>

            {auth && auth._id != params.userId && (
              <div className="flex gap-2">
                {userInfo.friendStatus.status == null && (
                  <Button type="primary" onClick={sendFriendRequestHandler}>
                    Add Friend
                  </Button>
                )}
                {userInfo.friendStatus.status == "friends" && (
                  <>
                    <div className="">
                      <button
                        onClick={() => {
                          if (userInfo.friends && userInfo.friends.length > 0)
                            setShowFriendMenu((prev) => !prev);
                        }}
                        className="bg-[#777777] text-gray-100 hover:bg-[#8A8A8A] hover:text-white transition duration-200 px-2 rounded"
                      >
                        Friends
                      </button>
                      {showFriendMenu && (
                        <ul className="bg-[#1A1A1A] absolute text-gray-300 p-1 rounded-lg">
                          <li className="p-2 rounded hover:bg-[#444444] hover:text-white transition duration-200">
                            <button>Unfriend</button>
                          </li>
                          <li className="p-2 rounded hover:bg-[#333333] hover:text-white transition duration-200">
                            <button>Block</button>
                          </li>
                        </ul>
                      )}
                    </div>

                    <button className="bg-blue-700 text-white px-2 rounded">
                      Message
                    </button>
                  </>
                )}
                {userInfo.friendStatus.status == "pending" && (
                  <>
                    <div>
                      <Button
                        onClick={cancelFriendRequestHandler}
                        type="primary"
                      >
                        Cancel Request
                      </Button>
                    </div>
                  </>
                )}
                {userInfo.friendStatus.status == "unanswered" && (
                  <>
                    <div className="flex gap-1">
                      <Button
                        onClick={acceptFriendRequestHandler}
                        type="primary"
                      >
                        Accept Request
                      </Button>
                      <Button
                        onClick={declineFriendRequestHandler}
                        type="secondary"
                      >
                        Decline Request
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="text-white flex justify-center h-full">
            {userInfo.posts ? (
              <ul>
                {/* {userInfo.posts.map((post) => (
                  <li></li>
                ))} */}
              </ul>
            ) : (
              <div className="h-full items-center">
                {auth && auth._id == params.userId
                  ? "You have"
                  : "This user has"}{" "}
                no posts.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default User;