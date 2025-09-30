import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error";

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    stack: err.stack,
  });
};
