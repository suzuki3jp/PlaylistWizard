import { createMiddleware } from "hono/factory";

/**
 * WORKER_SECRET による認証ミドルウェア。
 * `Authorization: Bearer WORKER_SECRET` ヘッダーを検証する。
 * Worker 内部用エンドポイントおよび playlist-ops API で使用する。
 */
export const workerAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const secret = process.env.WORKER_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
