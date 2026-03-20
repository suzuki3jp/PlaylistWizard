import { Hono } from "hono";
import { handle } from "hono/vercel";
import { jobsRouter } from "@/lib/api/routes/jobs";
import { playlistOpsRouter } from "@/lib/api/routes/playlist-ops";

const app = new Hono().basePath("/api/v1");

app.route("/jobs", jobsRouter);
app.route("/playlist-ops", playlistOpsRouter);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
