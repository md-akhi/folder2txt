import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  BASE_DIR: z.string().optional(),
  MAX_FILE_SIZE: z.coerce.number().default(1024 * 1024), // 1MB
  MAX_OUTPUT_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
});

const env = envSchema.parse(process.env);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
  baseDir: env.BASE_DIR,
  maxFileSize: env.MAX_FILE_SIZE,
  maxOutputSize: env.MAX_OUTPUT_SIZE,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  defaultIgnorePatterns: [
    "node_modules",
    ".git",
    "logs",
    "dist",
    "build",
    "LICENSE",
    "package-lock.json",
  ],
};
