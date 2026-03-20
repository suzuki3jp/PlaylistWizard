import { and, eq } from "drizzle-orm";

import { db as dbInstance } from "@/lib/db";
import { featureFlagEnabledUsers } from "@/lib/db/schema";
import { FeatureFlagName } from "@/lib/feature-flags";

type Db = typeof dbInstance;

const validFlagNames = new Set<string>(Object.values(FeatureFlagName));

export class FeatureFlagDbRepository {
  constructor(private db: Db) {}

  async findEnabledFlagsByUserId(userId: string): Promise<FeatureFlagName[]> {
    const rows = await this.db
      .select({ flagName: featureFlagEnabledUsers.flagName })
      .from(featureFlagEnabledUsers)
      .where(eq(featureFlagEnabledUsers.userId, userId));

    return rows
      .map((r) => r.flagName)
      .filter((name): name is FeatureFlagName => validFlagNames.has(name));
  }

  async insert(flagName: FeatureFlagName, userId: string): Promise<void> {
    await this.db
      .insert(featureFlagEnabledUsers)
      .values({ id: crypto.randomUUID(), flagName, userId })
      .onConflictDoNothing();
  }

  async delete(flagName: FeatureFlagName, userId: string): Promise<void> {
    await this.db
      .delete(featureFlagEnabledUsers)
      .where(
        and(
          eq(featureFlagEnabledUsers.flagName, flagName),
          eq(featureFlagEnabledUsers.userId, userId),
        ),
      );
  }
}

export const featureFlagDbRepository = new FeatureFlagDbRepository(dbInstance);
