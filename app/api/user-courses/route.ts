import { NextResponse } from "next/server";

import {
  createUserCourse,
  getUserCoursePlan,
  getUserCourseMeetings,
  type UserCourseRecord,
  type UserCourseMeetingRecord,
} from "@/lib/course-service";
import { readUserFromSessionCookie } from "@/lib/auth";

function toApiShape(
  record: UserCourseRecord,
  meetings?: UserCourseMeetingRecord[]
) {
  return {
    id: record.userCourseId,
    courseId: record.courseId,
    code: record.code,
    nameEN: record.nameEn,
    nameTH: record.nameTh ?? "",
    credits: record.credits,
    year: record.year,
    semester: record.semester,
    courseType: record.courseType ?? "",
    completed: record.completed,
    position: record.position,
    scheduleDay: record.scheduleDay ?? "",
    scheduleStartTime: record.scheduleStartTime ?? "",
    scheduleEndTime: record.scheduleEndTime ?? "",
    scheduleRoom: record.scheduleRoom ?? "",
    meetings: (meetings ?? []).map(m => ({
      id: m.meetingId,
      day: m.day ?? "",
      startTime: m.startTime ?? "",
      endTime: m.endTime ?? "",
      room: m.room ?? "",
    })),
  };
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  const user = await readUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await getUserCoursePlan(user.id);
  const meetingMap = await getUserCourseMeetings(records.map(r => r.userCourseId));
  const result = records.map(r => toApiShape(r, meetingMap[r.userCourseId]));
  return NextResponse.json({ courses: result });
}

type CreatePayload = {
  year?: unknown;
  semester?: unknown;
  courseType?: unknown;
  completed?: unknown;
  code?: unknown;
  nameEN?: unknown;
  nameTH?: unknown;
  credits?: unknown;
  scheduleDay?: unknown;
  scheduleStartTime?: unknown;
  scheduleEndTime?: unknown;
  scheduleRoom?: unknown;
};

export async function POST(request: Request) {
  const user = await readUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreatePayload;
  try {
    payload = (await request.json()) as CreatePayload;
  } catch {
    return badRequest("Invalid JSON payload");
  }

  const { year, semester } = payload;
  if (typeof year !== "number" || !Number.isInteger(year)) {
    return badRequest("`year` must be an integer");
  }
  if (typeof semester !== "number" || !Number.isInteger(semester)) {
    return badRequest("`semester` must be an integer");
  }

  let credits: number | undefined;
  if (typeof payload.credits === "number" && Number.isFinite(payload.credits)) {
    credits = payload.credits;
  }

  const courseType = typeof payload.courseType === "string" ? payload.courseType.trim() : undefined;
  const completed = typeof payload.completed === "boolean" ? payload.completed : undefined;
  const code = typeof payload.code === "string" ? payload.code.trim() : undefined;
  const nameEn = typeof payload.nameEN === "string" ? payload.nameEN.trim() : undefined;
  const nameTh = typeof payload.nameTH === "string" ? payload.nameTH.trim() : undefined;
  const rawScheduleDay = typeof payload.scheduleDay === "string" ? payload.scheduleDay.trim() : undefined;
  const scheduleDay = rawScheduleDay ? rawScheduleDay.toUpperCase() : undefined;
  const scheduleStartTime =
    typeof payload.scheduleStartTime === "string" ? payload.scheduleStartTime.trim() : undefined;
  const scheduleEndTime =
    typeof payload.scheduleEndTime === "string" ? payload.scheduleEndTime.trim() : undefined;
  const rawScheduleRoom =
    typeof payload.scheduleRoom === "string" ? payload.scheduleRoom.trim() : undefined;
  const scheduleRoom = rawScheduleRoom && rawScheduleRoom.length > 0 ? rawScheduleRoom : undefined;

  try {
    const record = await createUserCourse({
      userId: user.id,
      year,
      semester,
      courseType: courseType ? courseType : null,
      completed,
      code,
      nameEn,
      nameTh,
      credits,
      scheduleDay: scheduleDay ?? null,
      scheduleStartTime: scheduleStartTime ?? null,
      scheduleEndTime: scheduleEndTime ?? null,
      scheduleRoom: scheduleRoom ?? null,
    });

    return NextResponse.json({ course: toApiShape(record) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
