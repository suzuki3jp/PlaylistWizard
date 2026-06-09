import * as schema from "@playlistwizard/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getTrustedOrigins, parseBooleanEnv } from "./config";
import type { Db } from "./db";
import type { Env } from "./env";

export const createAuth = (
  db: Db,
  env: Pick<
    Env,
    | "AUTH_COOKIE_DOMAIN"
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
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
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
      additionalFields: {
        isDeveloper: {
          type: "boolean",
          fieldName: "is_developer",
          input: false,
          required: false,
          defaultValue: false,
        },
      },
    },
    advanced: {
      crossSubDomainCookies: {
        enabled: parseBooleanEnv(env.AUTH_CROSS_SUBDOMAIN_COOKIES),
        ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
      },
    },
  });
};

export type WorkerAuth = ReturnType<typeof createAuth>;
export type AuthSession = NonNullable<
  Awaited<ReturnType<WorkerAuth["api"]["getSession"]>>
>;

export const resolveSessionCookieName = (): string[] => {
  // BetterAuth derives cookie name from environment — support both secure and non-secure variants
  return ["__Secure-better-auth.session_token", "better-auth.session_token"];
};

export const verifySessionFromHeaders = async (
  auth: WorkerAuth,
  headers: Headers,
) =>
  auth.api.getSession({
    headers,
    query: { disableCookieCache: "true" },
  });
