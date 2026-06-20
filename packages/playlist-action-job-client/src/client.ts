import type { AppType } from "@playlistwizard/api";
import { API_V1_BASE_PATH, resolveApiUrl } from "@playlistwizard/shared";
import { hc } from "hono/client";

/**
 * Creates a client for the v1 API while keeping environment variables scoped
 * to the API origin rather than coupling deployment config to one version.
 */
export const createApiClient = (baseUrl: string) =>
  hc<AppType>(resolveApiUrl(baseUrl, `${API_V1_BASE_PATH}/`));

export type ApiClient = ReturnType<typeof createApiClient>;
