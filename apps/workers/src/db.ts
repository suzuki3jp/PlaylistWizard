import * as schema from "@playlistwizard/db";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";

export type Db = NodePgDatabase<typeof schema>;

export type DbConnection = {
  db: Db;
  close: () => Promise<void>;
};

export const createDbConnection = async (
  databaseUrl: string,
): Promise<DbConnection> => {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  return {
    db: drizzle(client, { schema }),
    close: () => client.end(),
  };
};
