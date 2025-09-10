"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { SocketContext } from "./SocketContext";
import { joinRooms } from "../lib/socket";

interface User {
  _id: string;
  displayName: string;
  pictureUri: string;
}

interface AuthContextType {
  auth: User | null;
  setAuth: (auth: User | null) => void;
  conversations: string[] | null;
}


export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<User | null>(null);
  const [conversations, setConversations] = useState<string[] | null>(null);
  
  const [loading, setLoading] = useState(true);
  const socket = useContext(SocketContext)!;

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/auth/me", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        console.log(data)
        setAuth(data);
      } else {
        setAuth(null);
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/socket/setup", {
        method: "GET",
        credentials: "include"
      })
      const data = await res.json();
      setConversations(data.ids)
      joinRooms(data.ids)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    fetchUser();
    fetchUserConversations();
  }, []);

  // useEffect(() => {
  //   console.log("conversations: ", conversations )
    
  // }, [conversations])

  return (
    <AuthContext.Provider value={{ auth, setAuth, conversations }}>
      {children}
    </AuthContext.Provider>
  );
};
