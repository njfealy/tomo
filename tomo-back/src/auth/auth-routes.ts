import express from "express";
const router = express.Router();

import passport from "passport";

router.get(
  "/logout",
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200);
    });
  }
);

router.get(
  "/status",
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
  }
);

router.get(
  "/google/redirect",
  passport.authenticate("google"),
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.redirect("http://localhost:5001/auth/status");
  }
);
router.get("/google", passport.authenticate("google", { scope: ["profile"] }));

export default router;
