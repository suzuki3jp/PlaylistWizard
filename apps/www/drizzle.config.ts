import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "../../packages/db/src/schema.ts",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
