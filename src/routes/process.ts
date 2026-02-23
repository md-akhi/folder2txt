import { Router } from "express";
import { validateFolderPath } from "../middlewares/validation";
import { validatePath } from "../utils/pathValidator";
import { walkDir, formatOutput } from "../services/folderParser";
import { AppError } from "../middlewares/errorHandler";
import logger from "../utils/logger";

const router = Router();

router.post("/", validateFolderPath, async (req, res, next) => {
  try {
    const rawPath = req.body.folderPath;
    const resolvedPath = await validatePath(rawPath);
    logger.info(`Processing directory: ${resolvedPath}`);
    const files = await walkDir(resolvedPath, resolvedPath);
    const output = formatOutput(files, resolvedPath);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="folder2txt_output.txt"',
    );
    res.send(output);
  } catch (err) {
    // اگر خطا از نوع AppError باشد و statusCode 400 داشته باشد، می‌توانیم صفحه خطا نشان دهیم
    // اما چون این مسیر برای دانلود فایل است، بهتر است همان خطا را به صورت JSON برگردانیم
    // یا اگر می‌خواهید صفحه خطا نمایش دهید، می‌توانید اینجا res.render('error', ...) کنید.
    next(
      new AppError(err instanceof Error ? err.message : "Unknown error", 400),
    );
  }
});

export default router;
