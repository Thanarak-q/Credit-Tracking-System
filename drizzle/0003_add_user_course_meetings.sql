CREATE TABLE IF NOT EXISTS "user_course_meetings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_course_id" uuid NOT NULL REFERENCES "user_courses"("id") ON DELETE CASCADE,
  "day" text,
  "start_time" text,
  "end_time" text,
  "room" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "user_course_meetings_course_idx" ON "user_course_meetings" ("user_course_id");
