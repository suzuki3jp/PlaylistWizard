import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://test:test@localhost:5433/playlistwizard_test";

let client: postgres.Sql | undefined;
let db: ReturnType<typeof drizzle<typeof schema>>;

export function getTestDb() {
  if (!client) {
    client = postgres(TEST_DATABASE_URL, { prepare: false });
    db = drizzle(client, { schema });
  }
  return db;
}

export async function runMigrations(): Promise<void> {
  const testDb = getTestDb();
  const migrationsFolder = resolve(__dirname, "../../../drizzle");
  await migrate(testDb, { migrationsFolder });
}

export async function closeTestDb(): Promise<void> {
  if (client) {
    await client.end();
    client = undefined;
  }
}

export async function insertTestUser(
  testDb: ReturnType<typeof getTestDb>,
  overrides?: { id?: string; name?: string; email?: string },
): Promise<string> {
  const id = overrides?.id ?? `test-user-${Date.now()}`;
  await testDb.insert(schema.user).values({
    id,
    name: overrides?.name ?? "Test User",
    email: overrides?.email ?? `test-${id}@example.com`,
    emailVerified: false,
  });
  return id;
}

export async function cleanupTestData(
  testDb: ReturnType<typeof getTestDb>,
): Promise<void> {
  await testDb.delete(schema.account);
  await testDb.delete(schema.session);
  await testDb.delete(schema.user);
}
