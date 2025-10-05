'use client';

import type { ChangeEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Check,
  Clock,
  LogOut,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
  X
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  COURSE_TYPE_KEYS,
  isCourseTypeKey,
  type CourseTypeKey
} from '@/lib/course-types';
import {
  createUserCourseApi,
  deleteUserCourseApi,
  fetchUserCourses,
  updateUserCourseApi,
  createUserCourseMeetingApi,
  updateUserCourseMeetingApi,
  deleteUserCourseMeetingApi,
  type CreateUserCoursePayload,
  type UserCourseDto,
  type UpdateUserCoursePayload,
  type UserCourseMeetingDto
} from '@/lib/user-course-api';

type Course = {
  id: string;
  courseId: string;
  code: string;
  nameEN: string;
  nameTH: string;
  credits: number;
  year: number;
  semester: number;
  courseType: CourseTypeKey | '';
  completed: boolean;
  position: number;
  scheduleDay: string | null;
  scheduleStartTime: string | null;
  scheduleEndTime: string | null;
  scheduleRoom: string | null;
  meetings: Array<{
    id: string;
    day: string | null;
    startTime: string | null;
    endTime: string | null;
    room: string | null;
  }>;
  isDraft?: boolean;
};

const typeColors: Record<CourseTypeKey, string> = {
  required:
    'border-indigo-100 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-100',
  core:
    'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-100',
  major:
    'border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/20 dark:text-orange-100',
  majorElective:
    'border-red-100 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-100',
  majorPlan:
    'border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-100',
  minor:
    'border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-500/20 dark:text-purple-100',
  free:
    'border-green-100 bg-green-50 text-green-700 dark:border-green-500/40 dark:bg-green-500/20 dark:text-green-100',
  ge:
    'border-yellow-100 bg-yellow-50 text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/20 dark:text-yellow-100'
};

const typeLabels: Record<CourseTypeKey, string> = {
  required: 'วิชาบังคับ',
  core: 'วิชาแกน',
  major: 'วิชาเอก',
  majorElective: 'วิชาเอกเลือก',
  majorPlan: 'เอกประจำแผน',
  minor: 'วิชาโท',
  free: 'วิชาเสรี',
  ge: 'วิชา GE'
};

const planRequirements = {
  regular: { name: 'แผนปกติ', majorElective: 15, majorPlan: 3 },
  coop: { name: 'แผนสหกิจศึกษา', majorElective: 12, majorPlan: 7 },
  honors: { name: 'แผนก้าวหน้า', majorElective: 27, majorPlan: 3 }
} as const;

type PlanKey = keyof typeof planRequirements;

type PendingMap = Record<string, boolean>;

type CourseTrackerProps = {
  userEmail?: string;
};

type ScheduleFieldKey = 'scheduleDay' | 'scheduleStartTime' | 'scheduleEndTime' | 'scheduleRoom';
type ScheduleUpdate = Partial<Record<ScheduleFieldKey, string | null>>;

const SCHEDULE_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const SCHEDULE_START_HOUR = 7;
const SCHEDULE_END_HOUR = 19;
const TOTAL_SCHEDULE_HOURS = SCHEDULE_END_HOUR - SCHEDULE_START_HOUR;
const TOTAL_SCHEDULE_MINUTES = TOTAL_SCHEDULE_HOURS * 60;
const SCHEDULE_HOURS = Array.from({ length: TOTAL_SCHEDULE_HOURS + 1 }, (_, index) => index + SCHEDULE_START_HOUR);
const DAY_COLUMN_WIDTH_PX = 96; // tailwind w-24
const ROW_HEIGHT_PX = 70; // tailwind h-[70px]
const MIN_BLOCK_DURATION_HOURS = 0.5;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type CourseSchedule = {
  scheduleDay: string | null;
  scheduleStartTime: string | null;
  scheduleEndTime: string | null;
  scheduleRoom: string | null;
};

const minutesToTime = (minutesFromStart: number): string => {
  const clamped = clamp(minutesFromStart, 0, TOTAL_SCHEDULE_MINUTES);
  const totalMinutes = Math.round(clamped / 15) * 15;
  const hours = SCHEDULE_START_HOUR + Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const timeStringToMinutes = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const [hourPart, minutePart] = value.split(':');
  const hours = Number.parseInt(hourPart, 10);
  const minutes = Number.parseInt(minutePart, 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  const totalMinutes = (hours - SCHEDULE_START_HOUR) * 60 + minutes;
  if (Number.isNaN(totalMinutes)) {
    return null;
  }
  return clamp(totalMinutes, 0, TOTAL_SCHEDULE_MINUTES);
};

const timeToHourOffset = (time: string | null): number => {
  const minutes = timeStringToMinutes(time);
  return minutes === null ? 0 : minutes / 60;
};

const hourOffsetToTime = (offset: number): string => minutesToTime(offset * 60);

const emptySchedule: CourseSchedule = {
  scheduleDay: null,
  scheduleStartTime: null,
  scheduleEndTime: null,
  scheduleRoom: null,
};

const getScheduleFromCourse = (course: Course | undefined): CourseSchedule => {
  if (!course) {
    return emptySchedule;
  }
  return {
    scheduleDay: course.scheduleDay ?? null,
    scheduleStartTime: course.scheduleStartTime ?? null,
    scheduleEndTime: course.scheduleEndTime ?? null,
    scheduleRoom: course.scheduleRoom ?? null,
  };
};

const normalizeSchedule = (input: CourseSchedule): CourseSchedule => {
  const normalizedDayRaw = input.scheduleDay ? input.scheduleDay.trim().toUpperCase() : null;

  let startMinutes = timeStringToMinutes(input.scheduleStartTime);
  let endMinutes = timeStringToMinutes(input.scheduleEndTime);

  if (startMinutes !== null) {
    const maxStart = TOTAL_SCHEDULE_MINUTES - MIN_BLOCK_DURATION_HOURS * 60;
    startMinutes = clamp(startMinutes, 0, Math.max(0, maxStart));
  }

  if (endMinutes !== null) {
    endMinutes = clamp(endMinutes, MIN_BLOCK_DURATION_HOURS * 60, TOTAL_SCHEDULE_MINUTES);
  }

  if (startMinutes === null && endMinutes !== null) {
    startMinutes = clamp(endMinutes - MIN_BLOCK_DURATION_HOURS * 60, 0, TOTAL_SCHEDULE_MINUTES);
  }

  if (startMinutes !== null && endMinutes === null) {
    endMinutes = clamp(startMinutes + MIN_BLOCK_DURATION_HOURS * 60, MIN_BLOCK_DURATION_HOURS * 60, TOTAL_SCHEDULE_MINUTES);
  }

  if (startMinutes !== null && endMinutes !== null) {
    if (endMinutes < startMinutes + MIN_BLOCK_DURATION_HOURS * 60) {
      endMinutes = clamp(startMinutes + MIN_BLOCK_DURATION_HOURS * 60, MIN_BLOCK_DURATION_HOURS * 60, TOTAL_SCHEDULE_MINUTES);
    }
    if (endMinutes > TOTAL_SCHEDULE_MINUTES) {
      endMinutes = TOTAL_SCHEDULE_MINUTES;
      startMinutes = clamp(endMinutes - MIN_BLOCK_DURATION_HOURS * 60, 0, TOTAL_SCHEDULE_MINUTES);
    }
  }

  const normalizedStart = startMinutes !== null ? minutesToTime(startMinutes) : null;
  const normalizedEnd = endMinutes !== null ? minutesToTime(endMinutes) : null;
  const normalizedRoom = input.scheduleRoom && input.scheduleRoom.trim().length > 0 ? input.scheduleRoom.trim() : null;

  const normalizedDay = normalizedDayRaw && SCHEDULE_DAYS.includes(normalizedDayRaw as (typeof SCHEDULE_DAYS)[number])
    ? normalizedDayRaw
    : null;

  return {
    scheduleDay: normalizedDay,
    scheduleStartTime: normalizedStart,
    scheduleEndTime: normalizedEnd,
    scheduleRoom: normalizedRoom,
  };
};

const areSchedulesEqual = (a: CourseSchedule | undefined, b: CourseSchedule | undefined): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.scheduleDay === b.scheduleDay &&
    a.scheduleStartTime === b.scheduleStartTime &&
    a.scheduleEndTime === b.scheduleEndTime &&
    a.scheduleRoom === b.scheduleRoom
  );
};

const getPaletteIndex = (course: Course): number => {
  const key = (course.id || course.courseId || course.code || '').trim();
  if (!key) {
    return 0;
  }
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 997;
  }
  return Math.abs(hash);
};

type ScheduleColorTokens = {
  background: string;
  border: string;
  accent: string;
  shadow: string;
};

const buildScheduleColors = (course: Course): ScheduleColorTokens => {
  const hash = getPaletteIndex(course);
  const hue = hash % 360;
  const saturation = 55 + (hash % 25); // 55-79
  const lightness = 24 + (hash % 12); // 24-35
  const accentLightness = Math.min(lightness + 22, 65);
  const backgroundAlpha = 0.18 + ((hash % 20) / 100); // 0.18-0.37
  const borderLightness = Math.max(lightness - 6, 14);
  const shadowAlpha = 0.45;

  return {
    background: `hsl(${hue} ${saturation}% ${lightness}% / ${backgroundAlpha})`,
    border: `hsl(${hue} ${saturation}% ${borderLightness}% / 0.55)`,
    accent: `hsl(${hue} ${saturation}% ${accentLightness}%)`,
    shadow: `hsl(${hue} ${saturation}% ${accentLightness}% / ${shadowAlpha})`,
  };
};

const isBrowser = typeof window !== 'undefined';

const isPlanKey = (value: string): value is PlanKey =>
  Object.prototype.hasOwnProperty.call(planRequirements, value);

const mapDtoToCourse = (dto: UserCourseDto): Course => ({
  id: dto.id,
  courseId: dto.courseId,
  code: dto.code ?? '',
  nameEN: dto.nameEN ?? '',
  nameTH: dto.nameTH ?? '',
  credits: dto.credits ?? 0,
  year: dto.year ?? 0,
  semester: dto.semester ?? 0,
  courseType: isCourseTypeKey(dto.courseType) ? dto.courseType : '',
  completed: Boolean(dto.completed),
  position: dto.position ?? 0,
  scheduleDay: dto.scheduleDay ? dto.scheduleDay.toUpperCase() : null,
  scheduleStartTime: dto.scheduleStartTime || null,
  scheduleEndTime: dto.scheduleEndTime || null,
  scheduleRoom: dto.scheduleRoom ? dto.scheduleRoom : null,
  meetings: Array.isArray(dto.meetings)
    ? dto.meetings.map((m: UserCourseMeetingDto) => ({
        id: m.id,
        day: m.day ? m.day.toUpperCase() : null,
        startTime: m.startTime || null,
        endTime: m.endTime || null,
        room: m.room || null,
      }))
    : [],
  isDraft: false
});

const cloneCourse = (course: Course): Course => ({
  ...course,
  isDraft: course.isDraft ?? false
});

const cloneCourses = (list: Course[]): Course[] => list.map(item => cloneCourse({ ...item }));

const sanitizeCourse = (course: Course): Course => ({
  ...course,
  code: course.code.trim(),
  nameEN: course.nameEN.trim(),
  nameTH: course.nameTH.trim(),
  credits: Number.isFinite(course.credits) ? Math.max(0, course.credits) : 0,
  scheduleDay: course.scheduleDay ? course.scheduleDay.trim().toUpperCase() : null,
  scheduleStartTime: course.scheduleStartTime ? course.scheduleStartTime.trim() : null,
  scheduleEndTime: course.scheduleEndTime ? course.scheduleEndTime.trim() : null,
  scheduleRoom: course.scheduleRoom ? course.scheduleRoom.trim() : null,
  isDraft: course.isDraft ?? false
});

const buildCreatePayload = (course: Course): CreateUserCoursePayload => {
  const payload: CreateUserCoursePayload = {
    year: course.year,
    semester: course.semester,
    credits: course.credits
  };

  if (course.courseType) {
    payload.courseType = course.courseType;
  }

  if (course.completed) {
    payload.completed = true;
  }

  if (course.code) {
    payload.code = course.code;
  }

  if (course.nameEN) {
    payload.nameEN = course.nameEN;
  }

  if (course.nameTH) {
    payload.nameTH = course.nameTH;
  }

  if (course.scheduleDay) {
    payload.scheduleDay = course.scheduleDay;
  }

  if (course.scheduleStartTime && course.scheduleEndTime) {
    payload.scheduleStartTime = course.scheduleStartTime;
    payload.scheduleEndTime = course.scheduleEndTime;
  }

  if (course.scheduleRoom) {
    payload.scheduleRoom = course.scheduleRoom;
  }

  return payload;
};

const hasCourseChanged = (current: Course, original: Course): boolean => {
  const normalizedCurrent = sanitizeCourse(current);
  const normalizedOriginal = sanitizeCourse(original);

  return (
    normalizedCurrent.code !== normalizedOriginal.code ||
    normalizedCurrent.nameEN !== normalizedOriginal.nameEN ||
    normalizedCurrent.nameTH !== normalizedOriginal.nameTH ||
    normalizedCurrent.credits !== normalizedOriginal.credits ||
    normalizedCurrent.year !== normalizedOriginal.year ||
    normalizedCurrent.semester !== normalizedOriginal.semester ||
    normalizedCurrent.courseType !== normalizedOriginal.courseType ||
    normalizedCurrent.completed !== normalizedOriginal.completed ||
    normalizedCurrent.scheduleDay !== normalizedOriginal.scheduleDay ||
    normalizedCurrent.scheduleStartTime !== normalizedOriginal.scheduleStartTime ||
    normalizedCurrent.scheduleEndTime !== normalizedOriginal.scheduleEndTime ||
    normalizedCurrent.scheduleRoom !== normalizedOriginal.scheduleRoom
  );
};

const sortCourses = (courseList: Course[]) =>
  courseList
    .slice()
    .sort((a, b) =>
      a.year !== b.year
        ? a.year - b.year
        : a.semester !== b.semester
        ? a.semester - b.semester
        : a.position !== b.position
        ? a.position - b.position
        : a.code.localeCompare(b.code)
    );

const buildEmptyCompletedBuckets = () =>
  COURSE_TYPE_KEYS.reduce<Record<CourseTypeKey, Course[]>>((acc, type) => {
    acc[type] = [];
    return acc;
  }, {} as Record<CourseTypeKey, Course[]>);

type InteractionState =
  | {
      type: 'move';
      entryKey: string;
      courseId: string;
      startX: number;
      startY: number;
      cellWidth: number;
      rowHeight: number;
      baseStartOffset: number;
      baseEndOffset: number;
      baseDayIndex: number;
    }
  | {
      type: 'resize';
      entryKey: string;
      courseId: string;
      startX: number;
      cellWidth: number;
      baseEndOffset: number;
    };

type ScheduleBuilderProps = {
  year: number;
  semester: number;
  courses: Course[];
  disableInteractions: boolean;
  isCoursePending: (courseId: string) => boolean;
  onAddDefault: (courseId: string) => void;
  onAddMeetingDefault: (courseId: string) => void;
  onUpdate: (courseId: string, update: ScheduleUpdate) => void;
  onUpdateMeeting: (courseId: string, meetingId: string, update: ScheduleUpdate) => void;
  onClear: (courseId: string) => void;
  onClearMeeting: (courseId: string, meetingId: string) => void;
};

const ScheduleBuilder = ({
  year,
  semester,
  courses,
  disableInteractions,
  isCoursePending,
  onAddDefault,
  onAddMeetingDefault,
  onUpdate,
  onUpdateMeeting,
  onClear,
  onClearMeeting
}: ScheduleBuilderProps) => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [interaction, setInteraction] = useState<InteractionState | null>(null);

  const semesterCourses = useMemo(
    () =>
      courses.filter(course => course.year === year && course.semester === semester),
    [courses, year, semester]
  );

  const buildEntryKey = (courseId: string, kind: 'inline' | 'meeting', meetingId?: string) =>
    kind === 'inline' ? `${courseId}::inline` : `${courseId}::meeting::${meetingId ?? ''}`;

  type ScheduleEntry = {
    key: string;
    course: Course;
    kind: 'inline' | 'meeting';
    meetingId?: string;
    schedule: CourseSchedule;
  };

  const getEntriesForCourse = (course: Course): ScheduleEntry[] => {
    const entries: ScheduleEntry[] = [];
    const inline = getScheduleFromCourse(course);
    if (!areSchedulesEqual(inline, emptySchedule)) {
      entries.push({ key: buildEntryKey(course.id, 'inline'), course, kind: 'inline', schedule: inline });
    }
    course.meetings.forEach(m => {
      const schedule: CourseSchedule = {
        scheduleDay: m.day ?? null,
        scheduleStartTime: m.startTime ?? null,
        scheduleEndTime: m.endTime ?? null,
        scheduleRoom: m.room ?? null,
      };
      if (!areSchedulesEqual(schedule, emptySchedule)) {
        entries.push({
          key: buildEntryKey(course.id, 'meeting', m.id),
          course,
          kind: 'meeting',
          meetingId: m.id,
          schedule,
        });
      }
    });
    return entries;
  };

  const [localSchedules, setLocalSchedules] = useState<Record<string, CourseSchedule>>(() => {
    const initial: Record<string, CourseSchedule> = {};
    semesterCourses.forEach(course => {
      getEntriesForCourse(course).forEach(entry => {
        initial[entry.key] = entry.schedule;
      });
    });
    return initial;
  });

  const localSchedulesRef = useRef<Record<string, CourseSchedule>>(localSchedules);
  useEffect(() => {
    localSchedulesRef.current = localSchedules;
  }, [localSchedules]);

  const courseMap = useMemo(() => new Map(semesterCourses.map(course => [course.id, course])), [semesterCourses]);
  const courseMapRef = useRef(courseMap);
  useEffect(() => {
    courseMapRef.current = courseMap;
  }, [courseMap]);

  const pendingCommitRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setLocalSchedules(prev => {
      let changed = false;
      const next: Record<string, CourseSchedule> = { ...prev };
      const validKeys = new Set<string>();

      semesterCourses.forEach(course => {
        const entries = getEntriesForCourse(course);
        entries.forEach(entry => {
          validKeys.add(entry.key);
          const existing = prev[entry.key];
          if (!existing) {
            next[entry.key] = entry.schedule;
            changed = true;
            return;
          }
          if (!areSchedulesEqual(existing, entry.schedule) && !pendingCommitRef.current.has(entry.key)) {
            next[entry.key] = entry.schedule;
            changed = true;
          }
        });
      });

      Object.keys(next).forEach(key => {
        if (!validKeys.has(key)) {
          delete next[key];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [semesterCourses]);

  const commitSchedule = useCallback(
    (entryKey: string, scheduleOverride?: CourseSchedule) => {
      const [courseId, kind, _m, meetingId] = entryKey.split("::");
      const course = courseMapRef.current.get(courseId);
      if (!course) {
        pendingCommitRef.current.delete(entryKey);
        return;
      }

      const local = scheduleOverride ?? localSchedulesRef.current[entryKey];
      if (!local) {
        pendingCommitRef.current.delete(entryKey);
        return;
      }

      const normalized = normalizeSchedule(local);
      const current: CourseSchedule = kind === 'inline'
        ? getScheduleFromCourse(course)
        : (() => {
            const m = course.meetings.find(x => x.id === (meetingId ?? ''));
            return m
              ? {
                  scheduleDay: m.day ?? null,
                  scheduleStartTime: m.startTime ?? null,
                  scheduleEndTime: m.endTime ?? null,
                  scheduleRoom: m.room ?? null,
                }
              : emptySchedule;
          })();

      const updates: ScheduleUpdate = {};
      if (normalized.scheduleDay !== current.scheduleDay) {
        updates.scheduleDay = normalized.scheduleDay;
      }
      if (normalized.scheduleStartTime !== current.scheduleStartTime) {
        updates.scheduleStartTime = normalized.scheduleStartTime;
      }
      if (normalized.scheduleEndTime !== current.scheduleEndTime) {
        updates.scheduleEndTime = normalized.scheduleEndTime;
      }
      if (normalized.scheduleRoom !== current.scheduleRoom) {
        updates.scheduleRoom = normalized.scheduleRoom;
      }

      if (Object.keys(updates).length > 0) {
        if (kind === 'inline') {
          onUpdate(courseId, updates);
        } else if (meetingId) {
          onUpdateMeeting(courseId, meetingId, updates);
        }
      }

      pendingCommitRef.current.delete(entryKey);
    },
    [onUpdate, onUpdateMeeting]
  );

  const applyScheduleChange = useCallback(
    (entryKey: string, partial: Partial<CourseSchedule>, mode: 'none' | 'deferred' | 'immediate') => {
      const [courseId, kind, _m, meetingId] = entryKey.split("::");
      const course = courseMapRef.current.get(courseId);
      const base: CourseSchedule =
        localSchedulesRef.current[entryKey] ??
        (kind === 'inline'
          ? getScheduleFromCourse(course)
          : (() => {
              const m = course?.meetings.find(x => x.id === (meetingId ?? ''));
              return m
                ? {
                    scheduleDay: m.day ?? null,
                    scheduleStartTime: m.startTime ?? null,
                    scheduleEndTime: m.endTime ?? null,
                    scheduleRoom: m.room ?? null,
                  }
                : emptySchedule;
            })());
      const nextSchedule = normalizeSchedule({ ...base, ...partial });

      setLocalSchedules(prev => {
        const current = prev[entryKey] ?? base;
        if (areSchedulesEqual(current, nextSchedule)) {
          return prev;
        }
        return { ...prev, [entryKey]: nextSchedule };
      });

      if (mode === 'deferred') {
        pendingCommitRef.current.add(entryKey);
      } else if (mode === 'immediate') {
        pendingCommitRef.current.add(entryKey);
        commitSchedule(entryKey, nextSchedule);
      }
    },
    [commitSchedule]
  );

  useEffect(() => {
    const pendingSet = pendingCommitRef.current;
    return () => {
      const pendingIds = Array.from(pendingSet);
      pendingSet.clear();
      pendingIds.forEach(key => {
        commitSchedule(key);
      });
    };
  }, [commitSchedule]);

  const scheduleEntries = useMemo<ScheduleEntry[]>(() => {
    const list: ScheduleEntry[] = [];
    semesterCourses.forEach(course => {
      const inlineKey = buildEntryKey(course.id, 'inline');
      const inline = localSchedules[inlineKey] ?? getScheduleFromCourse(course);
      if (!areSchedulesEqual(inline, emptySchedule)) {
        list.push({ key: inlineKey, course, kind: 'inline', schedule: inline });
      }
      course.meetings.forEach(m => {
        const key = buildEntryKey(course.id, 'meeting', m.id);
        const schedule: CourseSchedule = localSchedules[key] ?? {
          scheduleDay: m.day ?? null,
          scheduleStartTime: m.startTime ?? null,
          scheduleEndTime: m.endTime ?? null,
          scheduleRoom: m.room ?? null,
        };
        if (!areSchedulesEqual(schedule, emptySchedule)) {
          list.push({ key, course, kind: 'meeting', meetingId: m.id, schedule });
        }
      });
    });
    return list;
  }, [semesterCourses, localSchedules]);

  const scheduledEntries = useMemo(() => {
    return scheduleEntries
      .filter(({ schedule }) => schedule.scheduleDay && schedule.scheduleStartTime && schedule.scheduleEndTime)
      .slice()
      .sort((a, b) => {
        const dayA = SCHEDULE_DAYS.indexOf((a.schedule.scheduleDay ?? '').toUpperCase() as (typeof SCHEDULE_DAYS)[number]);
        const dayB = SCHEDULE_DAYS.indexOf((b.schedule.scheduleDay ?? '').toUpperCase() as (typeof SCHEDULE_DAYS)[number]);
        if (dayA !== dayB) {
          return dayA - dayB;
        }
        const startA = timeStringToMinutes(a.schedule.scheduleStartTime) ?? 0;
        const startB = timeStringToMinutes(b.schedule.scheduleStartTime) ?? 0;
        if (startA !== startB) {
          return startA - startB;
        }
        return a.course.code.localeCompare(b.course.code);
      });
  }, [scheduleEntries]);

  const unscheduledCourses = useMemo(
    () =>
      scheduleEntries
        .filter(({ schedule }) => !schedule.scheduleDay || !schedule.scheduleStartTime || !schedule.scheduleEndTime)
        .map(({ course }) => course)
        .slice()
        .sort((a, b) => a.code.localeCompare(b.code)),
    [scheduleEntries]
  );

  const startInteraction = useCallback(
    (entryKey: string, courseId: string, type: InteractionState['type']) =>
      (event: ReactMouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (disableInteractions || isCoursePending(courseId)) {
          return;
        }

        const container = timelineRef.current;
        const containerWidth = container?.getBoundingClientRect().width ?? 0;
        const availableWidth = Math.max(containerWidth - DAY_COLUMN_WIDTH_PX, 520);
        const cellWidth = availableWidth / TOTAL_SCHEDULE_HOURS;
        const firstRow = container?.querySelector('[data-day-row]') as HTMLDivElement | null;
        const rowHeight = firstRow?.getBoundingClientRect().height ?? ROW_HEIGHT_PX;

        if (cellWidth <= 0) {
          return;
        }

        pendingCommitRef.current.add(entryKey);

        if (type === 'move') {
          const [cid, kind, _m, meetingId] = entryKey.split("::");
          const course = courseMapRef.current.get(cid);
          const schedule: CourseSchedule =
            localSchedulesRef.current[entryKey] ??
            (kind === 'inline'
              ? getScheduleFromCourse(course)
              : (() => {
                  const m = course?.meetings.find(x => x.id === (meetingId ?? ''));
                  return m
                    ? {
                        scheduleDay: m.day ?? null,
                        scheduleStartTime: m.startTime ?? null,
                        scheduleEndTime: m.endTime ?? null,
                        scheduleRoom: m.room ?? null,
                      }
                    : emptySchedule;
                })());

          const baseStartOffset = timeToHourOffset(schedule.scheduleStartTime);
          const baseEndOffset = timeToHourOffset(schedule.scheduleEndTime);
          const baseDayIndex = SCHEDULE_DAYS.indexOf(
            (schedule.scheduleDay ?? 'MON') as (typeof SCHEDULE_DAYS)[number]
          );
          setInteraction({
            type: 'move',
            entryKey,
            courseId,
            startX: event.clientX,
            startY: event.clientY,
            cellWidth,
            rowHeight,
            baseStartOffset,
            baseEndOffset,
            baseDayIndex,
          });
        } else {
          const [cid, kind, _m, meetingId] = entryKey.split("::");
          const course = courseMapRef.current.get(cid);
          const schedule: CourseSchedule =
            localSchedulesRef.current[entryKey] ??
            (kind === 'inline'
              ? getScheduleFromCourse(course)
              : (() => {
                  const m = course?.meetings.find(x => x.id === (meetingId ?? ''));
                  return m
                    ? {
                        scheduleDay: m.day ?? null,
                        scheduleStartTime: m.startTime ?? null,
                        scheduleEndTime: m.endTime ?? null,
                        scheduleRoom: m.room ?? null,
                      }
                    : emptySchedule;
                })());
          const baseEndOffset = timeToHourOffset(schedule.scheduleEndTime);
          setInteraction({
            type: 'resize',
            entryKey,
            courseId,
            startX: event.clientX,
            cellWidth,
            baseEndOffset,
          });
        }
      },
    [disableInteractions, isCoursePending]
  );

  useEffect(() => {
    if (!interaction) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();

      if (disableInteractions) {
        setInteraction(null);
        return;
      }

      const course = courseMapRef.current.get(interaction.courseId);
      if (!course) {
        return;
      }

      const cellWidth = interaction.cellWidth || 1;

      if (interaction.type === 'move') {
        const rowHeight = interaction.rowHeight || ROW_HEIGHT_PX;
        const deltaX = event.clientX - interaction.startX;
        const deltaY = event.clientY - interaction.startY;
        const hoursDelta = deltaX / cellWidth;
        const daysDelta = Math.round(deltaY / rowHeight);

        const duration = Math.max(
          interaction.baseEndOffset - interaction.baseStartOffset,
          MIN_BLOCK_DURATION_HOURS
        );

        const tentativeStart = clamp(
          interaction.baseStartOffset + hoursDelta,
          0,
          TOTAL_SCHEDULE_HOURS - duration
        );
        const quantizedStart = Math.round(tentativeStart * 4) / 4;
        const quantizedEnd = quantizedStart + duration;

        const newDayIndex = clamp(interaction.baseDayIndex + daysDelta, 0, SCHEDULE_DAYS.length - 1);

        if (
          daysDelta !== 0 ||
          Math.abs(hoursDelta) >= 0.01
        ) {
          applyScheduleChange(interaction.entryKey, {
            scheduleDay: SCHEDULE_DAYS[newDayIndex],
            scheduleStartTime: hourOffsetToTime(quantizedStart),
            scheduleEndTime: hourOffsetToTime(quantizedEnd)
          }, 'deferred');
        }
      } else if (interaction.type === 'resize') {
        const deltaX = event.clientX - interaction.startX;
        const hoursDelta = deltaX / cellWidth;
        const tentativeEnd = clamp(
          interaction.baseEndOffset + hoursDelta,
          MIN_BLOCK_DURATION_HOURS,
          TOTAL_SCHEDULE_HOURS
        );
        const quantizedEnd = Math.round(tentativeEnd * 4) / 4;

        if (Math.abs(hoursDelta) >= 0.01) {
          applyScheduleChange(interaction.entryKey, {
            scheduleEndTime: hourOffsetToTime(quantizedEnd)
          }, 'deferred');
        }
      }
    };

    const handleMouseUp = () => {
      if (interaction?.entryKey) {
        commitSchedule(interaction.entryKey);
      }
      setInteraction(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, disableInteractions, applyScheduleChange, commitSchedule]);

  if (semesterCourses.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4 rounded-lg border border-border/60 bg-muted/40 p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
        <CalendarIcon className="h-5 w-5 text-primary" />
        <span>
          ตารางเรียน · ปี {year} เทอม {semester}
        </span>
      </div>

      {semesterCourses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border/40 bg-background/60 p-3 text-sm">
          <span className="text-muted-foreground">เพิ่มเวลาให้วิชา:</span>
          {semesterCourses.map(course => {
            const pending = isCoursePending(course.id);
            return (
              <Button
                key={course.id}
                variant="outline"
                size="sm"
                disabled={disableInteractions || pending}
                onClick={() => {
                  const hasAny = scheduleEntries.some(e => e.course.id === course.id);
                  if (!hasAny) {
                    const entryKey = buildEntryKey(course.id, 'inline');
                    applyScheduleChange(entryKey, {
                      scheduleDay: 'MON',
                      scheduleStartTime: '09:00',
                      scheduleEndTime: '11:00'
                    }, 'none');
                    onAddDefault(course.id);
                  } else {
                    onAddMeetingDefault(course.id);
                  }
                }}
              >
                เพิ่ม {course.code || 'วิชาใหม่'}
              </Button>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[640px] md:min-w-[900px]">
          <div className="flex border-b border-border/60 bg-muted/60 text-xs font-semibold uppercase text-muted-foreground">
            <div className="w-24 border-r border-border/40 px-3 py-2 text-center">Day / Time</div>
            {SCHEDULE_HOURS.map(hour => (
              <div
                key={hour}
                className="flex-1 border-r border-border/40 px-3 py-2 text-center"
              >
                {hour}:00
              </div>
            ))}
          </div>

          <div ref={timelineRef} className="relative">
            {SCHEDULE_DAYS.map(day => (
              <div
                key={day}
                data-day-row
                className="flex h-[70px] border-b border-border/30 bg-background/40"
              >
                <div className="flex w-24 items-center justify-center border-r border-border/20 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {day}
                </div>
                {SCHEDULE_HOURS.map(hour => (
                  <div
                    key={`${day}-${hour}`}
                    className="flex-1 border-r border-border/20 bg-background/20"
                  />
                ))}
              </div>
            ))}

            {scheduledEntries.map(({ course, schedule, key, kind, meetingId }) => {
              const colors = buildScheduleColors(course);
              const dayIndex = SCHEDULE_DAYS.indexOf(
                (schedule.scheduleDay ?? '').toUpperCase() as (typeof SCHEDULE_DAYS)[number]
              );
              if (dayIndex < 0) {
                return null;
              }

              const startOffset = timeToHourOffset(schedule.scheduleStartTime);
              const endOffset = timeToHourOffset(schedule.scheduleEndTime);
              const duration = Math.max(endOffset - startOffset, MIN_BLOCK_DURATION_HOURS);
              const leftRatio = startOffset / TOTAL_SCHEDULE_HOURS;
              const widthRatio = duration / TOTAL_SCHEDULE_HOURS;
              const topPosition = dayIndex * ROW_HEIGHT_PX;
              const pending = isCoursePending(course.id);
              const blockDisabled = disableInteractions || pending;

              return (
                <div
                  key={key}
                  className="absolute rounded-3xl backdrop-blur-sm transition-all duration-200 ease-out"
                  style={{
                    left: `calc(${DAY_COLUMN_WIDTH_PX}px + (100% - ${DAY_COLUMN_WIDTH_PX}px) * ${leftRatio})`,
                    width: `calc((100% - ${DAY_COLUMN_WIDTH_PX}px) * ${widthRatio} - 6px)`,
                    top: `${topPosition + 4}px`,
                    height: `${ROW_HEIGHT_PX - 8}px`,
                    zIndex: interaction?.entryKey === key ? 30 : 10,
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    boxShadow: blockDisabled ? undefined : `0 18px 36px -18px ${colors.shadow}`,
                    opacity: blockDisabled ? 0.6 : 1,
                  }}
                  onMouseDown={startInteraction(key, course.id, 'move')}
                >
                  <div className="flex h-full items-stretch gap-3 px-4 py-3 text-xs">
                    <div
                      className="my-auto hidden h-10 w-1.5 rounded-full md:block"
                      style={{ backgroundColor: colors.accent }}
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate text-sm font-semibold tracking-wide">
                        {course.code || 'วิชา'}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {course.nameTH || course.nameEN || 'ยังไม่ระบุชื่อ'}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        <Clock className="h-3 w-3" strokeWidth={2} />
                        {schedule.scheduleStartTime} - {schedule.scheduleEndTime}
                      </div>
                      {schedule.scheduleRoom && (
                        <div className="truncate text-[10px] text-muted-foreground">
                          ห้อง {schedule.scheduleRoom}
                        </div>
                      )}
                    </div>
                    <div
                      role="presentation"
                      className="w-2 cursor-ew-resize rounded-full bg-border/70 hover:bg-border"
                      onMouseDown={startInteraction(key, course.id, 'resize')}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-destructive/40 bg-background/70 text-destructive shadow-sm transition hover:bg-destructive hover:text-destructive-foreground"
                      onClick={event => {
                        event.stopPropagation();
                        pendingCommitRef.current.delete(key);
                        applyScheduleChange(key, emptySchedule, 'none');
                        if (kind === 'inline') {
                          onClear(course.id);
                        } else if (meetingId) {
                          onClearMeeting(course.id, meetingId);
                        }
                      }}
                      disabled={blockDisabled}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-border/40 bg-background/80 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>ปรับวัน / เวลา / ห้องเรียน</span>
        </div>

          {scheduledEntries.length === 0 && (
            <div className="rounded-md border border-dashed border-border/30 bg-muted/40 py-4 text-center text-xs text-muted-foreground">
              ยังไม่มีวิชาในตาราง กดปุ่ม “เพิ่ม” เพื่อเริ่มกำหนดเวลาเรียน
            </div>
          )}

        {scheduledEntries.map(({ course, schedule, key, kind, meetingId }) => {
          const pending = isCoursePending(course.id);
          const disabled = disableInteractions || pending;
          return (
            <div
              key={`form-${key}`}
              className="grid gap-2 text-sm md:grid-cols-[minmax(0,1fr)_110px_110px_110px_minmax(0,1fr)_40px]"
            >
              <div className="truncate text-sm font-semibold text-foreground">
                {course.code || 'วิชาใหม่'} {kind === 'meeting' ? '(เพิ่ม)' : ''}
              </div>
              <select
                className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs"
                value={schedule.scheduleDay ?? 'MON'}
                onChange={event =>
                  applyScheduleChange(key, { scheduleDay: event.target.value }, 'immediate')
                }
                disabled={disabled}
              >
                {SCHEDULE_DAYS.map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <input
                type="time"
                step={900}
                className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs"
                value={schedule.scheduleStartTime ?? '09:00'}
                onChange={event =>
                  applyScheduleChange(key, { scheduleStartTime: event.target.value }, 'immediate')
                }
                disabled={disabled}
              />
              <input
                type="time"
                step={900}
                className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs"
                value={schedule.scheduleEndTime ?? '11:00'}
                onChange={event =>
                  applyScheduleChange(key, { scheduleEndTime: event.target.value }, 'immediate')
                }
                disabled={disabled}
              />
              <input
                type="text"
                className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs"
                placeholder="ห้องเรียน"
                value={schedule.scheduleRoom ?? ''}
                onChange={event =>
                  applyScheduleChange(key, { scheduleRoom: event.target.value }, 'deferred')
                }
                onBlur={() => commitSchedule(key)}
                disabled={disabled}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="justify-self-end rounded-full border border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => {
                  pendingCommitRef.current.delete(key);
                  applyScheduleChange(key, emptySchedule, 'none');
                  if (kind === 'inline') {
                    onClear(course.id);
                  } else if (meetingId) {
                    onClearMeeting(course.id, meetingId);
                  }
                }}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function CourseTracker({ userEmail }: CourseTrackerProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | ''>('');
  const [showPlanModal, setShowPlanModal] = useState(true);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [originalCourses, setOriginalCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMap, setPendingMap] = useState<PendingMap>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCourseYear, setNewCourseYear] = useState(1);
  const [newCourseSemester, setNewCourseSemester] = useState(1);

  const markPending = useCallback((id: string, value: boolean) => {
    setPendingMap(prev => {
      const next = { ...prev };
      if (value) {
        next[id] = true;
      } else {
        delete next[id];
      }
      return next;
    });
  }, []);

  const handleApiError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
    setError(message);
  }, []);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUserCourses();
      const mapped = data.map(mapDtoToCourse);
      const sorted = sortCourses(mapped);
      const clonedForView = cloneCourses(sorted);
      const clonedForOrigin = cloneCourses(sorted);
      setCourses(clonedForView);
      setOriginalCourses(clonedForOrigin);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (!isBrowser) return;

    const stored = window.localStorage.getItem('selectedPlan');
    if (stored && isPlanKey(stored)) {
      setSelectedPlan(stored);
      setShowPlanModal(false);
    }
    setPlanLoaded(true);
  }, []);

  useEffect(() => {
    if (!isBrowser || !planLoaded) return;

    if (selectedPlan) {
      window.localStorage.setItem('selectedPlan', selectedPlan);
    } else {
      window.localStorage.removeItem('selectedPlan');
    }
  }, [planLoaded, selectedPlan]);

  const shouldShowPlanModal = planLoaded ? showPlanModal : false;

  const getCourseKey = (course: Course): string => course.id;
  const isCoursePending = (courseId: string) => Boolean(pendingMap[courseId]);

  const unsavedCourseIds = useMemo(() => {
    const originalMap = new Map(originalCourses.map(course => [course.id, sanitizeCourse(course)]));
    const unsaved = new Set<string>();

    courses.forEach(course => {
      if (course.isDraft) {
        unsaved.add(course.id);
        return;
      }

      const original = originalMap.get(course.id);
      if (!original || hasCourseChanged(course, original)) {
        unsaved.add(course.id);
      }
    });

    return unsaved;
  }, [courses, originalCourses]);

  const stagedSummary = useMemo(() => {
    const originalMap = new Map(originalCourses.map(course => [course.id, sanitizeCourse(course)]));
    let newCount = 0;
    let updatedCount = 0;

    courses.forEach(course => {
      if (course.isDraft || !originalMap.has(course.id)) {
        newCount += 1;
        return;
      }

      const original = originalMap.get(course.id)!;
      if (hasCourseChanged(course, original)) {
        updatedCount += 1;
      }
    });

    return { newCount, updatedCount, total: newCount + updatedCount };
  }, [courses, originalCourses]);

  const hasUnsavedChanges = stagedSummary.total > 0;

  const handleAddCourse = (year: number, semester: number) => {
    if (isLoggingOut) {
      return;
    }
    setError(null);
    const tempId = `temp-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
    setCourses(prev => {
      const nextPosition =
        prev.filter(course => course.year === year && course.semester === semester).length + 1;
      const newCourse: Course = {
        id: tempId,
        courseId: '',
        code: '',
        nameEN: '',
        nameTH: '',
        credits: 3,
        year,
        semester,
        courseType: '',
        completed: false,
        position: nextPosition,
        scheduleDay: null,
        scheduleStartTime: null,
        scheduleEndTime: null,
        scheduleRoom: null,
        isDraft: true
      };
      return sortCourses([...prev, newCourse]);
    });
  };

  const handleDeleteCourse = async (courseId: string) => {
    const course = courses.find(item => item.id === courseId);
    if (!course) {
      return;
    }

    if (course.isDraft) {
      setCourses(prev => prev.filter(item => item.id !== courseId));
      return;
    }

    const snapshot = courses.map(item => ({ ...item }));
    setCourses(prev => prev.filter(item => item.id !== courseId));
    markPending(courseId, true);
    try {
      await deleteUserCourseApi(courseId);
      setOriginalCourses(prev => prev.filter(item => item.id !== courseId));
      setError(null);
    } catch (err) {
      setCourses(snapshot);
      handleApiError(err);
    } finally {
      markPending(courseId, false);
    }
  };

  const handleToggleCompletion = (courseId: string) => {
    const course = courses.find(item => item.id === courseId);
    if (!course) return;
    const updatedCompleted = !course.completed;
    setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, completed: updatedCompleted } : item)));
  };

  const handleCourseTypeChange = (courseId: string, type: CourseTypeKey | '') => {
    const course = courses.find(item => item.id === courseId);
    if (!course) return;
    const normalized = type || '';
    if (course.courseType === normalized) {
      return;
    }
    setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, courseType: normalized } : item)));
  };

  const handleCourseFieldChange = (
    courseId: string,
    field: 'code' | 'nameEN' | 'nameTH' | 'credits',
    value: string
  ) => {
    setCourses(prev =>
      prev.map(course => {
        if (course.id !== courseId) {
          return course;
        }

        if (field === 'credits') {
          const numericCredits = Number(value);
          return Number.isFinite(numericCredits) ? { ...course, credits: numericCredits } : course;
        }

        return { ...course, [field]: value } as Course;
      })
    );
  };

  const handleCourseFieldBlur = (
    courseId: string,
    field: 'code' | 'nameEN' | 'nameTH' | 'credits'
  ) => {
    const course = courses.find(item => item.id === courseId);
    if (!course) return;

    switch (field) {
      case 'code': {
        const sanitized = course.code.trim();
        setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, code: sanitized } : item)));
        break;
      }
      case 'nameEN': {
        const sanitized = course.nameEN.trim();
        setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, nameEN: sanitized } : item)));
        break;
      }
      case 'nameTH': {
        const sanitized = course.nameTH.trim();
        setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, nameTH: sanitized } : item)));
        break;
      }
      case 'credits': {
        const sanitized = Number.isFinite(course.credits) ? Math.max(0, course.credits) : 0;
        setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, credits: sanitized } : item)));
        break;
      }
      default:
        break;
    }
  };

  const updateCourseSchedule = useCallback(
    (courseId: string, update: ScheduleUpdate) => {
      if (!update || Object.keys(update).length === 0) {
        return;
      }

      setCourses(prevCourses =>
        prevCourses.map(course => {
          if (course.id !== courseId) {
            return course;
          }

          const next = { ...course };
          (Object.entries(update) as Array<[ScheduleFieldKey, string | null | undefined]>).forEach(([key, value]) => {
            if (value === undefined) {
              return;
            }

            if (value === null) {
              switch (key) {
                case 'scheduleDay':
                  next.scheduleDay = null;
                  break;
                case 'scheduleStartTime':
                  next.scheduleStartTime = null;
                  break;
                case 'scheduleEndTime':
                  next.scheduleEndTime = null;
                  break;
                case 'scheduleRoom':
                  next.scheduleRoom = null;
                  break;
                default:
                  break;
              }
              return;
            }

            const trimmed = value.trim();
            if (!trimmed) {
              switch (key) {
                case 'scheduleDay':
                  next.scheduleDay = null;
                  break;
                case 'scheduleStartTime':
                  next.scheduleStartTime = null;
                  break;
                case 'scheduleEndTime':
                  next.scheduleEndTime = null;
                  break;
                case 'scheduleRoom':
                  next.scheduleRoom = null;
                  break;
                default:
                  break;
              }
              return;
            }

            switch (key) {
              case 'scheduleDay':
                next.scheduleDay = trimmed.toUpperCase();
                break;
              case 'scheduleStartTime':
                next.scheduleStartTime = trimmed;
                break;
              case 'scheduleEndTime':
                next.scheduleEndTime = trimmed;
                break;
              case 'scheduleRoom':
                next.scheduleRoom = trimmed;
                break;
              default:
                break;
            }
          });

          const startMinutes = timeStringToMinutes(next.scheduleStartTime);
          const endMinutes = timeStringToMinutes(next.scheduleEndTime);

          if (startMinutes !== null) {
            const maxStart = TOTAL_SCHEDULE_MINUTES - MIN_BLOCK_DURATION_HOURS * 60;
            const normalizedStart = clamp(startMinutes, 0, Math.max(0, maxStart));
            next.scheduleStartTime = minutesToTime(normalizedStart);
          }

          const currentStartMinutes = timeStringToMinutes(next.scheduleStartTime);
          if (currentStartMinutes !== null) {
            const minimalEnd = currentStartMinutes + MIN_BLOCK_DURATION_HOURS * 60;
            if (endMinutes === null) {
              const fallbackEnd = clamp(minimalEnd, MIN_BLOCK_DURATION_HOURS * 60, TOTAL_SCHEDULE_MINUTES);
              next.scheduleEndTime = minutesToTime(fallbackEnd);
            } else {
              const normalizedEnd = clamp(Math.max(endMinutes, minimalEnd), MIN_BLOCK_DURATION_HOURS * 60, TOTAL_SCHEDULE_MINUTES);
              next.scheduleEndTime = minutesToTime(normalizedEnd);
            }
          } else if (endMinutes !== null) {
            const maxStart = TOTAL_SCHEDULE_MINUTES - MIN_BLOCK_DURATION_HOURS * 60;
            const derivedStart = clamp(endMinutes - MIN_BLOCK_DURATION_HOURS * 60, 0, Math.max(0, maxStart));
            next.scheduleStartTime = minutesToTime(derivedStart);
            const normalizedEnd = clamp(endMinutes, derivedStart + MIN_BLOCK_DURATION_HOURS * 60, TOTAL_SCHEDULE_MINUTES);
            next.scheduleEndTime = minutesToTime(normalizedEnd);
          }

          return next;
        })
      );
    },
    [setCourses]
  );

  const applyDefaultSchedule = useCallback(
    (courseId: string) => {
      updateCourseSchedule(courseId, {
        scheduleDay: 'MON',
        scheduleStartTime: '09:00',
        scheduleEndTime: '11:00',
      });
    },
    [updateCourseSchedule]
  );

  const clearCourseSchedule = useCallback(
    (courseId: string) => {
      updateCourseSchedule(courseId, {
        scheduleDay: null,
        scheduleStartTime: null,
        scheduleEndTime: null,
        scheduleRoom: null,
      });
    },
    [updateCourseSchedule]
  );

  const addDefaultMeeting = useCallback(
    async (courseId: string) => {
      markPending(courseId, true);
      try {
        const meeting = await createUserCourseMeetingApi(courseId, {
          day: 'THU',
          startTime: '09:00',
          endTime: '11:00',
        });
        setCourses(prev =>
          prev.map(c =>
            c.id === courseId
              ? {
                  ...c,
                  meetings: [
                    ...c.meetings,
                    {
                      id: meeting.id,
                      day: meeting.day || null,
                      startTime: meeting.startTime || null,
                      endTime: meeting.endTime || null,
                      room: meeting.room || null,
                    },
                  ],
                }
              : c
          )
        );
      } catch (err) {
        handleApiError(err);
      } finally {
        markPending(courseId, false);
      }
    },
    [handleApiError, markPending]
  );

  const updateMeetingSchedule = useCallback(
    async (courseId: string, meetingId: string, update: ScheduleUpdate) => {
      markPending(courseId, true);
      try {
        const payload: any = {};
        if (update.scheduleDay !== undefined) payload.day = update.scheduleDay;
        if (update.scheduleStartTime !== undefined) payload.startTime = update.scheduleStartTime;
        if (update.scheduleEndTime !== undefined) payload.endTime = update.scheduleEndTime;
        if (update.scheduleRoom !== undefined) payload.room = update.scheduleRoom;

        const updated = await updateUserCourseMeetingApi(courseId, meetingId, payload);
        setCourses(prev =>
          prev.map(c =>
            c.id === courseId
              ? {
                  ...c,
                  meetings: c.meetings.map(m =>
                    m.id === meetingId
                      ? {
                          id: updated.id,
                          day: updated.day || null,
                          startTime: updated.startTime || null,
                          endTime: updated.endTime || null,
                          room: updated.room || null,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } catch (err) {
        handleApiError(err);
        await loadCourses();
      } finally {
        markPending(courseId, false);
      }
    },
    [handleApiError, loadCourses, markPending]
  );

  const clearMeeting = useCallback(
    async (courseId: string, meetingId: string) => {
      markPending(courseId, true);
      try {
        await deleteUserCourseMeetingApi(courseId, meetingId);
        setCourses(prev =>
          prev.map(c => (c.id === courseId ? { ...c, meetings: c.meetings.filter(m => m.id !== meetingId) } : c))
        );
      } catch (err) {
        handleApiError(err);
        await loadCourses();
      } finally {
        markPending(courseId, false);
      }
    },
    [handleApiError, loadCourses, markPending]
  );

  const handleLogout = useCallback(async () => {
    if (isLoggingOut || isSaving) {
      return;
    }

    setIsLoggingOut(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          accept: 'application/json'
        }
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => undefined);
        const message = payload && typeof payload.error === 'string' ? payload.error : 'ไม่สามารถออกจากระบบได้';
        throw new Error(message);
      }

      if (isBrowser) {
        window.localStorage.removeItem('selectedPlan');
      }

      setIsSaveDialogOpen(false);
      setPendingMap({});
      router.replace('/');
      router.refresh();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoggingOut(false);
    }
  }, [handleApiError, isLoggingOut, isSaving, router]);

  const handleDiscardChanges = () => {
    if (isSaving || isLoggingOut) {
      return;
    }
    setError(null);
    setCourses(cloneCourses(originalCourses));
    setPendingMap({});
    setIsSaveDialogOpen(false);
  };

  const handleConfirmSave = async () => {
    if (isSaving || isLoggingOut) {
      return;
    }
    const sanitizedCourses = courses.map(sanitizeCourse);
    setCourses(sanitizedCourses);

    const originalMap = new Map(originalCourses.map(course => [course.id, sanitizeCourse(course)]));
    const draftCourses: Course[] = [];
    const updates: Array<{ course: Course; payload: UpdateUserCoursePayload }> = [];

    sanitizedCourses.forEach(course => {
      if (course.isDraft || !originalMap.has(course.id)) {
        draftCourses.push({ ...course, isDraft: true });
        return;
      }

      const original = originalMap.get(course.id)!;
      const payload: UpdateUserCoursePayload = {};
      const coursePayload: NonNullable<UpdateUserCoursePayload['course']> = {};
      let changed = false;

      if (course.code !== original.code) {
        coursePayload.code = course.code;
        changed = true;
      }

      if (course.nameEN !== original.nameEN) {
        coursePayload.nameEN = course.nameEN;
        changed = true;
      }

      if (course.nameTH !== original.nameTH) {
        coursePayload.nameTH = course.nameTH;
        changed = true;
      }

      if (course.credits !== original.credits) {
        payload.credits = course.credits;
        coursePayload.credits = course.credits;
        changed = true;
      }

      if (course.courseType !== original.courseType) {
        payload.courseType = course.courseType || null;
        changed = true;
      }

      if (course.completed !== original.completed) {
        payload.completed = course.completed;
        changed = true;
      }

      if (course.year !== original.year) {
        payload.year = course.year;
        changed = true;
      }

      if (course.semester !== original.semester) {
        payload.semester = course.semester;
        changed = true;
      }

      if (Object.keys(coursePayload).length > 0) {
        payload.course = coursePayload;
      }

      if ((course.scheduleDay ?? null) !== (original.scheduleDay ?? null)) {
        payload.scheduleDay = course.scheduleDay ?? null;
        changed = true;
      }

      if ((course.scheduleStartTime ?? null) !== (original.scheduleStartTime ?? null)) {
        payload.scheduleStartTime = course.scheduleStartTime ?? null;
        changed = true;
      }

      if ((course.scheduleEndTime ?? null) !== (original.scheduleEndTime ?? null)) {
        payload.scheduleEndTime = course.scheduleEndTime ?? null;
        changed = true;
      }

      if ((course.scheduleRoom ?? null) !== (original.scheduleRoom ?? null)) {
        payload.scheduleRoom = course.scheduleRoom ?? null;
        changed = true;
      }

      if (changed) {
        updates.push({ course, payload });
      }
    });

    if (draftCourses.length === 0 && updates.length === 0) {
      setIsSaveDialogOpen(false);
      return;
    }

    const pendingIds = [
      ...draftCourses.map(course => course.id),
      ...updates.map(item => item.course.id)
    ];
    pendingIds.forEach(id => markPending(id, true));
    setIsSaving(true);

    try {
      const createdCourses: Course[] = [];
      for (const draft of draftCourses) {
        const createdDto = await createUserCourseApi(buildCreatePayload(draft));
        createdCourses.push(mapDtoToCourse(createdDto));
      }

      const updatedCoursesMap = new Map<string, Course>();
      for (const item of updates) {
        const updatedDto = await updateUserCourseApi(item.course.id, item.payload);
        updatedCoursesMap.set(item.course.id, mapDtoToCourse(updatedDto));
      }

      let nextCourses = sanitizedCourses
        .filter(course => !course.isDraft)
        .map(course => {
          const updated = updatedCoursesMap.get(course.id);
          return updated ? cloneCourse(updated) : cloneCourse(course);
        });

      const createdClones = createdCourses.map(cloneCourse);
      nextCourses = sortCourses([...nextCourses, ...createdClones]);
      setCourses(nextCourses);
      setOriginalCourses(cloneCourses(nextCourses));
      setIsSaveDialogOpen(false);
      setError(null);
    } catch (err) {
      await loadCourses();
      handleApiError(err);
      setIsSaveDialogOpen(false);
    } finally {
      pendingIds.forEach(id => markPending(id, false));
      setIsSaving(false);
    }
  };

  const planEntries = useMemo(
    () => Object.entries(planRequirements) as Array<[
      PlanKey,
      (typeof planRequirements)[PlanKey]
    ]>,
    []
  );

  const requirements = useMemo<Record<CourseTypeKey, number>>(
    () => ({
      required: 24,
      core: 24,
      major: 41,
      majorElective: selectedPlan ? planRequirements[selectedPlan].majorElective : 0,
      majorPlan: selectedPlan ? planRequirements[selectedPlan].majorPlan : 0,
      ge: 6,
      free: 6,
      minor: 15
    }),
    [selectedPlan]
  );

  const credits = useMemo(() => {
    const summary: Record<CourseTypeKey | 'total', number> = {
      total: 0,
      required: 0,
      core: 0,
      major: 0,
      majorElective: 0,
      majorPlan: 0,
      minor: 0,
      free: 0,
      ge: 0
    };

    courses.forEach(course => {
      if (!course.completed || !course.courseType) {
        return;
      }

      summary.total += course.credits;
      summary[course.courseType] += course.credits;
    });

    return summary;
  }, [courses]);

  const totalRequired = useMemo(
    () => Object.values(requirements).reduce((acc, value) => acc + value, 0),
    [requirements]
  );

  const totalPercent = totalRequired > 0 ? Math.min((credits.total / totalRequired) * 100, 100) : 0;

  const summaryCards = useMemo(
    () =>
      (Object.entries(typeLabels) as Array<[CourseTypeKey, string]>).map(([type, label]) => {
        const required = requirements[type];
        const earned = credits[type];
        const percent = required > 0 ? Math.min((earned / required) * 100, 100) : 0;

        return { type, label, required, earned, percent };
      }),
    [credits, requirements]
  );

  const groupedByYear = useMemo(() => {
    const ordered = sortCourses(courses);
    const byYear = new Map<number, Map<number, Course[]>>();

    ordered.forEach(course => {
      if (!byYear.has(course.year)) {
        byYear.set(course.year, new Map());
      }
      const semesters = byYear.get(course.year)!;
      if (!semesters.has(course.semester)) {
        semesters.set(course.semester, []);
      }
      semesters.get(course.semester)!.push(course);
    });

    return Array.from(byYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, semesters]) => ({
        year,
        semesters: Array.from(semesters.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([semester, list]) => ({
            semester,
            courses: list.slice()
          }))
      }));
  }, [courses]);

  const completedCoursesByType = useMemo(() => {
    const buckets = buildEmptyCompletedBuckets();
    courses.forEach(course => {
      if (!course.completed || !course.courseType) {
        return;
      }
      buckets[course.courseType].push(course);
    });
    return buckets;
  }, [courses]);

  const handlePlanModalChange = (open: boolean) => {
    if (!open && !selectedPlan) {
      return;
    }
    setShowPlanModal(open);
  };

  const planName = selectedPlan ? planRequirements[selectedPlan].name : 'ยังไม่ได้เลือก';

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/95 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div>
              ลงชื่อเข้าใช้ด้วย{' '}
              <span className="font-semibold text-foreground">{userEmail ?? 'ไม่ทราบผู้ใช้'}</span>
            </div>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <div className="rounded-full border border-border/60 bg-card px-4 py-1 text-xs text-muted-foreground">
              ระบบจัดการแผนการเรียน
            </div>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="border-amber-400 bg-amber-100/60 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                มีการเปลี่ยนแปลง {stagedSummary.total} รายการ
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              disabled={!hasUnsavedChanges || isSaving || isLoggingOut}
              onClick={() => setIsSaveDialogOpen(true)}
            >
              <Check className="h-4 w-4" />
              ยืนยันการเปลี่ยนแปลง
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              disabled={!hasUnsavedChanges || isSaving || isLoggingOut}
              onClick={handleDiscardChanges}
            >
              <RotateCcw className="h-4 w-4" />
              ยกเลิกการเปลี่ยนแปลง
            </Button>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isSaving || isLoggingOut}
              onClick={() => void handleLogout()}
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'กำลังออก...' : 'ออกจากระบบ'}
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading && courses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              กำลังโหลดข้อมูลรายวิชาจากระบบ...
            </CardContent>
          </Card>
        )}

        <Dialog open={shouldShowPlanModal} onOpenChange={handlePlanModalChange}>
          <DialogContent showCloseButton={Boolean(selectedPlan)}>
            <DialogHeader>
              <DialogTitle>เลือกแผนการศึกษา</DialogTitle>
              <DialogDescription>
                กรุณาเลือกแผนการศึกษาของคุณก่อนเริ่มจัดการหน่วยกิต
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              {planEntries.map(([key, plan]) => (
                <Button
                  key={key}
                  variant={selectedPlan === key ? 'default' : 'outline'}
                  className={cn(
                    'w-full justify-between rounded-lg px-4 py-3 text-left',
                    selectedPlan === key && 'ring-2 ring-primary'
                  )}
                  onClick={() => {
                    setSelectedPlan(key);
                    setShowPlanModal(false);
                  }}
                >
                  <span className="flex flex-col">
                    <span className="text-base font-semibold">{plan.name}</span>
                    <span className="text-xs text-muted-foreground">
                      วิชาเลือกเฉพาะสาขาอย่างน้อย {plan.majorElective} หน่วยกิต
                    </span>
                  </span>
                  {selectedPlan === key && <Check className="h-5 w-5" />}
                </Button>
              ))}
            </div>
            <DialogFooter>
              {!selectedPlan && (
                <p className="text-xs text-muted-foreground">
                  จะไม่สามารถปิดหน้าต่างนี้จนกว่าจะเลือกแผนการศึกษา
                </p>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isSaveDialogOpen}
          onOpenChange={open => {
            if (isSaving || isLoggingOut) {
              return;
            }
            setIsSaveDialogOpen(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการบันทึกข้อมูล</DialogTitle>
              <DialogDescription>
                ตรวจสอบจำนวนรายการที่กำลังส่งไปยังเซิร์ฟเวอร์ก่อนยืนยัน
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                <span>เพิ่มรายวิชาใหม่</span>
                <span className="font-semibold text-foreground">{stagedSummary.newCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                <span>ปรับปรุงรายวิชาเดิม</span>
                <span className="font-semibold text-foreground">{stagedSummary.updatedCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                ระบบจะส่งข้อมูลทั้งหมดในครั้งเดียวเพื่อลดการอัปเดตถี่ ๆ และป้องกันข้อผิดพลาดจากการแก้ไขต่อเนื่อง
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsSaveDialogOpen(false)}
                disabled={isSaving || isLoggingOut}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => void handleConfirmSave()}
                disabled={isSaving || isLoggingOut || stagedSummary.total === 0}
              >
                {isSaving ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">สถานะการเก็บหน่วยกิต</CardTitle>
                <CardDescription>อัปเดตอัตโนมัติเมื่อคุณทำวิชาใด ๆ เสร็จ</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings className="h-4 w-4" />
                <Button variant="ghost" size="sm" onClick={() => setShowPlanModal(true)}>
                  เปลี่ยนแผน
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-border/50 bg-card px-4 py-5">
                <div className="mb-3 flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <span>ความคืบหน้ารวม</span>
                  <span>{totalPercent.toFixed(1)}%</span>
                </div>
                <Progress value={totalPercent} className="h-2" />
                <div className="mt-3 text-xs text-muted-foreground">
                  สะสม {credits.total} / {totalRequired} หน่วยกิต
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {summaryCards.map(({ type, label, required, earned, percent }) => (
                  <div
                    key={type}
                    className="rounded-lg border border-border/60 bg-card px-4 py-4 text-sm shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {earned} / {required} หน่วยกิต
                      </span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>แผนการศึกษา</CardTitle>
              <CardDescription>เลือกแผนการจัดหน่วยกิตที่ตรงกับหลักสูตรของคุณ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
                <div className="font-semibold text-primary">แผนปัจจุบัน</div>
                <div className="text-primary/80">{planName}</div>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>- หน่วยกิตวิชาเลือกเฉพาะสาขาขั้นต่ำ {requirements.majorElective} หน่วยกิต</p>
                <p>- สามารถกลับมาเปลี่ยนแผนได้ตลอดเวลา</p>
                <p>- การเลือกแผนไม่มีผลต่อรายวิชาที่จัดไว้แล้ว</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">ตารางรายวิชา</h2>
              <p className="text-sm text-muted-foreground">
                แบ่งตามปีการศึกษาและเทอม สามารถเพิ่ม/แก้ไข/ลบได้ตามต้องการ
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">ปีการศึกษา</span>
                  <Select
                    value={String(newCourseYear)}
                    onValueChange={value => setNewCourseYear(Number(value))}
                  >
                    <SelectTrigger className="w-[120px] justify-between">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(year => (
                        <SelectItem key={year} value={String(year)}>
                          ปี {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">เทอม</span>
                  <Select
                    value={String(newCourseSemester)}
                    onValueChange={value => setNewCourseSemester(Number(value))}
                  >
                    <SelectTrigger className="w-[120px] justify-between">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3].map(semester => (
                        <SelectItem key={semester} value={String(semester)}>
                          เทอม {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => void handleAddCourse(newCourseYear, newCourseSemester)}
                  disabled={isSaving || isLoggingOut}
                >
                  <Plus className="mr-2 h-4 w-4" /> เพิ่มวิชาใหม่
                </Button>
              </div>
            </div>
          </div>

          {groupedByYear.map(({ year, semesters }) => (
            <Card key={year}>
              <CardHeader>
                <CardTitle className="text-base">ปี {year}</CardTitle>
                <CardDescription>จัดระเบียบรายวิชาของปีนี้โดยแยกตามภาคการศึกษา</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {semesters.map(({ semester, courses: semesterCourses }) => {
                  const courseCount = semesterCourses.length;
                  const completedCount = semesterCourses.filter(course => course.completed).length;

                  return (
                    <div key={`${year}-${semester}`} className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="px-3 py-1 text-sm">
                              เทอม {semester}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              วิชา {courseCount} รายวิชา · เรียนจบแล้ว {completedCount} รายวิชา
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="gap-2 self-start sm:self-auto"
                          onClick={() => void handleAddCourse(year, semester)}
                          disabled={isSaving || isLoggingOut}
                        >
                          <Plus className="h-4 w-4" />
                          เพิ่มวิชาในเทอมนี้
                        </Button>
                      </div>

                      {courseCount > 0 ? (
                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-14 text-center">เรียนแล้ว</TableHead>
                                <TableHead className="min-w-[120px]">รหัสวิชา</TableHead>
                                <TableHead className="min-w-[220px]">ชื่อวิชา (EN)</TableHead>
                                <TableHead className="min-w-[220px]">ชื่อวิชา (TH)</TableHead>
                                <TableHead className="w-24 text-center">หน่วยกิต</TableHead>
                                <TableHead className="min-w-[180px]">ประเภทวิชา</TableHead>
                                <TableHead className="w-12 text-center">ลบ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {semesterCourses.map(course => {
                                const courseKey = getCourseKey(course);
                                const isPending = isCoursePending(courseKey);
                                const disableInteractions = isPending || isSaving || isLoggingOut;
                                const isUnsaved = unsavedCourseIds.has(courseKey);
                                const selectValue = course.courseType || 'none';
                                const isDraft = Boolean(course.isDraft);

                                return (
                                  <TableRow
                                    key={courseKey}
                                    className={cn(
                                      'transition-colors',
                                      course.completed && !isUnsaved && 'bg-muted/40',
                                      isUnsaved && 'bg-amber-50/70 dark:bg-amber-500/10'
                                    )}
                                  >
                                    <TableCell className="text-center">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={course.completed}
                                          disabled={disableInteractions}
                                          onCheckedChange={() => void handleToggleCompletion(courseKey)}
                                          aria-label={`ทำเครื่องหมายเรียนแล้ว ${course.code || course.nameEN || 'course'}`}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={course.code}
                                        disabled={disableInteractions}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                          handleCourseFieldChange(courseKey, 'code', event.target.value)
                                        }
                                        onBlur={() => void handleCourseFieldBlur(courseKey, 'code')}
                                        placeholder="รหัสวิชา"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={course.nameEN}
                                        disabled={disableInteractions}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                          handleCourseFieldChange(courseKey, 'nameEN', event.target.value)
                                        }
                                        onBlur={() => void handleCourseFieldBlur(courseKey, 'nameEN')}
                                        placeholder="ชื่อวิชา (EN)"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={course.nameTH}
                                        disabled={disableInteractions}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                          handleCourseFieldChange(courseKey, 'nameTH', event.target.value)
                                        }
                                        onBlur={() => void handleCourseFieldBlur(courseKey, 'nameTH')}
                                        placeholder="ชื่อวิชา (TH)"
                                      />
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Input
                                        type="number"
                                        value={course.credits}
                                        disabled={disableInteractions}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                          handleCourseFieldChange(courseKey, 'credits', event.target.value)
                                        }
                                        onBlur={() => void handleCourseFieldBlur(courseKey, 'credits')}
                                        className="text-center"
                                        min={0}
                                        max={12}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={selectValue}
                                        disabled={disableInteractions}
                                        onValueChange={value =>
                                          void handleCourseTypeChange(
                                            courseKey,
                                            value === 'none' ? '' : (value as CourseTypeKey)
                                          )
                                        }
                                      >
                                        <SelectTrigger
                                          className={cn(
                                            'w-full justify-between',
                                            course.courseType && typeColors[course.courseType]
                                          )}
                                        >
                                          <SelectValue placeholder="เลือกประเภทวิชา" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">ไม่กำหนด</SelectItem>
                                          {COURSE_TYPE_KEYS.map(type => (
                                            <SelectItem key={type} value={type}>
                                              {typeLabels[type]}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex flex-col items-center gap-2">
                                        {isUnsaved && (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-200"
                                          >
                                            ยังไม่บันทึก
                                          </Badge>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          className="text-destructive hover:text-destructive"
                                          disabled={disableInteractions}
                                          onClick={() => {
                                            const confirmed = isDraft
                                              ? true
                                              : window.confirm('ต้องการลบวิชานี้?');
                                            if (confirmed) {
                                              void handleDeleteCourse(courseKey);
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">ลบวิชา</span>
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                          ยังไม่มีวิชาในเทอมนี้ กดปุ่ม &quot;เพิ่มวิชาในเทอมนี้&quot; เพื่อเริ่มต้น
                        </div>
                      )}

                      <ScheduleBuilder
                        year={year}
                        semester={semester}
                        courses={semesterCourses}
                        disableInteractions={isSaving || isLoggingOut}
                        isCoursePending={isCoursePending}
                        onAddDefault={applyDefaultSchedule}
                        onAddMeetingDefault={addDefaultMeeting}
                        onUpdate={updateCourseSchedule}
                        onUpdateMeeting={updateMeetingSchedule}
                        onClear={clearCourseSchedule}
                        onClearMeeting={clearMeeting}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          {groupedByYear.length === 0 && !isLoading && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                ยังไม่มีรายวิชาในระบบ เริ่มต้นด้วยการเพิ่มรายวิชาใหม่จากด้านบน
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>วิชาที่เรียนแล้ว</CardTitle>
              <CardDescription>สรุปวิชาแยกตามประเภทที่ทำเสร็จ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(Object.entries(typeLabels) as Array<[CourseTypeKey, string]>).map(([type, label]) => {
                const completedCourses = completedCoursesByType[type];
                if (completedCourses.length === 0) {
                  return null;
                }

                return (
                  <div key={type} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn('px-3 py-1 text-sm', typeColors[type])}>
                        {label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {credits[type]} / {requirements[type]} หน่วยกิต
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {completedCourses.map(course => {
                        const courseKey = getCourseKey(course);
                        return (
                          <div
                            key={courseKey}
                            className="rounded-lg border border-muted-foreground/30 bg-muted/30 px-4 py-3 text-sm text-foreground"
                          >
                            <div className="font-semibold">{course.code}</div>
                            <div>{course.nameEN}</div>
                            <div className="text-muted-foreground">{course.nameTH}</div>
                            <div className="text-xs text-muted-foreground">
                              {course.credits} หน่วยกิต · ปี {course.year} เทอม {course.semester}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {!Object.values(completedCoursesByType).some(list => list.length > 0) && !isLoading && (
                <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 py-10 text-center text-sm text-muted-foreground">
                  ยังไม่มีวิชาที่เรียนผ่าน กรุณาติ๊กเครื่องหมายเรียนแล้วและเลือกประเภทวิชา
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
