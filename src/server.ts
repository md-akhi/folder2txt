import app from "./app";
import { config } from "./config";
import logger from "./utils/logger";

const server = app.listen(config.port, () => {
  logger.info(
    `Server running on http://localhost:${config.port} in ${config.nodeEnv} mode`,
  );
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
  });
});
