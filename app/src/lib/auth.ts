import { getEnv } from "@playlistwizard/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import * as schema from "./db/schema";

const env = getEnv([
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SPOTIFY_CLIENT_ID",
  "SPOTIFY_CLIENT_SECRET",
]);
if (env.isErr()) throw env.error;
const [
  betterAuthUrl,
  betterAuthSecret,
  googleClientId,
  googleClientSecret,
  spotifyClientId,
  spotifyClientSecret,
] = env.value;

export const auth = betterAuth({
  baseURL: betterAuthUrl,
  secret: betterAuthSecret,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      accessType: "offline",
      prompt: "consent",
      scopes: ["https://www.googleapis.com/auth/youtube"],
    },
    spotify: {
      clientId: spotifyClientId,
      clientSecret: spotifyClientSecret,
      scopes: [
        "playlist-read-private",
        "playlist-modify-private",
        "playlist-modify-public",
      ],
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "spotify"],
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  user: {
    deleteUser: { enabled: true },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
