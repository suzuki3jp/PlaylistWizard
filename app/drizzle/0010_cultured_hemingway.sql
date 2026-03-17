ALTER TABLE "jobs" ALTER COLUMN "result" SET DEFAULT '{"completedOpIndices":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "result" SET NOT NULL;