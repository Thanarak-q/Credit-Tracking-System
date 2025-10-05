import type { CourseTypeKey } from "@/lib/course-types";

export type UserCourseMeetingDto = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
};

export type UserCourseDto = {
  id: string;
  courseId: string;
  code: string;
  nameEN: string;
  nameTH: string;
  credits: number;
  year: number;
  semester: number;
  courseType: CourseTypeKey | "";
  completed: boolean;
  position: number;
  scheduleDay: string;
  scheduleStartTime: string;
  scheduleEndTime: string;
  scheduleRoom: string;
  meetings?: UserCourseMeetingDto[];
};

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const body = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const message = body && typeof body.error === "string" ? body.error : response.statusText;
    throw new Error(message || "Request failed");
  }

  return body as T;
}

export async function fetchUserCourses(): Promise<UserCourseDto[]> {
  const response = await fetch("/api/user-courses", {
    method: "GET",
    credentials: "include",
    headers: {
      "accept": "application/json",
    },
  });

  const data = await parseResponse<{ courses: UserCourseDto[] }>(response);
  return data.courses;
}

export type CreateUserCoursePayload = {
  year: number;
  semester: number;
  courseType?: CourseTypeKey | "";
  completed?: boolean;
  code?: string;
  nameEN?: string;
  nameTH?: string;
  credits?: number;
  scheduleDay?: string | null;
  scheduleStartTime?: string | null;
  scheduleEndTime?: string | null;
  scheduleRoom?: string | null;
};

export type CreateUserCourseMeetingPayload = {
  day?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
};

export async function createUserCourseMeetingApi(
  userCourseId: string,
  payload: CreateUserCourseMeetingPayload
): Promise<UserCourseMeetingDto> {
  const response = await fetch(`/api/user-courses/${userCourseId}/meetings`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ meeting: UserCourseMeetingDto }>(response);
  return data.meeting;
}

export type UpdateUserCourseMeetingPayload = {
  day?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
};

export async function updateUserCourseMeetingApi(
  userCourseId: string,
  meetingId: string,
  payload: UpdateUserCourseMeetingPayload
): Promise<UserCourseMeetingDto> {
  const response = await fetch(`/api/user-courses/${userCourseId}/meetings/${meetingId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ meeting: UserCourseMeetingDto }>(response);
  return data.meeting;
}

export async function deleteUserCourseMeetingApi(
  userCourseId: string,
  meetingId: string
): Promise<void> {
  const response = await fetch(`/api/user-courses/${userCourseId}/meetings/${meetingId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "accept": "application/json",
    },
  });
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let message = response.statusText;
    if (contentType && contentType.includes("application/json")) {
      const body = await response.json().catch(() => undefined);
      if (body && typeof body.error === "string") {
        message = body.error;
      }
    }
    throw new Error(message || "Failed to delete meeting");
  }
}

export async function createUserCourseApi(payload: CreateUserCoursePayload): Promise<UserCourseDto> {
  const response = await fetch("/api/user-courses", {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse<{ course: UserCourseDto }>(response);
  return data.course;
}

export type UpdateUserCoursePayload = {
  year?: number;
  semester?: number;
  courseType?: CourseTypeKey | "" | null;
  completed?: boolean;
  credits?: number;
  scheduleDay?: string | null;
  scheduleStartTime?: string | null;
  scheduleEndTime?: string | null;
  scheduleRoom?: string | null;
  course?: {
    code?: string;
    nameEN?: string;
    nameTH?: string;
    credits?: number;
  };
};

export async function updateUserCourseApi(
  id: string,
  payload: UpdateUserCoursePayload
): Promise<UserCourseDto> {
  const response = await fetch(`/api/user-courses/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse<{ course: UserCourseDto }>(response);
  return data.course;
}

export async function deleteUserCourseApi(id: string): Promise<void> {
  const response = await fetch(`/api/user-courses/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "accept": "application/json",
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let message = response.statusText;
    if (contentType && contentType.includes("application/json")) {
      const body = await response.json().catch(() => undefined);
      if (body && typeof body.error === "string") {
        message = body.error;
      }
    }
    throw new Error(message || "Failed to delete course");
  }
}
