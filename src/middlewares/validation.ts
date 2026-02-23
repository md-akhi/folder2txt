import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const folderPathSchema = z.object({
  folderPath: z.string().min(1, "Path is required"),
});

export const validateFolderPath = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    folderPathSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      // استخراج پیام‌های خطا از issues
      const errorMessages = err.issues.map((issue) => issue.message);
      return res.status(400).json({ errors: errorMessages });
    }
    next(err);
  }
};
