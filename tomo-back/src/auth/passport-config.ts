import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as userModel from "@App/user/user-model";
import { ApiError } from "@App/utils/api-error";


passport.serializeUser((user, done) => {
  return done(null, user.googleId);
});

passport.deserializeUser(async (id: string, done) => {
  const user = await userModel.findUserByGoogleId(id);
  return done(null, {
    googleId: user!.googleId,
    displayName: user!.displayName,
  } );
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:5001/auth/google/redirect",
      scope: ["profile"],
      state: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      if (!profile.id) throw new ApiError("Auth Error", 500);
      const user = await userModel.findUserByGoogleId(profile.id);
      if (!user) {
        const result = await userModel.insertUser(
          profile.displayName,
          profile.id
        );
      } else { console.log("hello ", user.displayName)}
      return done(null, {
        displayName: profile.displayName,
        googleId: profile.id,
      } as Express.User);
    }
  )
);
