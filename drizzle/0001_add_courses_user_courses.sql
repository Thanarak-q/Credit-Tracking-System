CREATE TABLE IF NOT EXISTS "courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" text NOT NULL,
  "name_en" text NOT NULL,
  "name_th" text,
  "default_credits" integer NOT NULL DEFAULT 3,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "courses_code_idx" ON "courses" ("code");

CREATE TABLE IF NOT EXISTS "user_courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "year" integer,
  "semester" integer,
  "course_type" text,
  "credits" integer,
  "completed" boolean NOT NULL DEFAULT false,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "user_courses_user_idx" ON "user_courses" ("user_id", "course_id", "year", "semester");
