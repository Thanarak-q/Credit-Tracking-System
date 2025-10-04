import { NextRequest, NextResponse } from "next/server";

import {
  deleteUserCourse,
  type UserCourseRecord,
  updateUserCourse,
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

type UpdatePayload = {
  year?: unknown;
  semester?: unknown;
  courseType?: unknown;
  completed?: unknown;
  credits?: unknown;
  course?: {
    code?: unknown;
    nameEN?: unknown;
    nameTH?: unknown;
    credits?: unknown;
  };
};

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await readUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userCourseId } = await params;
  if (!userCourseId) {
    return badRequest("Missing course id");
  }

  let payload: UpdatePayload;
  try {
    payload = (await _request.json()) as UpdatePayload;
  } catch {
    return badRequest("Invalid JSON payload");
  }

  const updateInput: Parameters<typeof updateUserCourse>[2] = {};

  if (typeof payload.year === "number" && Number.isInteger(payload.year)) {
    updateInput.year = payload.year;
  }
  if (typeof payload.semester === "number" && Number.isInteger(payload.semester)) {
    updateInput.semester = payload.semester;
  }
  if (typeof payload.completed === "boolean") {
    updateInput.completed = payload.completed;
  }
  if (typeof payload.courseType === "string") {
    const trimmed = payload.courseType.trim();
    updateInput.courseType = trimmed ? trimmed : null;
  } else if (payload.courseType === null) {
    updateInput.courseType = null;
  }
  if (typeof payload.credits === "number" && Number.isFinite(payload.credits)) {
    updateInput.credits = payload.credits;
  }

  if (payload.course && typeof payload.course === "object") {
    const courseUpdates: NonNullable<typeof updateInput.course> = {};
    if (typeof payload.course.code === "string") {
      courseUpdates.code = payload.course.code.trim();
    }
    if (typeof payload.course.nameEN === "string") {
      courseUpdates.nameEn = payload.course.nameEN.trim();
    }
    if (typeof payload.course.nameTH === "string") {
      courseUpdates.nameTh = payload.course.nameTH.trim();
    }
    if (typeof payload.course.credits === "number" && Number.isFinite(payload.course.credits)) {
      courseUpdates.credits = payload.course.credits;
    }

    if (Object.keys(courseUpdates).length > 0) {
      updateInput.course = courseUpdates;
    }
  }

  if (Object.keys(updateInput).length === 0) {
    return badRequest("No valid fields to update");
  }

  try {
    const record = await updateUserCourse(user.id, userCourseId, updateInput);
    return NextResponse.json({ course: toApiShape(record) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await readUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userCourseId } = await params;
  if (!userCourseId) {
    return badRequest("Missing course id");
  }

  try {
    await deleteUserCourse(user.id, userCourseId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
