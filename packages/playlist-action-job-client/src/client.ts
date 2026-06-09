import type { AppType } from "@playlistwizard/api";
import { hc } from "hono/client";

export const createApiClient = (baseUrl: string) => hc<AppType>(baseUrl);

export type ApiClient = ReturnType<typeof createApiClient>;
