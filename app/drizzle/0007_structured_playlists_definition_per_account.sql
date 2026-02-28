-- Add acc_id column (nullable during migration)
ALTER TABLE "structured_playlists_definition" ADD COLUMN "acc_id" text;--> statement-breakpoint

-- Populate acc_id with the user's earliest account id (matching getAccountId orderBy)
UPDATE "structured_playlists_definition" spd
SET "acc_id" = a.id
FROM "account" a
WHERE a.user_id = spd.user_id
  AND a.id = (
    SELECT id FROM "account"
    WHERE user_id = spd.user_id
    ORDER BY created_at ASC
    LIMIT 1
  );--> statement-breakpoint

-- Remove rows where no account was found (safety measure)
DELETE FROM "structured_playlists_definition" WHERE "acc_id" IS NULL;--> statement-breakpoint

-- Make acc_id NOT NULL and change primary key to composite (user_id, acc_id)
ALTER TABLE "structured_playlists_definition" ALTER COLUMN "acc_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "structured_playlists_definition" DROP CONSTRAINT "structured_playlists_definition_pkey";--> statement-breakpoint
ALTER TABLE "structured_playlists_definition" ADD PRIMARY KEY ("user_id", "acc_id");
