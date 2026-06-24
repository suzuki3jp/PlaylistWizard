import { Hono } from "hono";
import type { PlaylistActionServices } from "@/composition/playlist-actions";
import type { Env } from "@/env";
import type {
  AuthSession,
  WorkerAuth,
} from "@/infrastructure/auth/better-auth";
import type { Db } from "@/infrastructure/db/connection";

type Variables = {
  auth: WorkerAuth;
  db: Db;
  playlistActions: PlaylistActionServices;
  session: AuthSession;
};

export function createHonoApp<V extends object = Variables>() {
  return new Hono<{ Bindings: Env; Variables: V & Variables }>();
}
