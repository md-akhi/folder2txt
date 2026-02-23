import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  maxFileSize: 1024 * 1024, // 1MB (files larger than this are treated as binary)
  defaultIgnorePatterns: ["node_modules", ".git", "*.log"],
};
