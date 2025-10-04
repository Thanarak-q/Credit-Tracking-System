CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions" ("token");
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");
