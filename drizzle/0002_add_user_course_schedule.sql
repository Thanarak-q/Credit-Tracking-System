ALTER TABLE "user_courses" ADD COLUMN IF NOT EXISTS "schedule_day" text;
ALTER TABLE "user_courses" ADD COLUMN IF NOT EXISTS "schedule_start_time" text;
ALTER TABLE "user_courses" ADD COLUMN IF NOT EXISTS "schedule_end_time" text;
ALTER TABLE "user_courses" ADD COLUMN IF NOT EXISTS "schedule_room" text;
