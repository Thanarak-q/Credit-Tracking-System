import { NextRequest, NextResponse } from "next/server";

import {
  createUserCourseMeeting,
  type UserCourseMeetingRecord,
} from "@/lib/course-service";
import { readUserFromSessionCookie } from "@/lib/auth";

function toApiShape(meeting: UserCourseMeetingRecord) {
  return {
    id: meeting.meetingId,
    day: meeting.day ?? "",
    startTime: meeting.startTime ?? "",
    endTime: meeting.endTime ?? "",
    room: meeting.room ?? "",
  };
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

type CreatePayload = {
  day?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  room?: unknown;
};

export async function POST(
  request: NextRequest,
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

  let payload: CreatePayload;
  try {
    payload = (await request.json()) as CreatePayload;
  } catch {
    return badRequest("Invalid JSON payload");
  }

  const day = typeof payload.day === "string" ? payload.day : undefined;
  const startTime = typeof payload.startTime === "string" ? payload.startTime : undefined;
  const endTime = typeof payload.endTime === "string" ? payload.endTime : undefined;
  const room = typeof payload.room === "string" ? payload.room : undefined;

  try {
    const meeting = await createUserCourseMeeting({
      userCourseId,
      day,
      startTime,
      endTime,
      room,
    });
    return NextResponse.json({ meeting: toApiShape(meeting) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
