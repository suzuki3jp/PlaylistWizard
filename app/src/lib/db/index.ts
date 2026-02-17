import { getEnv } from "@playlistwizard/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const env = getEnv(["DATABASE_URL"]);
if (env.isErr()) throw env.error;
const [databaseUrl] = env.value;

const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });
