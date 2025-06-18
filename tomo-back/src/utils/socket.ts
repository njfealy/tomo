import { Server as SocketIOServer } from "socket.io";
import { sessionMiddleware } from "@App/middleware/session";
import { Server as HTTPServer } from "http";
import passport from "passport";

const wrap = (middleware: any) => (socket: any, next: any) => {
  middleware(socket.request, {} as any, next);
};

export const setupSocket = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.engine.use(sessionMiddleware)
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));

  io.on("connection", (socket) => {
    const user = socket.request.user;
    if(!user) {
      console.log("Unauthorized socket");
      return socket.disconnect();
    }

    console.log('Socket connected for user: ', user.displayName)
  })

  return io;
};
