/**
 * Public path prefixes for the PlaylistWizard API contract.
 *
 * Environment variables contain only the API origin. Keeping paths here makes
 * version changes explicit and prevents each application from composing its
 * own variation of the public URL.
 */
export const API_V1_BASE_PATH = "/v1";
export const API_AUTH_BASE_PATH = `${API_V1_BASE_PATH}/api/auth`;
export const API_JOBS_BASE_PATH = `${API_V1_BASE_PATH}/jobs`;
export const API_JOB_PROGRESS_PATH = `${API_JOBS_BASE_PATH}/progress`;

/**
 * Resolves a public API path against an API origin.
 */
export const resolveApiUrl = (apiOrigin: string, path: string): string =>
  new URL(path, apiOrigin).toString();
