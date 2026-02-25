import path from "path";
import fs from "fs/promises";
import { config } from "../config";

export async function validatePath(inputPath: string): Promise<string> {
  const resolvedPath = path.resolve(inputPath);

  try {
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error("Provided path is not a directory");
    }
  } catch (err: any) {
    if (err.code === "ENOENT") {
      throw new Error("Directory does not exist");
    }
    throw new Error(`Cannot access directory: ${err.message}`);
  }

  if (
    config.baseDir &&
    !resolvedPath.startsWith(path.resolve(config.baseDir))
  ) {
    throw new Error("Access to this directory is not allowed");
  }

  return resolvedPath;
}
