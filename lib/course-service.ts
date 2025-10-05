import { and, eq, inArray, sql } from "drizzle-orm";

import {
  courses,
  type Course,
  type UserCourse,
  userCourses,
  userCourseMeetings,
  type UserCourseMeeting,
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
  scheduleDay: string | null;
  scheduleStartTime: string | null;
  scheduleEndTime: string | null;
  scheduleRoom: string | null;
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
  scheduleDay?: string | null;
  scheduleStartTime?: string | null;
  scheduleEndTime?: string | null;
  scheduleRoom?: string | null;
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
  scheduleDay?: string | null;
  scheduleStartTime?: string | null;
  scheduleEndTime?: string | null;
  scheduleRoom?: string | null;
};

export type UserCourseMeetingRecord = {
  meetingId: string;
  userCourseId: string;
  day: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
};

export type CreateUserCourseMeetingInput = {
  userCourseId: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
};

export type UpdateUserCourseMeetingInput = {
  day?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
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
  scheduleDay: string | null;
  scheduleStartTime: string | null;
  scheduleEndTime: string | null;
  scheduleRoom: string | null;
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
    scheduleDay: row.scheduleDay,
    scheduleStartTime: row.scheduleStartTime,
    scheduleEndTime: row.scheduleEndTime,
    scheduleRoom: row.scheduleRoom,
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
      scheduleDay: userCourses.scheduleDay,
      scheduleStartTime: userCourses.scheduleStartTime,
      scheduleEndTime: userCourses.scheduleEndTime,
      scheduleRoom: userCourses.scheduleRoom,
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

export async function getUserCourseMeetings(
  userCourseIds: string[]
): Promise<Record<string, UserCourseMeetingRecord[]>> {
  if (userCourseIds.length === 0) {
    return {};
  }
  const rows = await db
    .select({
      id: userCourseMeetings.id,
      userCourseId: userCourseMeetings.userCourseId,
      day: userCourseMeetings.day,
      startTime: userCourseMeetings.startTime,
      endTime: userCourseMeetings.endTime,
      room: userCourseMeetings.room,
    })
    .from(userCourseMeetings)
    .where(inArray(userCourseMeetings.userCourseId, userCourseIds));

  const map: Record<string, UserCourseMeetingRecord[]> = {};
  rows.forEach(row => {
    const list = map[row.userCourseId] || (map[row.userCourseId] = []);
    list.push({
      meetingId: row.id,
      userCourseId: row.userCourseId,
      day: row.day ?? null,
      startTime: row.startTime ?? null,
      endTime: row.endTime ?? null,
      room: row.room ?? null,
    });
  });
  return map;
}

export async function createUserCourseMeeting(
  input: CreateUserCourseMeetingInput
): Promise<UserCourseMeetingRecord> {
  // Ensure the parent user course exists
  const [existingCourse] = await db
    .select({ id: userCourses.id })
    .from(userCourses)
    .where(eq(userCourses.id, input.userCourseId))
    .limit(1);
  if (!existingCourse) {
    throw new Error("User course not found");
  }

  const [created] = await db
    .insert(userCourseMeetings)
    .values({
      userCourseId: input.userCourseId,
      day: input.day?.trim() || null,
      startTime: input.startTime?.trim() || null,
      endTime: input.endTime?.trim() || null,
      room: input.room?.trim() || null,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create meeting");
  }

  return {
    meetingId: created.id,
    userCourseId: created.userCourseId,
    day: created.day ?? null,
    startTime: created.startTime ?? null,
    endTime: created.endTime ?? null,
    room: created.room ?? null,
  };
}

export async function updateUserCourseMeeting(
  userCourseId: string,
  meetingId: string,
  input: UpdateUserCourseMeetingInput
): Promise<UserCourseMeetingRecord> {
  const [existing] = await db
    .select({
      meeting: userCourseMeetings,
    })
    .from(userCourseMeetings)
    .where(and(eq(userCourseMeetings.id, meetingId), eq(userCourseMeetings.userCourseId, userCourseId)))
    .limit(1);

  if (!existing) {
    throw new Error("Meeting not found");
  }

  const updates: Partial<UserCourseMeeting> = {};
  if (typeof input.day === "string") {
    const trimmed = input.day.trim();
    updates.day = trimmed || null;
  } else if (input.day === null) {
    updates.day = null;
  }
  if (typeof input.startTime === "string") {
    const trimmed = input.startTime.trim();
    updates.startTime = trimmed || null;
  } else if (input.startTime === null) {
    updates.startTime = null;
  }
  if (typeof input.endTime === "string") {
    const trimmed = input.endTime.trim();
    updates.endTime = trimmed || null;
  } else if (input.endTime === null) {
    updates.endTime = null;
  }
  if (typeof input.room === "string") {
    const trimmed = input.room.trim();
    updates.room = trimmed || null;
  } else if (input.room === null) {
    updates.room = null;
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();
    await db
      .update(userCourseMeetings)
      .set(updates)
      .where(and(eq(userCourseMeetings.id, meetingId), eq(userCourseMeetings.userCourseId, userCourseId)));
  }

  const [updated] = await db
    .select({
      id: userCourseMeetings.id,
      userCourseId: userCourseMeetings.userCourseId,
      day: userCourseMeetings.day,
      startTime: userCourseMeetings.startTime,
      endTime: userCourseMeetings.endTime,
      room: userCourseMeetings.room,
    })
    .from(userCourseMeetings)
    .where(eq(userCourseMeetings.id, meetingId))
    .limit(1);

  if (!updated) {
    throw new Error("Failed to load updated meeting");
  }

  return {
    meetingId: updated.id,
    userCourseId: updated.userCourseId,
    day: updated.day ?? null,
    startTime: updated.startTime ?? null,
    endTime: updated.endTime ?? null,
    room: updated.room ?? null,
  };
}

export async function deleteUserCourseMeeting(userCourseId: string, meetingId: string): Promise<void> {
  await db
    .delete(userCourseMeetings)
    .where(and(eq(userCourseMeetings.id, meetingId), eq(userCourseMeetings.userCourseId, userCourseId)));
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
  scheduleDay,
  scheduleStartTime,
  scheduleEndTime,
  scheduleRoom,
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
      scheduleDay: scheduleDay ? scheduleDay.trim().toUpperCase() || null : null,
      scheduleStartTime: scheduleStartTime ? scheduleStartTime.trim() || null : null,
      scheduleEndTime: scheduleEndTime ? scheduleEndTime.trim() || null : null,
      scheduleRoom: scheduleRoom ? scheduleRoom.trim() || null : null,
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
    scheduleDay: userCourse.scheduleDay,
    scheduleStartTime: userCourse.scheduleStartTime,
    scheduleEndTime: userCourse.scheduleEndTime,
    scheduleRoom: userCourse.scheduleRoom,
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
  if (typeof input.scheduleDay === "string") {
    const trimmed = input.scheduleDay.trim();
    courseUpdates.scheduleDay = trimmed ? trimmed.toUpperCase() : null;
  } else if (input.scheduleDay === null) {
    courseUpdates.scheduleDay = null;
  }
  if (typeof input.scheduleStartTime === "string") {
    const trimmed = input.scheduleStartTime.trim();
    courseUpdates.scheduleStartTime = trimmed ? trimmed : null;
  } else if (input.scheduleStartTime === null) {
    courseUpdates.scheduleStartTime = null;
  }
  if (typeof input.scheduleEndTime === "string") {
    const trimmed = input.scheduleEndTime.trim();
    courseUpdates.scheduleEndTime = trimmed ? trimmed : null;
  } else if (input.scheduleEndTime === null) {
    courseUpdates.scheduleEndTime = null;
  }
  if (typeof input.scheduleRoom === "string") {
    const trimmed = input.scheduleRoom.trim();
    courseUpdates.scheduleRoom = trimmed ? trimmed : null;
  } else if (input.scheduleRoom === null) {
    courseUpdates.scheduleRoom = null;
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
      scheduleDay: userCourses.scheduleDay,
      scheduleStartTime: userCourses.scheduleStartTime,
      scheduleEndTime: userCourses.scheduleEndTime,
      scheduleRoom: userCourses.scheduleRoom,
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
