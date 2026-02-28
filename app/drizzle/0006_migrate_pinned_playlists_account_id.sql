-- Migrate pinned_playlists.account_id from provider's OAuth accountId to account.id (DB PK)
-- This is a data-only migration; the schema (column type/name) is unchanged.
UPDATE pinned_playlists pp
SET account_id = a.id
FROM account a
WHERE a.account_id = pp.account_id
  AND a.provider_id = pp.provider
  AND a.user_id = pp.user_id;
