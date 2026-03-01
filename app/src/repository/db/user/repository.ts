import { asc, eq } from "drizzle-orm";
import {
  type AccId,
  type AccountId,
  toAccId,
  toAccountId,
  type UserId,
} from "@/entities/ids";
import { db as dbInstance } from "@/lib/db";
import { account } from "@/lib/db/schema";

type Db = typeof dbInstance;

export class UserDbRepository {
  constructor(private db: Db) {}

  async findAccountById(
    id: AccId,
  ): Promise<{ id: AccId; providerId: string } | null> {
    const row = await this.db.query.account.findFirst({
      where: eq(account.id, id),
    });
    return row ? { id: toAccId(row.id), providerId: row.providerId } : null;
  }

  async findAccountsByUserId(userId: UserId): Promise<
    {
      id: AccId;
      providerId: string;
      accountId: AccountId;
      scope: string | null;
    }[]
  > {
    const rows = await this.db
      .select({
        id: account.id,
        providerId: account.providerId,
        accountId: account.accountId,
        scope: account.scope,
      })
      .from(account)
      .where(eq(account.userId, userId))
      .orderBy(asc(account.createdAt));
    return rows.map((row) => ({
      id: toAccId(row.id),
      providerId: row.providerId,
      accountId: toAccountId(row.accountId),
      scope: row.scope,
    }));
  }
}

export const userDbRepository = new UserDbRepository(dbInstance);
