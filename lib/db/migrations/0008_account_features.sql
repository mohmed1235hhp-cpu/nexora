CREATE TABLE IF NOT EXISTS "auth_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL UNIQUE,
  "type" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "auth_tokens_user_type_idx" ON "auth_tokens" ("user_id","type");

CREATE TABLE IF NOT EXISTS "referrals" (
  "id" serial PRIMARY KEY NOT NULL,
  "inviter_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "invitee_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "code" text NOT NULL UNIQUE,
  "status" text NOT NULL DEFAULT 'pending',
  "inviter_reward" integer NOT NULL DEFAULT 75,
  "invitee_reward" integer NOT NULL DEFAULT 75,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "completed_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "referrals_inviter_idx" ON "referrals" ("inviter_id");

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "prefix" text NOT NULL,
  "key_hash" text NOT NULL UNIQUE,
  "last_used_at" timestamptz,
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "api_keys_user_idx" ON "api_keys" ("user_id");

CREATE TABLE IF NOT EXISTS "data_exports" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'queued',
  "file_path" text,
  "error" text,
  "expires_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "completed_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "data_exports_user_idx" ON "data_exports" ("user_id");
