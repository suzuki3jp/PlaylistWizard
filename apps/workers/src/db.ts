import * as schema from "@playlistwizard/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

export const createDb = async (databaseUrl: string) => {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  return drizzle(client, { schema });
};

export type Db = Awaited<ReturnType<typeof createDb>>;
