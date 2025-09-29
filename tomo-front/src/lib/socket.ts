import { io, Socket } from "socket.io-client";

let socket: Socket | null;

export const getSocket = () => {
  let URL;
  if (process.env.NODE_ENV === "production") {
    URL = "/"
  } else {
    URL = "localhost:5001/"
  }

  if (!socket) {
    socket = io(URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
  }

  socket.on("connect", () => {
    console.log("Connected to Socket.IO with ID:", socket!.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
  });

  socket.on("error", (error) => {
    console.error(error)
  });

  return socket;
};

export const joinRooms = (rooms: string[]) => {
  try {
    socket!.emit("join", rooms)
  } catch(error) {
    console.log(error);
  }
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
