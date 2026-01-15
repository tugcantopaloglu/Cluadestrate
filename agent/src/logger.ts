import * as winston from "winston";
import * as path from "path";
import * as fs from "fs";
import { LoggingConfig } from "./types";

let logger: winston.Logger;

export function initLogger(config: LoggingConfig): winston.Logger {
  // Ensure log directory exists
  const logDir = path.dirname(config.file);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  logger = winston.createLogger({
    level: config.level,
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ level, message, timestamp, stack }) => {
        if (stack) {
          return `${timestamp} [${level.toUpperCase()}] ${message}\n${stack}`;
        }
        return `${timestamp} [${level.toUpperCase()}] ${message}`;
      })
    ),
    transports: [
      // Console output
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}] ${message}`;
          })
        ),
      }),
      // File output
      new winston.transports.File({
        filename: config.file,
        maxsize: parseSize(config.maxSize),
        maxFiles: config.maxFiles,
        tailable: true,
      }),
      // Error file
      new winston.transports.File({
        filename: config.file.replace(".log", ".error.log"),
        level: "error",
        maxsize: parseSize(config.maxSize),
        maxFiles: config.maxFiles,
      }),
    ],
  });

  return logger;
}

function parseSize(size: string): number {
  const match = size.match(/^(\d+)(k|m|g)?$/i);
  if (!match) return 10 * 1024 * 1024; // Default 10MB

  const num = parseInt(match[1], 10);
  const unit = (match[2] || "").toLowerCase();

  switch (unit) {
    case "k":
      return num * 1024;
    case "m":
      return num * 1024 * 1024;
    case "g":
      return num * 1024 * 1024 * 1024;
    default:
      return num;
  }
}

export function getLogger(): winston.Logger {
  if (!logger) {
    // Return a basic console logger if not initialized
    return winston.createLogger({
      level: "info",
      format: winston.format.simple(),
      transports: [new winston.transports.Console()],
    });
  }
  return logger;
}
