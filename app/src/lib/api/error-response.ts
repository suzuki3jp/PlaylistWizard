import type { Context } from "hono";

export const unauthorized = (c: Context) =>
  c.json({ error: "Unauthorized" }, 401);
export const forbidden = (c: Context) => c.json({ error: "Forbidden" }, 403);
export const badRequest = (c: Context) => c.json({ error: "Bad Request" }, 400);
export const notFound = (c: Context) => c.json({ error: "Not Found" }, 404);
