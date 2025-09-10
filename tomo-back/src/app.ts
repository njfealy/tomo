import dotenv from "dotenv";
import path from "path";

if (process.env.NODE_ENV === "local") {
  console.log("Running locally...");
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
} else {
  console.log("Running with Docker...");
}

import express from "express";
import "./types/global";
import http from "http";

import postRoutes from "./post/post-routes";
import userRoutes from "./user/user-routes";
import authRoutes from "./auth/auth-routes";
import conversationRoutes from "./conversation/conversation-routes";
import socketRoutes from "./socket/socket-routes";
import notificationRoutes from "./notification/notification-routes";
import { errorHandler } from "./middleware/error-handler";

import { connectToMongo } from "./utils/mongo";
import passport from "passport";
import "./auth/passport-config";
import { sessionMiddleware } from "./middleware/session";
import bodyParser from "body-parser";

import cors from "cors";
import { setupSocket } from "./utils/socket";
import { connectRedis } from "./utils/redis";
import cron from "node-cron";
import { recalculateTrending } from "./utils/trending";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend's URL
    methods: ["GET", "POST", "DELETE", "PATCH"], // Allow specific HTTP methods
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"], // Allow custom headers
  })
);
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());

// app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
//   res.setHeader(
//     "Acess-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   next();
// });

app.use("/posts", postRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/conversations", conversationRoutes);
app.use("/socket/", socketRoutes);
app.use("/notifications", notificationRoutes);
app.use(errorHandler);

const server = http.createServer(app);
setupSocket(server);

cron.schedule("* * * * *", async () => {
    console.log("[CRON] Recalculating trending scores...");
    await recalculateTrending();
  });

connectToMongo()
  .then(() =>
    server.listen(PORT, () => {
      console.log(`Started HTTP server on port ${PORT}`);
    })
  )
  .then(connectRedis)
  .catch((error) => {
    console.error("Failed to start HTTP server: ", error);
    process.exit(1);
  });
