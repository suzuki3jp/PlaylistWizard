import { Hono } from "hono";

// Type-only public surface for @playlistwizard/workers.
// Keep this independent from Worker implementation modules so package builds that
// only need the RPC client do not pull in Cloudflare or DB-specific dependencies.
const appType = new Hono()
  .post("/jobs/create", (c) => c.json({ jobId: "" }, 201))
  .get("/health", (c) => c.text("OK"));

export type AppType = typeof appType;
