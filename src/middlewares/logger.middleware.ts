import { Request, Response, NextFunction } from "express";
import { createLogger, format, transports } from "winston";

const winstonLogger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    process.env.NODE_ENV === "production"
      ? format.json()
      : format.printf(({ timestamp, level, message }) =>
          `${timestamp} [${level.toUpperCase()}] ${message}`
        )
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/combined.log", maxsize: 10_000_000, maxFiles: 5 }),
  ],
});

const METHOD_COLORS: Record<string, string> = {
  GET: "\x1b[32m",
  POST: "\x1b[34m",
  PUT: "\x1b[33m",
  PATCH: "\x1b[33m",
  DELETE: "\x1b[31m",
};

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const color = METHOD_COLORS[method] ?? "\x1b[36m";

  res.on("finish", () => {
    const elapsed = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : "\x1b[32m";

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `${color}${method}\x1b[0m ${originalUrl} ${statusColor}${status}\x1b[0m ${elapsed}ms`
      );
    } else {
      winstonLogger.info(`${method} ${originalUrl} ${status} ${elapsed}ms`);
    }
  });

  next();
};

export { winstonLogger };
