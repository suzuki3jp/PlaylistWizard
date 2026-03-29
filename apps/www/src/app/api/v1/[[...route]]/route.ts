import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api/v1");

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
