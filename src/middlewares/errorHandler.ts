import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err.stack || err.message);

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "Internal server error";

  // اگر درخواست انتظار JSON دارد (مثلاً API)
  if (req.accepts("json")) {
    return res.status(statusCode).json({ error: message });
  }

  // در غیر این صورت صفحه HTML خطا را نمایش بده
  res.status(statusCode).render("error", { title: "خطا", message });
};
