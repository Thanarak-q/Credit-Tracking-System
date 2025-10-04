export const COURSE_TYPE_KEYS = [
  "required",
  "core",
  "major",
  "majorElective",
  "minor",
  "free",
  "ge",
] as const;

export type CourseTypeKey = (typeof COURSE_TYPE_KEYS)[number];

export function isCourseTypeKey(value: unknown): value is CourseTypeKey {
  return typeof value === "string" && (COURSE_TYPE_KEYS as readonly string[]).includes(value);
}
