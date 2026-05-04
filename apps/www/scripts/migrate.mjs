import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(databaseUrl, {
  max: 1,
  prepare: false,
});
const db = drizzle(client);

try {
  await migrate(db, {
    migrationsFolder: fileURLToPath(
      new URL("../../../packages/db/drizzle", import.meta.url),
    ),
  });
} finally {
  await client.end({ timeout: 5 });
}
