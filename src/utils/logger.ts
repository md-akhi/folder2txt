import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "../config";

const transport = new DailyRotateFile({
  filename: "logs/application-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
});

const logger = winston.createLogger({
  level: config.logLevel,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    transport,
  ],
});

export default logger;
