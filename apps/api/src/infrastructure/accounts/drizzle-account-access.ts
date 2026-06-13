import * as schema from "@playlistwizard/db";
import { and, eq } from "drizzle-orm";
import type { AccountAccess } from "../../usecase/playlist-actions/ports";
import type { Db } from "../db/connection";

export class DrizzleAccountAccess implements AccountAccess {
  constructor(private readonly db: Db) {}

  async findExecutionAccount(input: { accountId: string; userId: string }) {
    const account = await this.db.query.account.findFirst({
      where: and(
        eq(schema.account.id, input.accountId),
        eq(schema.account.userId, input.userId),
      ),
    });

    if (!account) return null;

    return {
      id: account.id,
      providerAccountId: account.accountId,
      providerId: account.providerId,
      userId: account.userId,
    };
  }
}
