import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  table => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  table => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.token),
    userIdx: index("sessions_user_idx").on(table.userId),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    nameEn: text("name_en").notNull(),
    nameTh: text("name_th"),
    defaultCredits: integer("default_credits").notNull().default(3),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  table => ({
    codeIdx: uniqueIndex("courses_code_idx").on(table.code),
  })
);

export const userCourses = pgTable(
  "user_courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    year: integer("year"),
    semester: integer("semester"),
    courseType: text("course_type"),
    credits: integer("credits"),
    completed: boolean("completed").notNull().default(false),
    position: integer("position").notNull().default(0),
    scheduleDay: text("schedule_day"),
    scheduleStartTime: text("schedule_start_time"),
    scheduleEndTime: text("schedule_end_time"),
    scheduleRoom: text("schedule_room"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  table => ({
    userCourseIdx: index("user_courses_user_idx").on(table.userId, table.courseId, table.year, table.semester),
  })
);

// Additional meetings per user course (for multi-day schedules)
export const userCourseMeetings = pgTable(
  "user_course_meetings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userCourseId: uuid("user_course_id")
      .notNull()
      .references(() => userCourses.id, { onDelete: "cascade" }),
    day: text("day"),
    startTime: text("start_time"),
    endTime: text("end_time"),
    room: text("room"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  table => ({
    userCourseIdx: index("user_course_meetings_course_idx").on(table.userCourseId),
  })
);

export const coursesRelations = relations(courses, ({ many }) => ({
  userCourses: many(userCourses),
}));

export const userCoursesRelations = relations(userCourses, ({ one }) => ({
  user: one(users, {
    fields: [userCourses.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userCourses.courseId],
    references: [courses.id],
  }),
}));

export const userCourseMeetingsRelations = relations(userCourseMeetings, ({ one }) => ({
  userCourse: one(userCourses, {
    fields: [userCourseMeetings.userCourseId],
    references: [userCourses.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type UserCourse = typeof userCourses.$inferSelect;
export type NewUserCourse = typeof userCourses.$inferInsert;
export type UserCourseMeeting = typeof userCourseMeetings.$inferSelect;
export type NewUserCourseMeeting = typeof userCourseMeetings.$inferInsert;
