import { Context } from "hono";

export function forbidden(c: Context) {
  return c.json({ error: "Forbidden" }, 403);
}
