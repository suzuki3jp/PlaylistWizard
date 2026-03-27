import * as Sentry from "@sentry/nextjs";
import { createMiddleware } from "hono/factory";
import { unauthorized } from "@/lib/api/error-response";

/**
 * WORKER_SECRET による認証ミドルウェア。
 * `Authorization: Bearer WORKER_SECRET` ヘッダーを検証する。
 * Worker 内部用エンドポイントおよび playlist-ops API で使用する。
 */
export const workerAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const secret = process.env.WORKER_SECRET;

  // TODO: remove debug log
  Sentry.captureMessage("[debug] workerAuth", {
    level: "debug",
    extra: {
      workerSecretLength: secret?.length,
      workerSecretPrefix: secret?.slice(0, 4),
      authHeaderLength: authHeader?.length,
      authHeaderPrefix: authHeader?.slice(0, 11),
    },
  });

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return unauthorized(c);
  }

  await next();
});
