import { NextRequest, NextResponse } from "next/server";

import {
  deleteUserCourseMeeting,
  updateUserCourseMeeting,
} from "@/lib/course-service";
import { readUserFromSessionCookie } from "@/lib/auth";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

type UpdatePayload = {
  day?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  room?: unknown;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const user = await readUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userCourseId, meetingId } = await params;
  if (!userCourseId || !meetingId) {
    return badRequest("Missing identifiers");
  }

  let payload: UpdatePayload;
  try {
    payload = (await request.json()) as UpdatePayload;
  } catch {
    return badRequest("Invalid JSON payload");
  }

  const day = typeof payload.day === "string" ? payload.day : payload.day === null ? null : undefined;
  const startTime =
    typeof payload.startTime === "string"
      ? payload.startTime
      : payload.startTime === null
      ? null
      : undefined;
  const endTime =
    typeof payload.endTime === "string"
      ? payload.endTime
      : payload.endTime === null
      ? null
      : undefined;
  const room = typeof payload.room === "string" ? payload.room : payload.room === null ? null : undefined;

  try {
    const meeting = await updateUserCourseMeeting(userCourseId, meetingId, {
      day,
      startTime,
      endTime,
      room,
    });
    return NextResponse.json({
      meeting: {
        id: meeting.meetingId,
        day: meeting.day ?? "",
        startTime: meeting.startTime ?? "",
        endTime: meeting.endTime ?? "",
        room: meeting.room ?? "",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const user = await readUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userCourseId, meetingId } = await params;
  if (!userCourseId || !meetingId) {
    return badRequest("Missing identifiers");
  }

  try {
    await deleteUserCourseMeeting(userCourseId, meetingId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
