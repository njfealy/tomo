import { Socket, Server as SocketIOServer } from "socket.io";
import { sessionMiddleware } from "@App/middleware/session";
import { Server as HTTPServer } from "http";
import passport from "passport";
import {
  findConversationById,
  updateConversationLastMessage,
} from "@App/conversation/conversation-model";
import { ObjectId } from "mongodb";
import { insertMessage } from "@App/message/message-model";
import { getClient } from "./mongo";

let io: SocketIOServer;
export const userSocketMap = new Map<string, Set<Socket>>();

const wrap = (middleware: any) => (socket: any, next: any) => {
  middleware(socket.request, {} as any, next);
};

export const setupSocket = (server: HTTPServer) => {
  let URL;
  if (process.env.NODE_ENV === "production") {
    URL = "https://nickfealytomo.site"
  } else {
    URL = `http://localhost:${process.env.FRONT_PORT}`
  }
  io = new SocketIOServer(server, {
    cors: {
      origin: URL,
      credentials: true,
    },
  });

  io.engine.use(sessionMiddleware);
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));

  io.on("connection", (socket) => {
    const user = socket.request.user;
    if (user) {
      const currentSockets = userSocketMap.get(user._id);
      if (currentSockets) currentSockets.add(socket);
      else {
        const socketSet = new Set<Socket>();
        socketSet.add(socket);
        userSocketMap.set(user._id, socketSet);
      }

      console.log(`User ${user._id} connected Socket ${socket.id}`);
    } else {
      console.log(`Anonymous socket ${socket.id} connected`);
    }

    socket.on("disconnect", (reason) => {
      if (user) {
        const userSockets = userSocketMap.get(user._id);
        userSockets?.delete(socket)
      }
      console.log(
        `User ${user?._id ?? "(anonymous)"} disconnected with reason ${reason}`
      );
    });

    // socket.on("disconnect", () => {
    //   console.log("Socket disconnected");
    // });

    socket.on("hello", (message) => {
      console.log("Hello from socket ", socket.id);
      console.log(message);
    });

    socket.on("next", () => {
      console.log("Nextjs client connected");
    });

    socket.on("join", (rooms: string[]) => {
      if (!user) return socket.emit("error", "Unauthorized");
      rooms.map((room) => {
        socket.join(room);
        console.log("Socket ", socket.id, "joining room ", room);
      });
    });

    socket.on(
      "message",
      async (room: string, sender: string, content: string) => {
        if (!user || user._id != sender)
          return socket.emit("error", "Unauthorized");
        console.log(
          "sending message to room ",
          room,
          " from ",
          sender,
          ": ",
          content
        );
        const conversation = await findConversationById(new ObjectId(room));
        if (!conversation)
          return socket.emit("error", "Conversation not found");
        if (content == "")
          return socket.emit("error", "Message content must not be empty");
        const session = getClient().startSession();
        session.startTransaction();
        try {
          const insertResult = await insertMessage(
            content,
            new ObjectId(sender),
            new ObjectId(room)
          );
          if (!insertResult.acknowledged)
            return socket.emit("error", "Failed to send message");
          await updateConversationLastMessage(
            new ObjectId(room),
            insertResult.insertedId
          );

          await session.commitTransaction();
          await session.endSession();
          const messageId = insertResult.insertedId.toString();
          socket.to(room).emit("message", room, sender, content, messageId);
        } catch (error) {
          await session.abortTransaction();
          await session.endSession();
          return socket.emit("error", "Failed to send message");
        }
      }
    );

    socket.on("isTyping", async (room: string, sender: string) => {
      // console.log("room: ", room);
      // console.log("sender: ", sender);
      // console.log("auth: ", socket.request.user?._id)
      if (!user || user._id != sender)
        return socket.emit("error", "Unauthorized");

      const conversation = await findConversationById(new ObjectId(room));
      if (!conversation) return socket.emit("error", "Conversation not found");

      console.log("Room ", room, ": user ", sender, " is typing...");
      socket.to(room).emit("isTyping", room, sender);
    });

    socket.on("stopTyping", async (room: string, sender: string) => {
      if (!user || user._id != sender)
        return socket.emit("error", "Unauthorized");

      const conversation = await findConversationById(new ObjectId(room));
      if (!conversation) return socket.emit("error", "Conversation not found");

      console.log("Room ", room, ": user ", sender, " stopped typing");
      socket.to(room).emit("stopTyping", room, sender);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};
