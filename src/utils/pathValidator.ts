import path from "path";
import fs from "fs/promises";

export async function validatePath(inputPath: string): Promise<string> {
  // Resolve to absolute path
  const resolvedPath = path.resolve(inputPath);

  // Check if path exists and is accessible
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

  // Optional: restrict to a base directory (e.g., process.env.BASE_DIR)
  const baseDir = process.env.BASE_DIR
    ? path.resolve(process.env.BASE_DIR)
    : null;
  if (baseDir && !resolvedPath.startsWith(baseDir)) {
    throw new Error("Access to this directory is not allowed");
  }

  return resolvedPath;
}
