import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import {
  createApiRequestContext,
  verifyApiSessionFromHeaders,
  type ApiAuth,
  type ApiAuthSession,
} from "@/composition/request-context";
import type { Env } from "../../env";
import {
  getCorsOrigins,
  getTrustedOrigins,
  isAllowedOrigin,
} from "../../shared/config";
import { forbidden } from "./errors/forbidden";

type AuthVariables = {
  auth: ApiAuth;
  session: ApiAuthSession;
};

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const isStateChangingMethod = (method: string): boolean =>
  STATE_CHANGING_METHODS.has(method.toUpperCase());

export const createCorsMiddleware = (): MiddlewareHandler<{
  Bindings: Env;
}> =>
  cors({
    origin: (origin, c) =>
      isAllowedOrigin(origin, getCorsOrigins(c.env)) ? origin : null,
    credentials: true,
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 600,
  });

export const requireTrustedOriginForMutation: MiddlewareHandler<{
  Bindings: Env;
}> = async (c, next) => {
  if (!isStateChangingMethod(c.req.method)) {
    await next();
    return;
  }

  const origin = c.req.header("Origin");
  if (!isAllowedOrigin(origin, getTrustedOrigins(c.env))) {
    return forbidden(c);
  }

  await next();
};

export const requireSession: MiddlewareHandler<{
  Variables: AuthVariables;
}> = async (c, next) => {
  const session = await verifyApiSessionFromHeaders(
    c.get("auth"),
    c.req.raw.headers,
  );

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("session", session);
  await next();
};

export const injectVariables: MiddlewareHandler = async (c, next) => {
  const context = await createApiRequestContext(c.env);
  c.set("auth", context.auth);
  c.set("playlistActions", context.playlistActions);

  try {
    await next();
  } finally {
    await context.close();
  }
};
