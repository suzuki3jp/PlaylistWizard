import { asc, eq } from "drizzle-orm";
import {
  type AccountId,
  type ProviderAccountId,
  toAccountId,
  toProviderAccountId,
  type UserId,
} from "@/entities/ids";
import { db as dbInstance } from "@/lib/db";
import { account } from "@/lib/db/schema";

type AccountRow = {
  id: string;
  providerId: string;
  accountId: string;
  scope: string | null;
};

type AccountOrderBy = ReturnType<typeof asc>;

type Db = {
  query: {
    account: {
      findFirst: (
        options: Parameters<typeof dbInstance.query.account.findFirst>[0],
      ) => Promise<AccountRow | undefined>;
    };
  };
  select: (selection: {
    id: typeof account.id;
    providerId: typeof account.providerId;
    accountId: typeof account.accountId;
    scope: typeof account.scope;
  }) => {
    from: (table: typeof account) => {
      where: (
        where: Parameters<
          ReturnType<ReturnType<typeof dbInstance.select>["from"]>["where"]
        >[0],
      ) => {
        orderBy: (orderBy: AccountOrderBy) => Promise<AccountRow[]>;
      };
    };
  };
};

export class UserDbRepository {
  constructor(private db: Db) {}

  async findAccountById(id: AccountId): Promise<{
    id: AccountId;
    accountId: ProviderAccountId;
    providerId: string;
  } | null> {
    const row = await this.db.query.account.findFirst({
      where: eq(account.id, id),
    });
    return row
      ? {
          id: toAccountId(row.id),
          accountId: toProviderAccountId(row.accountId),
          providerId: row.providerId,
        }
      : null;
  }

  async findAccountsByUserId(userId: UserId): Promise<
    {
      id: AccountId;
      providerId: string;
      accountId: ProviderAccountId;
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
      id: toAccountId(row.id),
      providerId: row.providerId,
      accountId: toProviderAccountId(row.accountId),
      scope: row.scope,
    }));
  }
}

export const userDbRepository = new UserDbRepository(dbInstance);
