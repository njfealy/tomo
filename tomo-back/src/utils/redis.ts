import { createClient } from "redis";

export const redis = createClient()

redis.on('error', (err) => console.error('Redis Client Error', err));

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
    console.log('Redis connected');
  }
}