import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }

  if (process.env.NODE_ENV === "development") {
    // biome-ignore lint/suspicious/noConsole: dev only
    console.log(
      `=================================================================================
      Please access to see the website to http://127.0.0.1:3000/ instead of localhost
      =================================================================================`,
    );
  }
}

export const onRequestError = Sentry.captureRequestError;
