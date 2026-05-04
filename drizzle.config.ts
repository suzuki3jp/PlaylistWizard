import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load DATABASE_URL from apps/www .env
config({ path: "./apps/www/.env" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/db/src/schema.ts",
  out: "./packages/db/drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
