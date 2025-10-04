import { NextResponse } from "next/server";

import {
  createUserCourse,
  getUserCoursePlan,
  type UserCourseRecord,
} from "@/lib/course-service";
import { readUserFromSessionCookie } from "@/lib/auth";

function toApiShape(record: UserCourseRecord) {
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
  return NextResponse.json({ courses: records.map(toApiShape) });
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
    });

    return NextResponse.json({ course: toApiShape(record) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
