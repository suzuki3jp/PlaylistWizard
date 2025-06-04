import { getEnv } from "@/common/get-env";
import { type LogLevel, Logger } from "@playlistwizard/logger";

const logLevel = getEnv(["LOG_LEVEL"]).unwrapOr(["info"])[0] as LogLevel;

export const logger = new Logger({
  name: "Server",
  level: logLevel,
});
