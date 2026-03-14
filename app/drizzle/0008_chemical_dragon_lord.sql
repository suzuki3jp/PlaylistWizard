CREATE TABLE "feature_flag_enabled_users" (
	"id" text PRIMARY KEY NOT NULL,
	"flag_name" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feature_flag_enabled_users" ADD CONSTRAINT "feature_flag_enabled_users_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flag_enabled_users_unique_idx" ON "feature_flag_enabled_users" USING btree ("flag_name","user_id");--> statement-breakpoint
CREATE INDEX "feature_flag_enabled_users_userId_idx" ON "feature_flag_enabled_users" USING btree ("user_id");