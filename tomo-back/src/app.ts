import dotenv from "dotenv";
import path from "path";

if (process.env.NODE_ENV === "local") {
  console.log("Running locally...");
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
} else {
  console.log("Running with Docker...");
}

import express from "express";
import http from "http";

import postRoutes from "./post/post-routes";
import userRoutes from "./user/user-routes";
import { errorHandler } from "./middleware/error-handler";

import { connectToMongo } from "./utils/mongo";

const app = express();

const PORT = process.env.PORT || 5000;

app.use("/posts", postRoutes);
app.use("/users", userRoutes);
app.use(errorHandler);

const server = http.createServer(app);

connectToMongo()
  .then(() =>
    server.listen(PORT, () => {
      console.log(`Started HTTP server on port ${PORT}`);
    })
  )
  .catch((error) => {
    console.error("Failed to start HTTP server: ", error);
    process.exit(1);
  });
