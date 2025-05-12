import { getEnv } from "@/helpers/getEnv";
import { type LogLevel, Logger } from "./logger";

const logLevel = getEnv(["LOG_LEVEL"]).unwrapOr(["info"])[0] as LogLevel;

export const logger = new Logger({
    name: "Server",
    level: logLevel,
});
