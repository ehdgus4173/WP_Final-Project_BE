-- 005_add_oauth.sql — Social login (OAuth: Google / GitHub) support.
--
-- Hybrid auth: Supabase Auth verifies OAuth identity, but session tokens are
-- still our own JWT (HS256). OAuth accounts have NO password_hash — the local
-- login path must tolerate NULL (guarded in authService.verifyCredentials).
--
-- Idempotent (IF NOT EXISTS). Apply manually via Supabase SQL Editor.
-- Numbering: 001 init, 003 user_role, 004 comment replies/likes already used;
-- this is 005.

-- OAuth accounts have no password → relax the NOT NULL from 001.
-- App layer guarantees local accounts still set password_hash.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 'local' for password accounts; 'google' / 'github' for OAuth.
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider    TEXT NOT NULL DEFAULT 'local';

-- Stable per-provider identity (= Supabase Auth user.id). NULL for local accounts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT;

-- One account per (provider, provider_id). Partial: local rows (provider_id NULL)
-- are exempt so multiple local accounts don't collide on a single NULL key.
CREATE UNIQUE INDEX IF NOT EXISTS users_provider_uq
    ON users (provider, provider_id)
    WHERE provider_id IS NOT NULL;
