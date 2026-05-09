/**
 * 指定ユーザーの developer 権限を切り替えるスクリプト
 *
 * Usage:
 *   pnpm --filter @playlistwizard/www tsx scripts/set-developer-user.ts <userIdOrEmail> [true|false]
 *
 * Example:
 *   pnpm --filter @playlistwizard/www tsx scripts/set-developer-user.ts developer@example.com true
 */

import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env") });

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/lib/db/schema";

const [userIdOrEmail, enabledArg = "true"] = process.argv.slice(2);

if (!userIdOrEmail || !["true", "false"].includes(enabledArg)) {
  console.error(
    "Usage: tsx scripts/set-developer-user.ts <userIdOrEmail> [true|false]",
  );
  process.exit(1);
}

const enabled = enabledArg === "true";

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });

  const where = userIdOrEmail.includes("@")
    ? eq(schema.user.email, userIdOrEmail)
    : eq(schema.user.id, userIdOrEmail);

  const rows = await db
    .update(schema.user)
    .set({ isDeveloper: enabled })
    .where(where)
    .returning({
      id: schema.user.id,
      email: schema.user.email,
      isDeveloper: schema.user.isDeveloper,
    });

  if (rows.length === 0) {
    console.error(`User not found: ${userIdOrEmail}`);
    await client.end();
    process.exit(1);
  }

  const user = rows[0];
  console.log(
    `Set is_developer=${user.isDeveloper} for ${user.email} (${user.id})`,
  );

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
