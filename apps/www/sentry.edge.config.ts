import * as Sentry from "@sentry/nextjs";

const vercelEnv = process.env.VERCEL_ENV;
const environment =
  vercelEnv === "production"
    ? "production"
    : vercelEnv === "preview"
      ? "staging"
      : "local";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment,
  tracesSampleRate: 1.0,
});
