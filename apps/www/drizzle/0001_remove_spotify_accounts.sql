-- Remove all Spotify OAuth account records
-- Run this migration after deploying the code changes that remove Spotify support
DELETE FROM "account" WHERE "provider_id" = 'spotify';
