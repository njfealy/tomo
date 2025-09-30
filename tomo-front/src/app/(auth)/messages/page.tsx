"use client";
import { useEffect, useState, useContext, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { AuthContext } from "@/context/AuthContext";
import { SocketContext } from "@/context/SocketContext";
import { PublicUser } from "@/types/user";
import Image from "next/image";
import { API_HOST } from "@/lib/config";

interface Message {
  _id: string;
  sender: string;
  content: string;
  sentAt: Date;
}

interface Conversation {
  _id: string;
  members: PublicUser[];
  lastMessage: {
    sentAt: Date;
    content: string;
    sender: PublicUser;
    conversation: string;
  };
  groupName: string;
}

const Messages = () => {
  const [conversations, setConversations] = useState([] as Conversation[]);
  const [currentConvo, setCurrentConvo] = useState<Conversation | null>(null);
  const currentConvoRef = useRef<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([] as Message[]);
  const [input, setInput] = useState<string>("");
  const { auth } = useContext(AuthContext)!;
  const [convoName, setConvoName] = useState<string | undefined>(undefined);
  const [isTyping, setIsTyping] = useState<PublicUser[] | null>(null);
  const socket = useContext(SocketContext)!;

  const selectConvoHandler = (conversationId: string) => {
    const newConvo = conversations.find(
      (convo) => convo._id == conversationId
    )!;
    setCurrentConvo(newConvo);
  };

  const inputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const submitMessageHandler = (
    event: React.SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (input.length == 0) return Error("Message must not be empty");
    const tempId = uuidv4();
    const message: Message = {
      _id: tempId,
      sender: auth!._id,
      content: input,
      sentAt: new Date(),
    };
    setMessages((prev) => [...prev, message]);
    setInput("");
    socket.emit("message", currentConvo!._id, auth!._id, input);
  };

  useEffect(() => {
    const fetchConversations = async () => {
      const res = await fetch(`${API_HOST}/conversations`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      setConversations(data);
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (!currentConvo || !auth) return;

    const fetchCurrentConvo = async () => {
      const res = await fetch(
        `${API_HOST}/conversations/` + currentConvo._id,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await res.json();
      setMessages(data.messages);
    };

    fetchCurrentConvo();

    if (currentConvo.groupName) {
      setConvoName(currentConvo.groupName);
    } else {
      setConvoName(
        currentConvo.members
          .filter((member) => member._id == auth._id)
          .map((user) => user.displayName)
          .join(", ")
      );
    }
  }, [currentConvo, auth]);

  useEffect(() => {
    currentConvoRef.current = currentConvo;
    console.log(currentConvo);
  }, [currentConvo]);

  useEffect(() => {
    if (!socket) return;

    const isTypingHandler = (room: string, sender: string) => {
      const convo = currentConvoRef.current;
      if (!convo || room !== convo._id) return;

      const typer = convo.members.find((member) => member._id === sender);
      if (!typer) return;

      setIsTyping((prev) => {
        if (!prev) return [typer];

        const alreadyTyping = prev.some((member) => member._id === typer._id);
        return alreadyTyping ? prev : [...prev, typer];
      });
    };

    const stopTypingHandler = (room: string, sender: string) => {
      const convo = currentConvoRef.current;
      console.log("someone stopped");
      if (!convo || room !== convo._id) return;

      setIsTyping((prev) => {
        const updated = prev?.filter((member) => member._id !== sender) ?? [];

        return updated.length > 0 ? updated : null;
      });
    };

    const newMessageHandler = (
      room: string,
      sender: string,
      content: string,
      messageId: string
    ) => {
      const newMessage: Message = {
        _id: messageId,
        sender,
        content,
        sentAt: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      //setConversations(())
    };

    socket.on("isTyping", isTypingHandler);
    socket.on("stopTyping", stopTypingHandler);
    socket.on("message", newMessageHandler);

    return () => {
      socket.off("isTyping", isTypingHandler);
      socket.off("stopTyping", stopTypingHandler);
      socket.off("message", newMessageHandler);
    };
  }, [socket]);

  useEffect(() => {
    const convo = currentConvoRef.current;
    if (!convo || !socket) return;

    if (input.length > 0) {
      socket.emit("isTyping", convo._id, auth!._id);
    } else {
      socket.emit("stopTyping", convo._id, auth!._id);
    }
  }, [input, socket, auth]);

  return (
    <div className="flex gap-2 bg-[#191919] h-full">
      {auth && (
        <>
          <div className="flex-col border-r-1 py-2 ">
            <div className="text-white">Conversations</div>
            <ul className="flex flex-col py-4">
              {conversations.map((convo) => (
                <li key={convo._id}>
                  <div
                    onClick={() => selectConvoHandler(convo._id)}
                    className="flex w-[33vw] min-w-0 items-start gap-2 overflow-hidden hover:bg-[#333333] transition duration-200 p-2 rounded-lg"
                  >
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full bg-white shrink-0" />

                    {/* Text content */}
                    <div className="flex flex-col min-w-0 overflow-hidden">
                      <div className="text-xl font-semibold truncate text-[#CCCCCC]">
                        {convo.groupName ??
                          convo.members
                            .filter((member) => member._id != auth._id)
                            .map((user) => user.displayName)
                            .join(", ")}
                      </div>

                      {convo.lastMessage && convo.lastMessage.sender ? (
                        <div className="flex items-center gap-1 text-[#DDDDDD] min-w-0 overflow-hidden">
                          <span className="shrink-0 text-blue-600 whitespace-nowrap">
                            {convo.lastMessage.sender._id == auth!._id
                              ? "You"
                              : convo.lastMessage.sender.displayName}
                            :
                          </span>

                          <span className="flex-1 min-w-0 truncate">
                            {convo.lastMessage.content}
                          </span>

                          <span className="shrink-0 text-sm text-[#AAAAAA] whitespace-nowrap justify-self-end">
                            {convo.lastMessage.sentAt &&
                              new Date(convo.lastMessage.sentAt).toDateString()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[#DDDDDD] min-w-0 overflow-hidden">
                          Say hello!
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {conversations.length == 0 && <div>No conversations</div>}
          </div>
          {currentConvo && (
            <div className="min-w-lg w-[62vw] h-[100vh] flex flex-col justify-between">
              <div className="">
                <>
                  <div className="pt-4 pl-12 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full" />
                    <div className="text-white text-xl font-semibold">
                      {convoName}
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {messages.map((message) => {
                      if (message.sender != auth!._id!)
                        return (
                          <li key={message._id} className="text-white">
                            <div className="flex gap-2 p-2 max-w-md">
                              {/* <div className="h-7 w-7 bg-white rounded-full mt-5.5 shrink-0" /> */}
                              <Image
                                src={
                                  currentConvo.members.find((member) => {
                                    console.log(member.pictureUri, message)
                                    return(member._id == message.sender);
                                  })!.pictureUri
                                }
                                alt=""
                                height={10}
                                width={10}
                                className="h-10 w-10 rounded-full"
                              />
                              <div className="flex flex-col min-w-0 max-w-md">
                                <div className="text-sm px-2 text-[#CCCCCC]">
                                  {
                                    currentConvo.members.find(
                                      (member) => member._id === message.sender
                                    )?.displayName
                                  }
                                </div>

                                <div className="bg-[#444444] text-base py-1 px-2 rounded-2xl w-fit break-words max-w-[30vw] sm:max-w-sm md:max-w-sm">
                                  {message.content}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      return (
                        <li key={message._id}>
                          <div className="bg-blue-500 w-fit justify-self-end mr-92 py-1 px-2 rounded-2xl text-white">
                            {message.content}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              </div>
              <div>
                <div className="text-white h-sm w-fit">
                  {isTyping && (
                    <div>
                      {isTyping.map((member) => member.displayName).join(", ") +
                        " is typing..."}
                    </div>
                  )}
                </div>
                <div className="bg-white p-1 pl-4 rounded-3xl flex w-fit">
                  <form onSubmit={submitMessageHandler}>
                    <input
                      value={input}
                      onChange={inputChangeHandler}
                      className="w-[30vw] focus:outline-0 text-wrap"
                    ></input>
                  </form>
                  <button className="bg-blue-500 text-white py-1 px-3 rounded-2xl">
                    {">"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Messages;
