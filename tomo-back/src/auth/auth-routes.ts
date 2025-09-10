import { getUserNotifications } from "@App/notification/notification-model";
import { getUserPicture } from "@App/user/user-model";
import express from "express";
import { ObjectId } from "mongodb";
const router = express.Router();

import passport from "passport";

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(200).send("Logged out");
    });
  });
});

router.get(
  "/status",
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log("Auth status");
    if (req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
  }
);

router.get(
  "/google/redirect",
  passport.authenticate("google"),
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.redirect("http://localhost:3000/home");
  }
);
router.get("/google", passport.authenticate("google", { scope: ["profile"] }));

router.get(
  "/me",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.log("me: ", req.user);
    if (!req.user) return res.status(401).send("Unauthorized");
    const userId = new ObjectId(req.user._id);
    const user = await getUserPicture(userId);
    res.status(200).json({ _id: req.user._id, displayName: req.user.displayName, pictureUri: user!.pictureUri });
  }
);

export default router;
