import { asc, eq } from "drizzle-orm";
import { db as dbInstance } from "@/lib/db";
import { account } from "@/lib/db/schema";

type Db = typeof dbInstance;

export class UserDbRepository {
  constructor(private db: Db) {}

  async findAccountById(
    id: string,
  ): Promise<{ id: string; providerId: string } | null> {
    const row = await this.db.query.account.findFirst({
      where: eq(account.id, id),
    });
    return row ? { id: row.id, providerId: row.providerId } : null;
  }

  async findAccountsByUserId(userId: string): Promise<
    {
      id: string;
      providerId: string;
      accountId: string;
      scope: string | null;
    }[]
  > {
    return this.db
      .select({
        id: account.id,
        providerId: account.providerId,
        accountId: account.accountId,
        scope: account.scope,
      })
      .from(account)
      .where(eq(account.userId, userId))
      .orderBy(asc(account.createdAt));
  }
}

export const userDbRepository = new UserDbRepository(dbInstance);
