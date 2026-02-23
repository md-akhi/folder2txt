import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import processRouter from "./routes/process";
import { errorHandler } from "./middlewares/errorHandler";
import logger from "./utils/logger";
import path from "path";
import expressLayouts from "express-ejs-layouts";

const app = express();

app.use(express.static("assets"));

// تنظیم موتور قالب
app.use(expressLayouts);
app.set("layout", "layout"); // فایل layout پیش‌فرض
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Security middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit(config.rateLimit));

// Logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static pages (optional)
app.get("/", (req, res) => {
  res.render("index", { title: "خانه" });
});

// Routes
app.use("/process", processRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(
    `Server running on http://localhost:${config.port} in ${config.nodeEnv} mode`,
  );
});
