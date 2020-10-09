import Chalk from "chalk";
import * as winston from "winston";

import Package from "../package.json";

const timestamp = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  let month: string | number = date.getMonth();
  month = (month + 1).toString();
  if (month.length < 2) {
    month = `0${month}`;
  }
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const colorize = (level: string) => {
  level = level.toLocaleUpperCase();
  if (level === "INFO") {
    level = Chalk.green(level);
  }
  return level;
};

/**
 * Logger
 *
 * Everyone always needs a good logger.
 */
const Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ level, message }) => `${timestamp()} ${colorize(level)} ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: `${Package.name}.log` }),
  ],
});

export default Logger;
