"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";

export const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    console.log(socket)
    setSocket(socket);
    

    return () => {
      socket.off();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
