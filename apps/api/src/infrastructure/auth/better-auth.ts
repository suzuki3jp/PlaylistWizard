import { toUserId, type UserId } from "@playlistwizard/core/ids";
import { betterAuthUserAdditionalFields } from "@playlistwizard/db";
import * as schema from "@playlistwizard/db";
import { API_AUTH_BASE_PATH } from "@playlistwizard/shared";
import * as Sentry from "@sentry/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Env } from "../../env";
import { getTrustedOrigins, parseBooleanEnv } from "../../shared/config";
import type { Db } from "../db/connection";

const DEFAULT_AUTH_COOKIE_PREFIX = "better-auth";
const MAX_BETTER_AUTH_LOG_ARG_COUNT = 5;
const MAX_BETTER_AUTH_LOG_STRING_LENGTH = 500;

export const resolveAuthCookiePrefix = (prefix?: string): string =>
  prefix?.trim() || DEFAULT_AUTH_COOKIE_PREFIX;

type BetterAuthLogLevel = "debug" | "info" | "warn" | "error";

type BetterAuthLogArgSummary =
  | string
  | number
  | boolean
  | null
  | {
      type: string;
      name?: string;
      message?: string;
      stack?: string;
      keys?: string[];
    };

const truncateBetterAuthLogString = (value: string): string =>
  value.length > MAX_BETTER_AUTH_LOG_STRING_LENGTH
    ? `${value.slice(0, MAX_BETTER_AUTH_LOG_STRING_LENGTH)}...`
    : value;

const summarizeBetterAuthLogArg = (arg: unknown): BetterAuthLogArgSummary => {
  if (arg === null) return null;

  if (
    typeof arg === "string" ||
    typeof arg === "number" ||
    typeof arg === "boolean"
  ) {
    return typeof arg === "string" ? truncateBetterAuthLogString(arg) : arg;
  }

  if (arg instanceof Error) {
    return {
      type: "Error",
      name: arg.name,
      message: truncateBetterAuthLogString(arg.message),
      stack: arg.stack ? truncateBetterAuthLogString(arg.stack) : undefined,
    };
  }

  if (typeof arg === "object") {
    return {
      type: arg.constructor?.name ?? "Object",
      keys: Object.keys(arg).slice(0, 20),
    };
  }

  return {
    type: typeof arg,
  };
};

const summarizeBetterAuthLogArgs = (
  args: unknown[],
): BetterAuthLogArgSummary[] =>
  args
    .slice(0, MAX_BETTER_AUTH_LOG_ARG_COUNT)
    .map((arg) => summarizeBetterAuthLogArg(arg));

const findBetterAuthErrorArg = (args: unknown[]): Error | null => {
  for (const arg of args) {
    if (arg instanceof Error) return arg;
  }

  return null;
};

const captureBetterAuthError = (
  message: string,
  args: unknown[] = [],
): void => {
  const error = findBetterAuthErrorArg(args) ?? new Error(message);

  Sentry.withScope((scope) => {
    scope.setTag("component", "better-auth");
    scope.setTag("auth_system", "better-auth");
    scope.setContext("better_auth", {
      message: truncateBetterAuthLogString(message),
      args: summarizeBetterAuthLogArgs(args),
    });
    Sentry.captureException(error);
  });
};

export const betterAuthLogger = {
  level: "warn",
  log(level: BetterAuthLogLevel, message: string, ...args: unknown[]) {
    if (level === "error") {
      captureBetterAuthError(message, args);
    }
  },
} as const;

export const createAuth = (
  db: Db,
  env: Pick<
    Env,
    | "AUTH_COOKIE_DOMAIN"
    | "AUTH_COOKIE_PREFIX"
    | "AUTH_CROSS_SUBDOMAIN_COOKIES"
    | "AUTH_TRUSTED_ORIGINS"
    | "BETTER_AUTH_SECRET"
    | "API_URL"
    | "GOOGLE_CLIENT_ID"
    | "GOOGLE_CLIENT_SECRET"
  >,
) => {
  return betterAuth({
    baseURL: env.API_URL,
    // Authentication is part of the public API contract and must move with v1.
    basePath: API_AUTH_BASE_PATH,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    logger: betterAuthLogger,
    onAPIError: {
      onError(error) {
        captureBetterAuthError("Better Auth API error", [error]);
      },
    },
    trustedOrigins: getTrustedOrigins(env),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        accessType: "offline",
        prompt: "consent",
        scope: ["https://www.googleapis.com/auth/youtube"],
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
        allowDifferentEmails: true,
      },
    },
    session: {
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    user: {
      deleteUser: { enabled: true },
      additionalFields: betterAuthUserAdditionalFields,
    },
    advanced: {
      cookiePrefix: resolveAuthCookiePrefix(env.AUTH_COOKIE_PREFIX),
      crossSubDomainCookies: {
        enabled: parseBooleanEnv(env.AUTH_CROSS_SUBDOMAIN_COOKIES),
        ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
      },
    },
  });
};

export type WorkerAuth = ReturnType<typeof createAuth>;
type BetterAuthSession = NonNullable<
  Awaited<ReturnType<WorkerAuth["api"]["getSession"]>>
>;

export type AuthSession = Omit<BetterAuthSession, "session" | "user"> & {
  session: Omit<BetterAuthSession["session"], "userId"> & {
    userId: UserId;
  };
  user: Omit<BetterAuthSession["user"], "id"> & {
    id: UserId;
  };
};

/**
 * Converts Better Auth identifiers at the infrastructure boundary so callers
 * cannot pass an unbranded User identifier into application services.
 */
const toAuthSession = (session: BetterAuthSession): AuthSession => ({
  ...session,
  session: {
    ...session.session,
    userId: toUserId(session.session.userId),
  },
  user: {
    ...session.user,
    id: toUserId(session.user.id),
  },
});

export const resolveSessionCookieName = (cookiePrefix?: string): string[] => {
  // BetterAuth derives cookie name from environment — support both secure and non-secure variants
  const prefix = resolveAuthCookiePrefix(cookiePrefix);
  return [`__Secure-${prefix}.session_token`, `${prefix}.session_token`];
};

export const verifySessionFromHeaders = async (
  auth: WorkerAuth,
  headers: Headers,
): Promise<AuthSession | null> => {
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: "true" },
  });

  return session ? toAuthSession(session) : null;
};
