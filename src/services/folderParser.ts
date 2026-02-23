import fs from "fs/promises";
import path from "path";
import { config } from "../config";
import logger from "../utils/logger";

export interface FileInfo {
  path: string;
  content?: string;
  isBinary?: boolean;
  error?: string;
  size?: number;
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
  ignorePatterns: string[] = config.defaultIgnorePatterns,
): Promise<FileInfo[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: FileInfo[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    // Check ignore patterns
    const shouldIgnore = ignorePatterns.some((pattern) => {
      if (pattern.endsWith("/")) {
        return entry.isDirectory() && entry.name === pattern.slice(0, -1);
      }
      if (pattern.includes("*")) {
        // simple wildcard, could be improved with minimatch
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return regex.test(entry.name);
      }
      return entry.name === pattern;
    });
    if (shouldIgnore) continue;

    if (entry.isDirectory()) {
      const subResults = await walkDir(fullPath, baseDir, ignorePatterns);
      results.push(...subResults);
    } else if (entry.isFile()) {
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

export function generateTree(files: FileInfo[], root: string): string {
  const treeLines: string[] = [];
  const pathSet = new Set<string>();

  for (const f of files) {
    const parts = f.path.split(path.sep);
    let current = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        pathSet.add(current + part);
      } else {
        current += part + path.sep;
        pathSet.add(current);
      }
    }
  }

  const sorted = Array.from(pathSet).sort();
  const prefix = path.basename(root) || root;

  treeLines.push(prefix + "/");

  for (const p of sorted) {
    const depth = p.split(path.sep).length;
    const indent = "  ".repeat(depth);
    const name = p.endsWith(path.sep)
      ? p.slice(0, -1).split(path.sep).pop() + "/"
      : p.split(path.sep).pop() || "";
    treeLines.push(indent + name);
  }

  return treeLines.join("\n");
}

export function formatOutput(files: FileInfo[], root: string): string {
  const tree = generateTree(files, root);
  const parts: string[] = [];
  parts.push("=".repeat(50));
  parts.push("STRUCTURE");
  parts.push("=".repeat(50));
  parts.push(tree);
  parts.push("\n" + "=".repeat(50));
  parts.push("FILES");
  parts.push("=".repeat(50) + "\n");

  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    parts.push(`=== ${file.path} ===`);
    if (file.error) {
      parts.push(`[ERROR: ${file.error}]`);
    } else if (file.isBinary) {
      parts.push(`[BINARY FILE - CONTENT SKIPPED] (${file.size} bytes)`);
    } else if (file.content !== undefined) {
      parts.push(file.content);
    } else {
      parts.push("[EMPTY OR UNREADABLE]");
    }
    parts.push("");
  }

  return parts.join("\n");
}
