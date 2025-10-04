import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import {
  courses,
  type Course,
  type UserCourse,
  userCourses,
} from "@/db/schema";
import { db } from "@/lib/db";

export type UserCourseRecord = {
  userCourseId: string;
  courseId: string;
  code: string;
  nameEn: string;
  nameTh: string | null;
  credits: number;
  year: number;
  semester: number;
  courseType: string | null;
  completed: boolean;
  position: number;
};

export type CreateUserCourseInput = {
  userId: string;
  year: number;
  semester: number;
  courseType?: string | null;
  completed?: boolean;
  code?: string;
  nameEn?: string;
  nameTh?: string | null;
  credits?: number;
};

export type UpdateUserCourseInput = {
  year?: number;
  semester?: number;
  courseType?: string | null;
  completed?: boolean;
  credits?: number | null;
  course?: {
    code?: string;
    nameEn?: string;
    nameTh?: string | null;
    credits?: number;
  };
};

function mapRow(row: {
  userCourseId: string;
  courseId: string;
  code: string;
  nameEn: string;
  nameTh: string | null;
  credits: number | null;
  defaultCredits: number;
  year: number | null;
  semester: number | null;
  courseType: string | null;
  completed: boolean;
  position: number;
}): UserCourseRecord {
  return {
    userCourseId: row.userCourseId,
    courseId: row.courseId,
    code: row.code,
    nameEn: row.nameEn,
    nameTh: row.nameTh,
    credits: row.credits ?? row.defaultCredits,
    year: row.year ?? 0,
    semester: row.semester ?? 0,
    courseType: row.courseType,
    completed: row.completed,
    position: row.position,
  };
}

export async function getUserCoursePlan(userId: string): Promise<UserCourseRecord[]> {
  const rows = await db
    .select({
      userCourseId: userCourses.id,
      courseId: userCourses.courseId,
      code: courses.code,
      nameEn: courses.nameEn,
      nameTh: courses.nameTh,
      credits: userCourses.credits,
      defaultCredits: courses.defaultCredits,
      year: userCourses.year,
      semester: userCourses.semester,
      courseType: userCourses.courseType,
      completed: userCourses.completed,
      position: userCourses.position,
    })
    .from(userCourses)
    .innerJoin(courses, eq(userCourses.courseId, courses.id))
    .where(eq(userCourses.userId, userId))
    .orderBy(
      sql`COALESCE(${userCourses.year}, 0)`,
      sql`COALESCE(${userCourses.semester}, 0)`,
      userCourses.position,
      courses.code
    );

  return rows.map(mapRow);
}

async function ensureCourse(input: {
  code?: string;
  nameEn?: string;
  nameTh?: string | null;
  credits?: number;
}): Promise<Course> {
  const code = (input.code ?? `NEW-${Math.random().toString(36).slice(2, 8)}`).trim();
  const [existing] = await db
    .select()
    .from(courses)
    .where(eq(courses.code, code))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(courses)
    .values({
      code,
      nameEn: input.nameEn?.trim() || "Untitled Course",
      nameTh: input.nameTh?.trim() || null,
      defaultCredits: input.credits ?? 3,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create course record");
  }

  return created;
}

export async function createUserCourse({
  userId,
  year,
  semester,
  courseType,
  completed,
  code,
  nameEn,
  nameTh,
  credits,
}: CreateUserCourseInput): Promise<UserCourseRecord> {
  const course = await ensureCourse({ code, nameEn, nameTh, credits });

  const [{ maxPosition }] = await db
    .select({
      maxPosition: sql<number>`COALESCE(MAX(${userCourses.position}), 0)`,
    })
    .from(userCourses)
    .where(
      and(
        eq(userCourses.userId, userId),
        eq(userCourses.year, year),
        eq(userCourses.semester, semester)
      )
    );

  const [userCourse] = await db
    .insert(userCourses)
    .values({
      userId,
      courseId: course.id,
      year,
      semester,
      courseType: courseType ?? null,
      completed: completed ?? false,
      credits: credits ?? course.defaultCredits,
      position: (maxPosition ?? 0) + 1,
    })
    .returning();

  if (!userCourse) {
    throw new Error("Failed to create user course record");
  }

  return mapRow({
    userCourseId: userCourse.id,
    courseId: course.id,
    code: course.code,
    nameEn: course.nameEn,
    nameTh: course.nameTh,
    credits: userCourse.credits,
    defaultCredits: course.defaultCredits,
    year: userCourse.year,
    semester: userCourse.semester,
    courseType: userCourse.courseType,
    completed: userCourse.completed,
    position: userCourse.position,
  });
}

export async function updateUserCourse(
  userId: string,
  userCourseId: string,
  input: UpdateUserCourseInput
): Promise<UserCourseRecord> {
  const [existing] = await db
    .select({
      userCourse: userCourses,
      course: courses,
    })
    .from(userCourses)
    .innerJoin(courses, eq(userCourses.courseId, courses.id))
    .where(and(eq(userCourses.id, userCourseId), eq(userCourses.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new Error("User course not found");
  }

  if (input.course) {
    const updates: Partial<Course> = {};
    if (typeof input.course.code === "string") {
      updates.code = input.course.code.trim();
    }
    if (typeof input.course.nameEn === "string") {
      updates.nameEn = input.course.nameEn.trim() || "Untitled Course";
    }
    if (typeof input.course.nameTh === "string") {
      updates.nameTh = input.course.nameTh.trim() || null;
    }
    if (typeof input.course.credits === "number") {
      updates.defaultCredits = input.course.credits;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(courses).set(updates).where(eq(courses.id, existing.course.id));
    }
  }

  const courseUpdates: Partial<UserCourse> = {};
  if (typeof input.year === "number") {
    courseUpdates.year = input.year;
  }
  if (typeof input.semester === "number") {
    courseUpdates.semester = input.semester;
  }
  if (typeof input.courseType === "string" || input.courseType === null) {
    courseUpdates.courseType = input.courseType;
  }
  if (typeof input.completed === "boolean") {
    courseUpdates.completed = input.completed;
  }
  if (typeof input.credits === "number") {
    courseUpdates.credits = input.credits;
  }

  if (Object.keys(courseUpdates).length > 0) {
    courseUpdates.updatedAt = new Date();
    await db.update(userCourses).set(courseUpdates).where(eq(userCourses.id, userCourseId));
  }

  const [updated] = await db
    .select({
      userCourseId: userCourses.id,
      courseId: userCourses.courseId,
      code: courses.code,
      nameEn: courses.nameEn,
      nameTh: courses.nameTh,
      credits: userCourses.credits,
      defaultCredits: courses.defaultCredits,
      year: userCourses.year,
      semester: userCourses.semester,
      courseType: userCourses.courseType,
      completed: userCourses.completed,
      position: userCourses.position,
    })
    .from(userCourses)
    .innerJoin(courses, eq(userCourses.courseId, courses.id))
    .where(eq(userCourses.id, userCourseId))
    .limit(1);

  if (!updated) {
    throw new Error("Failed to load updated user course");
  }

  return mapRow(updated);
}

export async function deleteUserCourse(userId: string, userCourseId: string): Promise<void> {
  await db.delete(userCourses).where(and(eq(userCourses.id, userCourseId), eq(userCourses.userId, userId)));
}
