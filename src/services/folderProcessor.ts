import path from "path";
import { walkDir, formatOutput } from "../folderParser";

interface ProcessOptions {
  selectedTypes?: string[];
  cleanMode?: boolean;
  separator?: string;
  commonOnly?: boolean;
}

export async function processFolder(
  folderPath: string,
  options: ProcessOptions = {},
): Promise<string> {
  // (اختیاری) اعتبارسنجی مسیر با BASE_DIR
  // ...

  const files = await walkDir(folderPath, folderPath);

  // اعمال فیلتر selectedTypes
  let filteredFiles = files;
  if (options.selectedTypes && options.selectedTypes.length > 0) {
    const typesSet = new Set(options.selectedTypes);
    filteredFiles = files.filter((f: any) => {
      const ext = path.extname(f.path).slice(1).toLowerCase();
      return typesSet.has(ext);
    });
  }

  // اعمال فیلتر commonOnly
  if (options.commonOnly) {
    const commonTypes = new Set([
      "txt",
      "js",
      "py",
      "json",
      "md",
      "html",
      "css",
      "yml",
      "yaml",
      "xml",
      "sql",
      "gradle",
      "kt",
    ]);
    filteredFiles = filteredFiles.filter((f: any) => {
      const ext = path.extname(f.path).slice(1).toLowerCase();
      return commonTypes.has(ext);
    });
  }

  // پاک‌سازی محتوا اگر فعال باشد
  if (options.cleanMode) {
    for (const f of filteredFiles) {
      if (f.content) {
        const ext = path.extname(f.path).slice(1).toLowerCase();
        f.content = cleanContent(f.content, ext);
      }
    }
  }

  // تولید خروجی با جداکننده دلخواه
  return formatOutput(filteredFiles, folderPath, options.separator);
}

function cleanContent(content: string, ext: string): string {
  // مشابه تابع سمت کاربر اما برای Node
  if (["txt", "md", "json", "csv"].includes(ext)) {
    return content;
  }

  let lines = content.split("\n");
  lines = lines.map((line) => {
    if (
      ["js", "ts", "jsx", "tsx", "java", "c", "cpp", "cs", "go"].includes(ext)
    ) {
      const idx = line.indexOf("//");
      if (idx >= 0 && !isInsideString(line, idx)) {
        line = line.substring(0, idx);
      }
    } else if (["py", "rb", "sh", "bash"].includes(ext)) {
      const idx = line.indexOf("#");
      if (idx >= 0 && !isInsideString(line, idx)) {
        line = line.substring(0, idx);
      }
    } else if (["html", "xml", "xhtml"].includes(ext)) {
      line = line.replace(/<!--[\s\S]*?-->/g, "");
    } else if (["css", "scss", "less"].includes(ext)) {
      line = line.replace(/\/\*[\s\S]*?\*\//g, "");
      const idx = line.indexOf("//");
      if (idx >= 0) line = line.substring(0, idx);
    } else if (ext === "sql") {
      const idx = line.indexOf("--");
      if (idx >= 0) line = line.substring(0, idx);
      line = line.replace(/\/\*[\s\S]*?\*\//g, "");
    }
    return line.trimEnd();
  });

  // حذف خطوط خالی اضافی
  let cleaned: string[] = [];
  let lastWasEmpty = false;
  for (const line of lines) {
    if (line.trim() === "") {
      if (!lastWasEmpty) cleaned.push("");
      lastWasEmpty = true;
    } else {
      cleaned.push(line);
      lastWasEmpty = false;
    }
  }
  return cleaned.join("\n").trim();
}

function isInsideString(line: string, index: number): boolean {
  let inSingle = false,
    inDouble = false;
  for (let i = 0; i < index; i++) {
    if (line[i] === "'" && !inDouble) inSingle = !inSingle;
    if (line[i] === '"' && !inSingle) inDouble = !inDouble;
  }
  return inSingle || inDouble;
}
