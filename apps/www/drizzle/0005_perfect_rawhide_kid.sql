CREATE TABLE "pinned_playlists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"playlist_id" text NOT NULL,
	"provider" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pinned_playlists" ADD CONSTRAINT "pinned_playlists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pinned_playlists_unique_idx" ON "pinned_playlists" USING btree ("user_id","account_id","playlist_id");--> statement-breakpoint
CREATE INDEX "pinned_playlists_userId_idx" ON "pinned_playlists" USING btree ("user_id");