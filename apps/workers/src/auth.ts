import * as schema from "@playlistwizard/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "./db";

export const createAuth = (
  db: Db,
  env: {
    baseURL: string;
    secret: string;
    googleClientId: string;
    googleClientSecret: string;
  },
) => {
  return betterAuth({
    baseURL: env.baseURL,
    secret: env.secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    socialProviders: {
      google: {
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
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
    },
  });
};

export type WorkerAuth = ReturnType<typeof createAuth>;

export const resolveSessionCookieName = (): string[] => {
  // BetterAuth derives cookie name from environment — support both secure and non-secure variants
  return ["__Secure-better-auth.session_token", "better-auth.session_token"];
};

export const extractSessionToken = (
  authorizationHeader: string | null,
): string | null => {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

export const verifySession = async (auth: WorkerAuth, sessionToken: string) => {
  // Try both cookie name variants to handle secure/non-secure environments
  const cookieNames = resolveSessionCookieName();

  for (const cookieName of cookieNames) {
    const session = await auth.api.getSession({
      headers: new Headers({
        Cookie: `${cookieName}=${sessionToken}`,
      }),
      query: { disableCookieCache: "true" },
    });
    if (session) return session;
  }

  return null;
};
