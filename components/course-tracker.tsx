'use client';

import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Plus, Settings, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  type UserCourseDto,
  type UpdateUserCoursePayload
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
  minor: 'วิชาโท',
  free: 'วิชาเสรี',
  ge: 'วิชา GE'
};

const planRequirements = {
  regular: { name: 'แผนปกติ', majorElective: 15 },
  coop: { name: 'แผนสหกิจศึกษา', majorElective: 12 },
  honors: { name: 'แผนก้าวหน้า', majorElective: 27 }
} as const;

type PlanKey = keyof typeof planRequirements;

type PendingMap = Record<string, boolean>;

type CourseTrackerProps = {
  userEmail?: string;
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
  position: dto.position ?? 0
});

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

export default function CourseTracker({ userEmail }: CourseTrackerProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | ''>('');
  const [showPlanModal, setShowPlanModal] = useState(true);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingMap, setPendingMap] = useState<PendingMap>({});
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
      setCourses(sortCourses(data.map(mapDtoToCourse)));
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

  const persistCourseUpdates = useCallback(
    async (courseId: string, payload: UpdateUserCoursePayload, snapshot: Course) => {
      markPending(courseId, true);
      try {
        const updated = await updateUserCourseApi(courseId, payload);
        setCourses(prev => prev.map(course => (course.id === courseId ? mapDtoToCourse(updated) : course)));
        setError(null);
      } catch (err) {
        setCourses(prev => prev.map(course => (course.id === courseId ? snapshot : course)));
        handleApiError(err);
      } finally {
        markPending(courseId, false);
      }
    },
    [handleApiError, markPending]
  );

  const handleAddCourse = async (year: number, semester: number) => {
    setError(null);
    setIsCreating(true);
    try {
      const created = await createUserCourseApi({ year, semester, credits: 3 });
      setCourses(prev => sortCourses([...prev, mapDtoToCourse(created)]));
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const snapshot = courses.map(course => ({ ...course }));
    setCourses(prev => prev.filter(course => course.id !== courseId));
    markPending(courseId, true);
    try {
      await deleteUserCourseApi(courseId);
      setError(null);
    } catch (err) {
      setCourses(snapshot);
      handleApiError(err);
    } finally {
      markPending(courseId, false);
    }
  };

  const handleToggleCompletion = async (courseId: string) => {
    const course = courses.find(item => item.id === courseId);
    if (!course) return;
    const snapshot = { ...course };
    const updatedCompleted = !course.completed;
    setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, completed: updatedCompleted } : item)));
    await persistCourseUpdates(courseId, { completed: updatedCompleted }, snapshot);
  };

  const handleCourseTypeChange = async (courseId: string, type: CourseTypeKey | '') => {
    const course = courses.find(item => item.id === courseId);
    if (!course) return;
    const snapshot = { ...course };
    const normalized = type || '';
    if (course.courseType === normalized) {
      return;
    }
    setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, courseType: normalized } : item)));
    await persistCourseUpdates(courseId, { courseType: normalized || null }, snapshot);
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

  const handleCourseFieldBlur = async (
    courseId: string,
    field: 'code' | 'nameEN' | 'nameTH' | 'credits'
  ) => {
    const course = courses.find(item => item.id === courseId);
    if (!course) return;

    const snapshot = { ...course };
    let payload: UpdateUserCoursePayload | null = null;

    switch (field) {
      case 'code': {
        const sanitized = course.code.trim();
        if (sanitized === snapshot.code) {
          return;
        }
        setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, code: sanitized } : item)));
        payload = { course: { code: sanitized } };
        break;
      }
      case 'nameEN': {
        const sanitized = course.nameEN.trim();
        if (sanitized === snapshot.nameEN) {
          return;
        }
        setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, nameEN: sanitized } : item)));
        payload = { course: { nameEN: sanitized } };
        break;
      }
      case 'nameTH': {
        const sanitized = course.nameTH.trim();
        if (sanitized === snapshot.nameTH) {
          return;
        }
        setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, nameTH: sanitized } : item)));
        payload = { course: { nameTH: sanitized } };
        break;
      }
      case 'credits': {
        const sanitized = Number.isFinite(course.credits) ? Math.max(0, course.credits) : snapshot.credits;
        if (sanitized === snapshot.credits) {
          return;
        }
        setCourses(prev => prev.map(item => (item.id === courseId ? { ...item, credits: sanitized } : item)));
        payload = { credits: sanitized, course: { credits: sanitized } };
        break;
      }
      default:
        break;
    }

    if (!payload) {
      return;
    }

    await persistCourseUpdates(courseId, payload, snapshot);
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
    <div className="dark min-h-screen bg-background py-10 text-foreground">
      <header className="mx-auto mb-6 flex w-full max-w-7xl items-center justify-between px-4">
        <div className="text-sm text-muted-foreground">
          ลงชื่อเข้าใช้ด้วย{' '}
          <span className="font-semibold text-foreground">{userEmail ?? 'ไม่ทราบผู้ใช้'}</span>
        </div>
        <div className="rounded-full border border-border/60 bg-card px-4 py-2 text-xs text-muted-foreground">
          ระบบจัดการแผนการเรียน
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4">
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
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
                  disabled={isCreating}
                >
                  <Plus className="mr-2 h-4 w-4" /> เพิ่มวิชาใหม่
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadCourses()} disabled={isLoading}>
                รีเฟรชข้อมูล
              </Button>
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
                          disabled={isCreating}
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
                                const selectValue = course.courseType || 'none';

                                return (
                                  <TableRow
                                    key={courseKey}
                                    className={cn(course.completed && 'bg-muted/40')}
                                  >
                                    <TableCell className="text-center">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={course.completed}
                                          disabled={isPending}
                                          onCheckedChange={() => void handleToggleCompletion(courseKey)}
                                          aria-label={`ทำเครื่องหมายเรียนแล้ว ${course.code || course.nameEN || 'course'}`}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={course.code}
                                        disabled={isPending}
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
                                        disabled={isPending}
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
                                        disabled={isPending}
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
                                        disabled={isPending}
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
                                        disabled={isPending}
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
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-destructive hover:text-destructive"
                                        disabled={isPending}
                                        onClick={() => {
                                          if (window.confirm('ต้องการลบวิชานี้?')) {
                                            void handleDeleteCourse(courseKey);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">ลบวิชา</span>
                                      </Button>
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
      </div>
    </div>
  );
}
