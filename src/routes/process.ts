import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { processFolder } from "../services/folderProcessor";
import logger from "../utils/logger";

const router = Router();

const processSchema = z.object({
  folderPath: z.string().min(1, "مسیر پوشه الزامی است"),
  selectedTypes: z.string().optional().default(""),
  cleanMode: z.enum(["true", "false"]).default("false"),
  separator: z.string().default("--- {filename} ---"),
  commonOnly: z.enum(["true", "false"]).default("false"),
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = processSchema.parse(req.body);
    const folderPath = parsed.folderPath;
    const selectedTypes = parsed.selectedTypes
      ? parsed.selectedTypes.split(",").filter((s) => s.trim())
      : [];
    const cleanMode = parsed.cleanMode === "true";
    const separator = parsed.separator;
    const commonOnly = parsed.commonOnly === "true";

    logger.info(`Processing directory: ${folderPath}`);

    const output = await processFolder(folderPath, {
      selectedTypes,
      cleanMode,
      separator,
      commonOnly,
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="folder_content.txt"',
    );
    res.send(output);
  } catch (error) {
    next(error);
  }
});

export default router;
