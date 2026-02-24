import fs from "fs/promises";
import path from "path";

// Types for the file entries
export interface FileEntry {
  path: string;
  content?: string;
  isBinary?: boolean;
  size?: number;
  error?: string;
}

/**
 * Checks if a file is binary by reading its first 1024 bytes and looking for null bytes.
 */
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

/**
 * Recursively walks a directory and collects file information.
 * Ignores node_modules, .git, and dot-folders.
 */
export async function walkDir(
  dir: string,
  baseDir: string,
): Promise<FileEntry[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: FileEntry[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      // Skip common unwanted directories
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name.startsWith(".")
      ) {
        continue;
      }
      const subResults = await walkDir(fullPath, baseDir);
      results.push(...subResults);
    } else if (entry.isFile()) {
      try {
        const stats = await fs.stat(fullPath);
        const size = stats.size;

        // Skip files larger than 1MB (binary files are not read anyway)
        if (size > 1024 * 1024) {
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
        results.push({ path: relativePath, error: err.message });
      }
    }
  }

  return results;
}

/**
 * Generates a tree-like structure from the list of file paths.
 */
export function generateTree(files: FileEntry[], root: string): string {
  const treeLines: string[] = [];
  const pathSet = new Set<string>();

  // Collect all directory paths
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

/**
 * Formats the collected file entries into a single output string.
 * Includes a tree structure and the content of each file.
 * @param separator The string to use as a separator before each file. May contain {filename}.
 */
export function formatOutput(
  files: FileEntry[],
  root: string,
  separator: string = "--- {filename} ---",
): string {
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
    const header = separator.replace("{filename}", file.path);
    parts.push(header);

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
