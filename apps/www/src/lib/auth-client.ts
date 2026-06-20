import { API_AUTH_BASE_PATH } from "@playlistwizard/shared";
import { createAuthClient } from "better-auth/react";
import { getPublicApiOrigin } from "./api-url";

export const authClient = createAuthClient({
  baseURL: getPublicApiOrigin(),
  // Better Auth endpoints are versioned with the rest of the public API.
  basePath: API_AUTH_BASE_PATH,
});

export const {
  useSession,
  signIn,
  signOut,
  linkSocial,
  unlinkAccount,
  deleteUser,
} = authClient;
