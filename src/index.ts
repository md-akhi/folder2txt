import express, { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { walkDir, formatOutput } from "./folderParser";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>Folder2Txt · تبدیل پوشه به متن</title>
        <style>
            body { font-family: system-ui, sans-serif; background: #f4f6f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .card { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 500px; max-width: 90%; }
            h1 { margin-top: 0; color: #2563eb; }
            label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
            input[type=text] { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 1rem; font-family: monospace; }
            button { background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 40px; font-size: 1rem; cursor: pointer; }
            button:hover { background: #1d4ed8; }
            .note { font-size: 0.85rem; color: #64748b; margin-top: 1rem; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>📁 Folder2Txt</h1>
            <p>مسیر یک پوشه روی سرور را وارد کنید تا ساختار و محتوای فایل‌های متنی آن را به صورت یک فایل دریافت کنید.</p>
            <form action="/process" method="post">
                <label for="folderPath">مسیر پوشه:</label>
                <input type="text" id="folderPath" name="folderPath" placeholder="مثال: /home/user/project یا C:\\myproject" required>
                <button type="submit">پردازش و دریافت خروجی</button>
            </form>
            <div class="note">
                ⚠️ فقط پوشه‌های محلی که سرور به آنها دسترسی دارد قابل استفاده است. پوشه‌های node_modules و .git نادیده گرفته می‌شوند.
            </div>
        </div>
    </body>
    </html>
  `);
});

app.post("/process", async (req: Request, res: Response) => {
  const folderPath = req.body.folderPath as string;
  if (!folderPath) {
    return res.status(400).send("مسیر پوشه ارسال نشده");
  }

  try {
    // بررسی وجود پوشه
    await fs.access(folderPath);

    const files = await walkDir(folderPath, folderPath);
    const output = formatOutput(files, folderPath);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="folder2txt_output.txt"',
    );
    res.send(output);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(`خطا در پردازش: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
