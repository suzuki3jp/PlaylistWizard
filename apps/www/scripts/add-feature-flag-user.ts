/**
 * 指定ユーザーに対して FeatureFlag を有効化するスクリプト
 *
 * Usage:
 *   pnpm --filter @playlistwizard/www tsx scripts/add-feature-flag-user.ts <userId> <flagName>
 *
 * Example:
 *   pnpm --filter @playlistwizard/www tsx scripts/add-feature-flag-user.ts dM7p6lJFeUS45HecMNFlXH6VsUN00dYQ temp
 */

import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env") });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/lib/db/schema";
import { FeatureFlagName } from "../src/lib/feature-flags";

const [userId, flagName] = process.argv.slice(2);

if (!userId || !flagName) {
  console.error(
    "Usage: tsx scripts/add-feature-flag-user.ts <userId> <flagName>",
  );
  console.error(
    `Available flags: ${Object.values(FeatureFlagName).join(", ")}`,
  );
  process.exit(1);
}

if (!Object.values(FeatureFlagName).includes(flagName as FeatureFlagName)) {
  console.error(`Invalid flagName: "${flagName}"`);
  console.error(
    `Available flags: ${Object.values(FeatureFlagName).join(", ")}`,
  );
  process.exit(1);
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });

  await db
    .insert(schema.featureFlagEnabledUsers)
    .values({
      id: crypto.randomUUID(),
      flagName,
      userId,
    })
    .onConflictDoNothing();

  console.log(`✓ Enabled flag "${flagName}" for user "${userId}"`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
