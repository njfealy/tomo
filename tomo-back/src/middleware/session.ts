import session from "express-session";
import MongoStore from "connect-mongo";
import { getMongoURI } from "@App/utils/mongo";

export const sessionMiddleware = session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: getMongoURI(),
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: false,
  },
});
