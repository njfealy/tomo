import path from "path";

if (process.env.NODE_ENV === "local") {
  console.log("Running locally...");
  const dotenv = require("dotenv");
  dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
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
    origin: `http://${process.env.FRONT_URL}`,
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());

app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/socket/", socketRoutes);
app.use("/api/notifications", notificationRoutes);
app.get(
  "/api/health",
  (req: express.Request, res: express.Response, next: express.NextFunction) =>
    res.sendStatus(200)
);
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
