import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as userModel from "@App/user/user-model";
import { ApiError } from "@App/utils/api-error";
import { ObjectId } from "mongodb";
import fs from "fs";

let CLIENT_ID;
let CLIENT_SECRET;
if (process.env.NODE_ENV == "production") {
  CLIENT_ID = fs
    .readFileSync("/mnt/secrets/google-oauth-client-id", "utf8")
    .trim();
  CLIENT_SECRET = fs
    .readFileSync("/mnt/secrets/google-oauth-client-secret", "utf8")
    .trim();
} else {
  CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
}

passport.serializeUser((user, done) => {
  console.log("serializing user: ", user);
  return done(null, user._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  console.log("deserializing id: ", id);
  const _id = new ObjectId(id);
  const user = await userModel.findPublicUserByUserId(_id);
  return done(null, {
    _id: user!._id.toString(),
    displayName: user!.displayName,
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: CLIENT_ID!,
      clientSecret: CLIENT_SECRET!,
      //callbackURL: "https://oauth.pstmn.io/v1/browser-callback",
      callbackURL: `${process.env.BACK_URL}/auth/google/redirect`,
      scope: ["profile"],
      state: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      if (!profile.id) throw new ApiError("Auth Error", 500);
      console.log(profile);
      const user = await userModel.findUserByGoogleId(profile.id);
      console.log("user:", user);
      let _id: ObjectId;
      if (!user) {
        const result = await userModel.insertUser(
          profile.displayName,
          profile.id,
          profile._json.picture
        );
        _id = result.insertedId;
      } else {
        console.log("hello ", user.displayName);
        _id = user._id;
      }
      return done(null, {
        _id: _id.toString(),
        displayName: profile.displayName,
      } as Express.User);
    }
  )
);
