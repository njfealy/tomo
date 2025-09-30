import express from "express";
import { getUserNotifications } from "./notification-model";
import { ApiError } from "@App/utils/api-error";
import { ObjectId } from "mongodb";
const router = express.Router();

router.get(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!req.user) return next(new ApiError("Unauthorized", 401));
    const userId = new ObjectId(req.user._id);
    const notifications = await getUserNotifications(userId);
    return res.status(200).json({ notifications });
  }
);

export default router;
