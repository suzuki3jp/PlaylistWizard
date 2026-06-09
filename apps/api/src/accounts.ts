import * as schema from "@playlistwizard/db";
import { and, eq } from "drizzle-orm";
import type { Db } from "./db";

export const findOwnedAccount = ({
  accountId,
  db,
  userId,
}: {
  accountId: string;
  db: Db;
  userId: string;
}) =>
  db.query.account.findFirst({
    where: and(
      eq(schema.account.id, accountId),
      eq(schema.account.userId, userId),
    ),
  });
