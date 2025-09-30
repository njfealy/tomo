import { MongoClient, ServerApiVersion, Db } from "mongodb";
import fs from "fs";

let mongoUri;
if (process.env.NODE_ENV === "local") {
  mongoUri = process.env.MONGO_LOCAL_URI!;

  console.log(process.env.MONGO_LOCAL_URI || "yay");
} else if (process.env.NODE_ENV === "production") {
  const username = fs
    .readFileSync("/mnt/secrets/mongo-username", "utf8")
    .trim();
  const password = fs
    .readFileSync("/mnt/secrets/mongo-password", "utf8")
    .trim();
  mongoUri = `mongodb://${username}:${password}@mongo-0.mongo:27017/?replicaSet=rs0`;
} else {
  mongoUri = process.env.MONGO_DOCKER_URI!;
}

let client: MongoClient;
let db: Db;

export const getMongoURI = () => {
  return mongoUri;
};

export const connectToMongo = async () => {
  if (client) return client;
  try {
    client = new MongoClient(mongoUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
    });
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db("tomo");
    await db.collection("users").createIndex({ displayName: "text" });
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
};

export const getClient = () => {
  if (!client) throw new Error("MongoDB client not connected");
  return client;
};

export const getDb = () => {
  if (!client) throw new Error("MongoDB client not connected");
  return db;
};
