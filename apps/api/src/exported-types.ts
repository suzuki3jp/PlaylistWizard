import { Hono } from "hono";

// Type-only public surface for the v1 @playlistwizard/api contract.
// Keep this independent from Worker implementation modules so package builds that
// only need the RPC client do not pull in Cloudflare or DB-specific dependencies.
const appType = new Hono()
  .post("/jobs/create", (c) => c.json({ jobId: "" }, 201))
  .post("/jobs/dismiss", (c) => c.json({ jobIds: [] as string[] }))
  .get("/health", (c) => c.text("OK"));

export type AppType = typeof appType;
