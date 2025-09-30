import { createClient, RedisClientOptions } from "redis";
import fs from "fs";

let clientOptions: RedisClientOptions | undefined
if(process.env.NODE_ENV == "production") {
  const username = fs.readFileSync("/mnt/secrets/ri-username", "utf8").trim();
  const password = fs.readFileSync("/mnt/secrets/redis-password", "utf8").trim();
  const port = process.env.REDIS_PORT
  clientOptions = { url: `redis://default:${password}@redis:${port}`}
} else {
  clientOptions = { url: "redis://localhost:6379"}
}

export const redis = createClient(clientOptions);

redis.on("error", (err) => console.error("Redis Client Error", err));

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
    console.log("Redis connected");
  }
}
