import { Hono } from "hono";
import type {
  ApiAuth,
  ApiAuthSession,
  ApiRequestContext,
} from "@/composition/request-context";
import type { Env } from "@/env";

type Variables = {
  auth: ApiAuth;
  playlistActions: ApiRequestContext["playlistActions"];
  session: ApiAuthSession;
};

export function createHonoApp<V extends object = Variables>() {
  return new Hono<{ Bindings: Env; Variables: V & Variables }>();
}
