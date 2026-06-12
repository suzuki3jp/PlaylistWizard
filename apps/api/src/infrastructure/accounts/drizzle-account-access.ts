import {
  toAccountId,
  toProviderAccountId,
  toUserId,
} from "@playlistwizard/core/ids";
import { toProvider } from "@playlistwizard/core/provider";
import * as schema from "@playlistwizard/db";
import { and, eq } from "drizzle-orm";
import type { AccountAccess } from "../../usecase/playlist-actions/ports";
import type { Db } from "../db/connection";

export class DrizzleAccountAccess implements AccountAccess {
  constructor(private readonly db: Db) {}

  async findExecutionAccount(
    input: Parameters<AccountAccess["findExecutionAccount"]>[0],
  ) {
    const account = await this.db.query.account.findFirst({
      where: and(
        eq(schema.account.id, input.accountId),
        eq(schema.account.userId, input.userId),
      ),
    });

    if (!account) return null;

    return {
      id: toAccountId(account.id),
      providerAccountId: toProviderAccountId(account.accountId),
      providerId: toProvider(account.providerId),
      userId: toUserId(account.userId),
    };
  }
}
