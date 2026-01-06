"use cilent";
import { use, useContext } from "react";

import { AuthContext } from "@/presentation/providers";

export function useAuth() {
  const data = useContext(AuthContext);
  return data;
}

/**
 * The page requires authentication, and should redirect to the login page if not authenticated on server side.
 * @returns
 */
export function useNonNullAuth() {
  const data = use(AuthContext);
  if (!data) {
    throw new UnauthorizedError(
      "Authentication is required to access this page, but no auth context was found. Please report this issue.",
    );
  }

  return data;
}

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
