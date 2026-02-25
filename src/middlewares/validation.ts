import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validateFolderPath = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const schema = z.object({
    folderPath: z.string().min(1, "Path is required"),
  });
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.issues.map((i) => i.message) });
    }
    next(err);
  }
};
