import type { AppType } from "@playlistwizard/workers";
import { hc } from "hono/client";

export const createWorkersClient = (baseUrl: string) => hc<AppType>(baseUrl);

export type WorkersClient = ReturnType<typeof createWorkersClient>;
