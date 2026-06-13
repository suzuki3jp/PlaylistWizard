import type { Env } from "../env";

const TRUE_VALUES = new Set(["1", "true", "yes", "y"]);

export const parseCommaSeparatedList = (value?: string): string[] =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0) ?? [];

export const parseBooleanEnv = (value?: string): boolean =>
  value ? TRUE_VALUES.has(value.trim().toLowerCase()) : false;

const unique = (values: string[]): string[] => Array.from(new Set(values));

export const getTrustedOrigins = (
  env: Pick<Env, "AUTH_TRUSTED_ORIGINS" | "API_URL">,
): string[] =>
  unique([env.API_URL, ...parseCommaSeparatedList(env.AUTH_TRUSTED_ORIGINS)]);

export const getCorsOrigins = (
  env: Pick<Env, "API_CORS_ORIGINS" | "AUTH_TRUSTED_ORIGINS" | "API_URL">,
): string[] => {
  const explicitOrigins = parseCommaSeparatedList(env.API_CORS_ORIGINS);
  return explicitOrigins.length > 0 ? explicitOrigins : getTrustedOrigins(env);
};

export const isAllowedOrigin = (
  origin: string | null | undefined,
  allowedOrigins: string[],
): origin is string =>
  typeof origin === "string" &&
  origin.length > 0 &&
  allowedOrigins.includes(origin);
