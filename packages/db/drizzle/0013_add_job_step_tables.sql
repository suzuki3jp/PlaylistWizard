CREATE TABLE "job" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"complete_steps" integer DEFAULT 0 NOT NULL,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"error" jsonb,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "step" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"payload" jsonb NOT NULL,
	"last_error" text,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "job_userId_idx" ON "job" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "step_jobId_idx" ON "step" USING btree ("job_id");
