// assets/js/main.js
(function () {
  // ---- عناصر DOM ----
  const tabServerBtn = document.getElementById("tabServerBtn");
  const tabLocalBtn = document.getElementById("tabLocalBtn");
  const tabServer = document.getElementById("tabServer");
  const tabLocal = document.getElementById("tabLocal");

  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const browseBtn = document.getElementById("browseBtn");
  const fileTypesSection = document.getElementById("fileTypesSection");
  const fileTypeGrid = document.getElementById("fileTypeGrid");
  const selectAllBtn = document.getElementById("selectAllBtn");
  const deselectAllBtn = document.getElementById("deselectAllBtn");
  const separatorLocal = document.getElementById("separatorLocal");
  const outputName = document.getElementById("outputName");
  const cleanModeLocal = document.getElementById("cleanModeLocal");
  const commonOnlyLocal = document.getElementById("commonOnlyLocal");
  const statusMessage = document.getElementById("statusMessage");
  const progressBar = document.getElementById("progressBar");
  const progressFill = document.getElementById("progressFill");
  const processLocalBtn = document.getElementById("processLocalBtn");
  const copyLocalBtn = document.getElementById("copyLocalBtn");
  const fileListDiv = document.getElementById("fileList");

  // فیلدهای مخفی تب سرور
  const selectedTypesInput = document.getElementById("selectedTypesInput");
  const cleanModeInput = document.getElementById("cleanModeInput");
  const separatorInput = document.getElementById("separatorInput");
  const commonOnlyInput = document.getElementById("commonOnlyInput");
  const serverForm = document.getElementById("serverForm");
  const folderPathInput = document.getElementById("folderPath");

  // ---- متغیرهای حالت ----
  let allFiles = []; // آرایه‌ای از اشیاء File
  let selectedTypes = new Set(); // پسوندهای انتخاب شده
  const commonFileTypes = new Set([
    "txt",
    "js",
    "py",
    "json",
    "md",
    "html",
    "htm",
    "css",
    "yaml",
    "yml",
    "xml",
    "sql",
    "gradle",
    "kt",
  ]);
  let mergedContent = "";

  // ---- توابع کمکی ----

  function showStatus(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = "block";
    if (type !== "processing") {
      setTimeout(() => {
        statusMessage.style.display = "none";
      }, 5000);
    }
  }

  function updateLocalProcessButton() {
    const hasFiles = allFiles.length > 0;
    const hasSelected = selectedTypes.size > 0;
    processLocalBtn.disabled = !(hasFiles && hasSelected);
  }

  function getFileExtension(filename) {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // پاک‌سازی محتوا (مشابه قبل)
  function cleanContent(content, ext) {
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

    let cleaned = [];
    let lastWasEmpty = false;
    for (let line of lines) {
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

  function isInsideString(line, index) {
    let inSingle = false,
      inDouble = false;
    for (let i = 0; i < index; i++) {
      if (line[i] === "'" && !inDouble) inSingle = !inSingle;
      if (line[i] === '"' && !inSingle) inDouble = !inDouble;
    }
    return inSingle || inDouble;
  }

  // ---- رندر انواع فایل‌ها ----
  function renderFileTypes() {
    if (allFiles.length === 0) {
      fileTypesSection.style.display = "none";
      return;
    }

    fileTypesSection.style.display = "block";
    const commonOnly = commonOnlyLocal.checked;

    const extCount = new Map();
    let filteredFiles = allFiles;

    if (commonOnly) {
      filteredFiles = allFiles.filter((f) =>
        commonFileTypes.has(getFileExtension(f.name)),
      );
    }

    filteredFiles.forEach((file) => {
      const ext = getFileExtension(file.name);
      if (ext && (commonOnly ? commonFileTypes.has(ext) : true)) {
        extCount.set(ext, (extCount.get(ext) || 0) + 1);
      }
    });

    if (extCount.size === 0) {
      extCount.set("txt", 0);
    }

    fileTypeGrid.innerHTML = "";
    selectedTypes.clear();

    const sortedExts = Array.from(extCount.keys()).sort();
    sortedExts.forEach((ext) => {
      const count = extCount.get(ext);
      const item = document.createElement("div");
      item.className = "file-type-item";
      item.innerHTML = `
                <input type="checkbox" id="ext-${ext}" value="${ext}" checked>
                <label for="ext-${ext}">.${ext}</label>
                <span class="file-count">${count}</span>
            `;
      const cb = item.querySelector("input");
      cb.addEventListener("change", (e) => {
        if (e.target.checked) selectedTypes.add(ext);
        else selectedTypes.delete(ext);
        updateLocalProcessButton();
      });
      selectedTypes.add(ext);
      fileTypeGrid.appendChild(item);
    });

    updateLocalProcessButton();
    showFileList();
  }

  function showFileList() {
    if (allFiles.length === 0) {
      fileListDiv.style.display = "none";
      return;
    }
    fileListDiv.style.display = "block";
    fileListDiv.innerHTML = "<h4>فایل‌های یافت شده:</h4>";

    const commonOnly = commonOnlyLocal.checked;
    let displayFiles = allFiles;
    if (commonOnly) {
      displayFiles = allFiles.filter((f) =>
        commonFileTypes.has(getFileExtension(f.name)),
      );
    }

    displayFiles.slice(0, 50).forEach((file) => {
      const item = document.createElement("div");
      item.className = "file-list-item";
      const displayPath = file.webkitRelativePath || file.name;
      item.textContent = displayPath;
      fileListDiv.appendChild(item);
    });

    if (displayFiles.length > 50) {
      const more = document.createElement("div");
      more.className = "file-list-item";
      more.style.fontStyle = "italic";
      more.textContent = `... و ${displayFiles.length - 50} فایل دیگر`;
      fileListDiv.appendChild(more);
    }
  }

  // ---- پردازش فایل‌های محلی ----
  async function processLocalFiles() {
    const sep = separatorLocal.value;
    const outName = outputName.value || "merged_files.txt";
    const clean = cleanModeLocal.checked;
    const commonOnly = commonOnlyLocal.checked;

    progressBar.style.display = "block";
    processLocalBtn.disabled = true;
    showStatus("در حال ادغام فایل‌ها...", "processing");

    let filesToProcess = allFiles.filter((file) => {
      const ext = getFileExtension(file.name);
      if (commonOnly && !commonFileTypes.has(ext)) return false;
      return selectedTypes.has(ext);
    });

    if (filesToProcess.length === 0) {
      showStatus("هیچ فایلی برای پردازش انتخاب نشده است.", "error");
      progressBar.style.display = "none";
      processLocalBtn.disabled = false;
      return;
    }

    let output = "";
    let processed = 0;

    for (const file of filesToProcess) {
      const displayName = file.webkitRelativePath || file.name;
      const separatorLine = sep.replace("{filename}", displayName);
      try {
        let content = await readFileAsText(file);
        if (clean) {
          const ext = getFileExtension(file.name);
          content = cleanContent(content, ext);
        }
        output += separatorLine + "\n" + content + "\n\n";
      } catch (err) {
        console.error(err);
        output +=
          separatorLine + "\n[خطا در خواندن فایل: " + err.message + "]\n\n";
      }
      processed++;
      progressFill.style.width =
        (processed / filesToProcess.length) * 100 + "%";
      // اجازه دادن به مرورگر برای به‌روزرسانی رابط
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    mergedContent = output;

    copyLocalBtn.style.display = "block";
    downloadFile(output, outName);

    showStatus(
      `✅ ${filesToProcess.length} فایل با موفقیت ادغام شد.`,
      "success",
    );
    progressBar.style.display = "none";
    processLocalBtn.disabled = false;
  }

  function downloadFile(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copyToClipboard() {
    navigator.clipboard
      .writeText(mergedContent)
      .then(() => showStatus("📋 محتوا کپی شد!", "success"))
      .catch(() => showStatus("❌ کپی ناموفق", "error"));
  }

  // ---- توابع خواندن پوشه (اصلاح‌شده) ----

  /**
   * خواندن بازگشتی یک Entry (فایل یا پوشه) و برگرداندن آرایه‌ای از فایل‌ها
   */
  async function readEntryRecursively(entry) {
    if (entry.isFile) {
      // فایل: برگرداندن یک promise که به آرایه‌ای شامل آن فایل resolve می‌شود
      return new Promise((resolve, reject) => {
        entry.file(resolve, reject);
      }).then((file) => [file]);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await readAllDirectoryEntries(reader);
      // خواندن بازگشتی هر زیرپوشه/فایل
      const fileArrays = await Promise.all(
        entries.map((entry) => readEntryRecursively(entry)),
      );
      // flat کردن آرایه‌ها
      return fileArrays.flat();
    } else {
      return [];
    }
  }

  /**
   * خواندن کامل یک دایرکتوری با تکرار فراخوانی readEntries تا جایی که همه‌ی محتوا برگردانده شود.
   */
  function readAllDirectoryEntries(reader) {
    return new Promise((resolve, reject) => {
      const entries = [];
      function readBatch() {
        reader.readEntries((results) => {
          if (results.length === 0) {
            resolve(entries);
          } else {
            entries.push(...results);
            readBatch(); // خواندن دسته بعدی
          }
        }, reject);
      }
      readBatch();
    });
  }

  /**
   * پردازش آیتم‌های دراپ شده
   */
  async function handleDropItems(items) {
    showStatus("در حال خواندن پوشه...", "processing");
    progressBar.style.display = "block";
    progressFill.style.width = "0%";

    const entries = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) entries.push(entry);
    }

    try {
      const fileArrays = await Promise.all(
        entries.map((entry) => readEntryRecursively(entry)),
      );
      allFiles = fileArrays.flat();
      renderFileTypes();
      showStatus(`${allFiles.length} فایل یافت شد.`, "success");
    } catch (err) {
      console.error(err);
      showStatus("خطا در خواندن پوشه: " + err.message, "error");
    } finally {
      progressBar.style.display = "none";
    }
  }

  function handleFileInput(files) {
    allFiles = Array.from(files);
    renderFileTypes();
    showStatus(`${allFiles.length} فایل انتخاب شد.`, "success");
  }

  // ---- رویدادها ----

  // تغییر تب‌ها
  tabServerBtn.addEventListener("click", () => {
    tabServerBtn.classList.add("active");
    tabLocalBtn.classList.remove("active");
    tabServer.classList.add("active");
    tabLocal.classList.remove("active");
  });

  tabLocalBtn.addEventListener("click", () => {
    tabLocalBtn.classList.add("active");
    tabServerBtn.classList.remove("active");
    tabLocal.classList.add("active");
    tabServer.classList.remove("active");
  });

  // دراپ زون
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      await handleDropItems(items);
    } else {
      showStatus("لطفاً یک پوشه را بکشید", "error");
    }
  });

  browseBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileInput(e.target.files);
    }
  });

  // دکمه‌های انتخاب نوع فایل
  selectAllBtn.addEventListener("click", () => {
    document
      .querySelectorAll('#fileTypeGrid input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = true;
        selectedTypes.add(cb.value);
      });
    updateLocalProcessButton();
  });

  deselectAllBtn.addEventListener("click", () => {
    document
      .querySelectorAll('#fileTypeGrid input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = false;
        selectedTypes.delete(cb.value);
      });
    updateLocalProcessButton();
  });

  commonOnlyLocal.addEventListener("change", renderFileTypes);

  processLocalBtn.addEventListener("click", processLocalFiles);

  copyLocalBtn.addEventListener("click", copyToClipboard);

  // ارسال فرم سرور
  serverForm.addEventListener("submit", (e) => {
    const path = folderPathInput.value.trim();
    if (!path) {
      e.preventDefault();
      showStatus("لطفاً مسیر پوشه را وارد کنید.", "error");
      return;
    }

    selectedTypesInput.value = Array.from(selectedTypes).join(",");
    cleanModeInput.value = cleanModeLocal.checked ? "true" : "false";
    separatorInput.value = separatorLocal.value;
    commonOnlyInput.value = commonOnlyLocal.checked ? "true" : "false";
  });
})();
