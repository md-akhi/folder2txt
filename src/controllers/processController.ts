import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { processFolder } from "../services/folderProcessor";
import { validatePath } from "../utils/pathValidator";
import logger from "../utils/logger";
import { config } from "../config";

const processSchema = z.object({
  folderPath: z.string().min(1, "مسیر پوشه الزامی است"),
  selectedTypes: z.string().optional().default(""),
  cleanMode: z.enum(["true", "false"]).default("false"),
  separator: z.string().default("--- {filename} ---"),
  commonOnly: z.enum(["true", "false"]).default("false"),
  maxDepth: z.string().optional(),
  ignorePatterns: z.string().optional(),
});

export const processPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = processSchema.parse(req.body);
    const folderPath = parsed.folderPath;
    const selectedTypes = parsed.selectedTypes
      ? parsed.selectedTypes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const cleanMode = parsed.cleanMode === "true";
    const separator = parsed.separator;
    const commonOnly = parsed.commonOnly === "true";
    const maxDepth = parsed.maxDepth
      ? parseInt(parsed.maxDepth, 10)
      : undefined;
    const ignorePatterns = parsed.ignorePatterns
      ? parsed.ignorePatterns.split(",").map((s) => s.trim())
      : undefined;

    // اعتبارسنجی مسیر
    await validatePath(folderPath);

    logger.info(`Processing directory: ${folderPath}`);

    const result = await processFolder(folderPath, {
      selectedTypes,
      cleanMode,
      separator,
      commonOnly,
      maxDepth,
      ignorePatterns,
    });

    // بررسی حجم خروجی
    if (result.content.length > config.maxOutputSize) {
      throw new Error("Output file too large");
    }

    // ارسال فایل
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${req.body.outputName || "folder_content.txt"}"`,
    );
    res.send(result.content);
  } catch (error) {
    next(error);
  }
};
