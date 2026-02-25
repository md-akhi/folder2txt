import fs from "fs/promises";
import path from "path";
import {
  FileEntry,
  DEFAULT_SKIP_FOLDERS,
  DEFAULT_SKIP_FILES,
  DEFAULT_SKIP_EXTENSIONS,
} from "../shared/core";
import { config } from "../config";
import logger from "../utils/logger";

function shouldSkipByUserPatterns(
  relativePath: string,
  ignorePatterns: string[],
): boolean {
  for (const pattern of ignorePatterns) {
    if (pattern.includes("*")) {
      const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(relativePath)) return true;
    } else {
      if (relativePath === pattern || relativePath.startsWith(pattern + "/"))
        return true;
    }
  }
  return false;
}

function shouldSkipDefaultFolder(relativePath: string): boolean {
  if (DEFAULT_SKIP_FOLDERS.includes(relativePath)) return true;
  for (const folder of DEFAULT_SKIP_FOLDERS) {
    if (relativePath.startsWith(folder + "/") || relativePath === folder)
      return true;
  }
  return false;
}

function shouldSkipDefaultFile(
  fileName: string,
  relativePath: string,
): boolean {
  if (DEFAULT_SKIP_FILES.includes(fileName)) return true;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (DEFAULT_SKIP_EXTENSIONS.includes(ext)) return true;
  return false;
}

async function isBinaryFile(filePath: string): Promise<boolean> {
  const buffer = Buffer.alloc(1024);
  const fd = await fs.open(filePath, "r");
  try {
    const { bytesRead } = await fd.read(buffer, 0, 1024, 0);
    return buffer.subarray(0, bytesRead).includes(0x00);
  } finally {
    await fd.close();
  }
}

export async function walkDir(
  dir: string,
  baseDir: string,
  userIgnorePatterns: string[] = config.defaultIgnorePatterns,
  currentDepth = 0,
  maxDepth?: number,
): Promise<FileEntry[]> {
  if (maxDepth !== undefined && currentDepth > maxDepth) return [];

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: FileEntry[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    // اولویت با الگوهای کاربر
    if (shouldSkipByUserPatterns(relativePath, userIgnorePatterns)) continue;

    if (entry.isDirectory()) {
      if (shouldSkipDefaultFolder(relativePath)) continue;
      const subResults = await walkDir(
        fullPath,
        baseDir,
        userIgnorePatterns,
        currentDepth + 1,
        maxDepth,
      );
      results.push(...subResults);
    } else if (entry.isFile()) {
      if (shouldSkipDefaultFile(entry.name, relativePath)) {
        try {
          const stats = await fs.stat(fullPath);
          results.push({
            path: relativePath,
            isBinary: true,
            size: stats.size,
          });
        } catch (err: any) {
          logger.warn(`Error stating file ${fullPath}: ${err.message}`);
          results.push({ path: relativePath, error: err.message });
        }
        continue;
      }

      try {
        const stats = await fs.stat(fullPath);
        const size = stats.size;

        if (size > config.maxFileSize) {
          results.push({ path: relativePath, isBinary: true, size });
          continue;
        }

        const binary = await isBinaryFile(fullPath);
        if (binary) {
          results.push({ path: relativePath, isBinary: true, size });
        } else {
          const content = await fs.readFile(fullPath, "utf-8");
          results.push({ path: relativePath, content, size });
        }
      } catch (err: any) {
        logger.warn(`Error reading file ${fullPath}: ${err.message}`);
        results.push({ path: relativePath, error: err.message });
      }
    }
  }

  return results;
}
