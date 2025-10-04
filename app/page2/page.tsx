'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
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

type Course = {
  code: string;
  nameEN: string;
  nameTH: string;
  credits: number;
  year: number;
  semester: number;
  id?: number;
};

type CourseProgress = {
  completed: boolean;
};

type CourseTypeKey = 'required' | 'core' | 'major' | 'majorElective' | 'minor' | 'free' | 'ge';

const courseTypeKeys: readonly CourseTypeKey[] = [
  'required',
  'core',
  'major',
  'majorElective',
  'minor',
  'free',
  'ge'
] as const;

const isCourseTypeKey = (value: string): value is CourseTypeKey =>
  (courseTypeKeys as readonly string[]).includes(value);

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

const initialCoursesData: Course[] = [
  // Year 1 Semester 1
  { code: '001101', nameEN: 'Fundamental English 1', nameTH: 'ภาษาอังกฤษพื้นฐาน 1', credits: 3, year: 1, semester: 1 },
  { code: '140104', nameEN: 'Citizenship', nameTH: 'การเป็นพลเมือง', credits: 3, year: 1, semester: 1 },
  { code: '203103', nameEN: 'General Chemistry 1', nameTH: 'เคมีทั่วไป 1', credits: 3, year: 1, semester: 1 },
  { code: '204111', nameEN: 'Fundamentals of Programming', nameTH: 'การเขียนโปรแกรมเบื้องต้น', credits: 3, year: 1, semester: 1 },
  { code: '206111', nameEN: 'Calculus 1', nameTH: 'แคลคูลัส 1', credits: 3, year: 1, semester: 1 },
  { code: '206183', nameEN: 'Discrete Structure', nameTH: 'โครงสร้างเชิงวิจักษ์', credits: 3, year: 1, semester: 1 },
  
  // Year 1 Semester 2
  { code: '001102', nameEN: 'Fundamental English 2', nameTH: 'ภาษาอังกฤษพื้นฐาน 2', credits: 3, year: 1, semester: 2 },
  { code: '202101', nameEN: 'Basic Biology 1', nameTH: 'ชีววิทยาพื้นฐาน 1', credits: 3, year: 1, semester: 2 },
  { code: '204100', nameEN: 'Information Technology and Modern Life', nameTH: 'เทคโนโลยีสารสนเทศและชีวิตสมัยใหม่', credits: 3, year: 1, semester: 2 },
  { code: '204114', nameEN: 'Introduction to Object-oriented Programming', nameTH: 'การเขียนโปรแกรมเชิงวัตถุเบื้องต้น', credits: 3, year: 1, semester: 2 },
  { code: '206112', nameEN: 'Calculus 2', nameTH: 'แคลคูลัส 2', credits: 3, year: 1, semester: 2 },
  { code: '207187', nameEN: 'Physics 1', nameTH: 'ฟิสิกส์ 1', credits: 3, year: 1, semester: 2 },
  
  // Year 2 Semester 1
  { code: '001201', nameEN: 'Critical Reading and Effective Writing', nameTH: 'การอ่านอย่างมีวิจารณญาณและการเขียนอย่างมีประสิทธิผล', credits: 3, year: 2, semester: 1 },
  { code: '201190', nameEN: 'Critical Thinking, Problem Solving and Science Communication', nameTH: 'การคิดอย่างมีวิจารณญาณ การแก้ปัญหา และการสื่อสารทางวิทยาศาสตร์', credits: 3, year: 2, semester: 1 },
  { code: '204203', nameEN: 'Computer Science Technology', nameTH: 'เทคโนโลยีด้านวิทยาการคอมพิวเตอร์', credits: 3, year: 2, semester: 1 },
  { code: '204231', nameEN: 'Computer Organization and Architecture', nameTH: 'การจัดระบบและสถาปัตยกรรมคอมพิวเตอร์', credits: 3, year: 2, semester: 1 },
  { code: '204252', nameEN: 'Data Structures and Analysis', nameTH: 'โครงสร้างข้อมูลและการวิเคราะห์', credits: 3, year: 2, semester: 1 },
  { code: '208269', nameEN: 'Statistics for Computer Science', nameTH: 'สถิติสำหรับวิทยาการคอมพิวเตอร์', credits: 3, year: 2, semester: 1 },
  
  // Year 2 Semester 2
  { code: '001225', nameEN: 'English in Science and Technology Context', nameTH: 'ภาษาอังกฤษในบริบทวิทยาศาสตร์และเทคโนโลยี', credits: 3, year: 2, semester: 2 },
  { code: '201111', nameEN: 'The World of Science', nameTH: 'โลกแห่งวิทยาศาสตร์', credits: 3, year: 2, semester: 2 },
  { code: '204217', nameEN: 'Modern Application Development', nameTH: 'การพัฒนาแอปพลิเคชันสมัยใหม่', credits: 3, year: 2, semester: 2 },
  { code: '204232', nameEN: 'Computer Networks and Protocols', nameTH: 'เครือข่ายคอมพิวเตอร์และโปรโตคอล', credits: 3, year: 2, semester: 2 },
  { code: '204271', nameEN: 'Introduction to Artificial Intelligence', nameTH: 'ปัญญาประดิษฐ์เบื้องต้น', credits: 3, year: 2, semester: 2 },
  
  // Year 3 Semester 1
  { code: '204321', nameEN: 'Database Systems', nameTH: 'ระบบฐานข้อมูล', credits: 3, year: 3, semester: 1 },
  { code: '204341', nameEN: 'Operating Systems', nameTH: 'ระบบปฏิบัติการ', credits: 3, year: 3, semester: 1 },
  { code: '204361', nameEN: 'Software Engineering', nameTH: 'วิศวกรรมซอฟต์แวร์', credits: 3, year: 3, semester: 1 },
  { code: '204451', nameEN: 'Algorithm Design and Analysis', nameTH: 'การออกแบบและการวิเคราะห์อัลกอริทึม', credits: 3, year: 3, semester: 1 },
  
  // Year 3 Semester 2
  { code: '204306', nameEN: 'Ethics for Computer Professionals', nameTH: 'จริยธรรมสำหรับผู้ประกอบวิชาชีพคอมพิวเตอร์', credits: 1, year: 3, semester: 2 },
  { code: '204315', nameEN: 'Organization of Programming Languages', nameTH: 'การจัดระเบียนองภาษาโปรแกรม', credits: 3, year: 3, semester: 2 },
  { code: '204490', nameEN: 'Research in Computer Science', nameTH: 'การวิจัยทางวิทยาการคอมพิวเตอร์', credits: 3, year: 3, semester: 2 },
  
  // Year 4 Semester 1
  { code: '204390', nameEN: 'Computer Job Training', nameTH: 'การฝึกงานคอมพิวเตอร์', credits: 1, year: 4, semester: 1 },
  { code: '204495', nameEN: 'Cooperative Education', nameTH: 'สหกิจศึกษา', credits: 6, year: 4, semester: 1 },
  
  // Year 4 Semester 2
  { code: '204497', nameEN: 'Seminar in Computer Science', nameTH: 'สัมมนาทางวิทยาการคอมพิวเตอร์', credits: 1, year: 4, semester: 2 },
];

const planRequirements = {
  regular: { name: 'แผนปกติ', majorElective: 15 },
  coop: { name: 'แผนสหกิจศึกษา', majorElective: 12 },
  honors: { name: 'แผนก้าวหน้า', majorElective: 27 }
} as const;

type PlanKey = keyof typeof planRequirements;

const isBrowser = typeof window !== 'undefined';

const isPlanKey = (value: string): value is PlanKey =>
  Object.prototype.hasOwnProperty.call(planRequirements, value);

const readStoredPlan = (): PlanKey | '' => {
  if (!isBrowser) return '';
  const stored = window.localStorage.getItem('selectedPlan');
  return stored && isPlanKey(stored) ? stored : '';
};

const readStoredCourses = (): Course[] => {
  if (!isBrowser) return initialCoursesData;
  const saved = window.localStorage.getItem('courses');

  if (!saved) return initialCoursesData;

  try {
    const parsed = JSON.parse(saved) as Course[];
    return Array.isArray(parsed) ? parsed : initialCoursesData;
  } catch (error) {
    console.error('Failed to parse courses from localStorage', error);
    return initialCoursesData;
  }
};

const readStoredProgress = (): Record<string, CourseProgress> => {
  if (!isBrowser) return {};
  const saved = window.localStorage.getItem('progress');

  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved) as Record<string, CourseProgress>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Failed to parse progress from localStorage', error);
    return {};
  }
};

const readStoredCourseTypes = (): Record<string, CourseTypeKey> => {
  if (!isBrowser) return {};
  const saved = window.localStorage.getItem('courseTypes');

  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved) as Record<string, CourseTypeKey>;
    if (!parsed || typeof parsed !== 'object') return {};

    return Object.entries(parsed).reduce<Record<string, CourseTypeKey>>((acc, [key, value]) => {
      if (typeof value === 'string' && isCourseTypeKey(value)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error('Failed to parse course types from localStorage', error);
    return {};
  }
};

export default function CourseTracker() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | ''>('');
  const [showPlanModal, setShowPlanModal] = useState<boolean>(true);
  const [courses, setCourses] = useState<Course[]>(initialCoursesData);
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({});
  const [courseTypes, setCourseTypes] = useState<Record<string, CourseTypeKey>>({});
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  useEffect(() => {
    if (!isBrowser) return;

    const storedPlan = readStoredPlan();
    const storedCourses = readStoredCourses();
    const storedProgress = readStoredProgress();
    const storedCourseTypes = readStoredCourseTypes();

    setSelectedPlan(storedPlan);
    setShowPlanModal(!storedPlan);
    setCourses(storedCourses);
    setProgress(storedProgress);
    setCourseTypes(storedCourseTypes);
    setHasLoadedFromStorage(true);
  }, []);

  useEffect(() => {
    if (!isBrowser || !hasLoadedFromStorage) return;
    window.localStorage.setItem('selectedPlan', selectedPlan);
  }, [selectedPlan, hasLoadedFromStorage]);

  useEffect(() => {
    if (!isBrowser || !hasLoadedFromStorage) return;
    window.localStorage.setItem('courses', JSON.stringify(courses));
  }, [courses, hasLoadedFromStorage]);

  useEffect(() => {
    if (!isBrowser || !hasLoadedFromStorage) return;
    window.localStorage.setItem('progress', JSON.stringify(progress));
  }, [progress, hasLoadedFromStorage]);

  useEffect(() => {
    if (!isBrowser || !hasLoadedFromStorage) return;
    window.localStorage.setItem('courseTypes', JSON.stringify(courseTypes));
  }, [courseTypes, hasLoadedFromStorage]);

  const getCourseKey = (course: Course): string => String(course.id ?? course.code);

  const addCourse = (year: number, semester: number) => {
    const newCourse: Course = {
      code: '',
      nameEN: '',
      nameTH: '',
      credits: 3,
      year,
      semester,
      id: Date.now()
    };

    setCourses(prev => [...prev, newCourse]);
  };

  const deleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(course => getCourseKey(course) !== courseId));
    setProgress(prev => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
    setCourseTypes(prev => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
  };

  type EditableCourseField = 'code' | 'nameEN' | 'nameTH' | 'credits';

  const updateCourse = (courseId: string, field: EditableCourseField, value: string) => {
    setCourses(prev =>
      prev.map(course => {
        if (getCourseKey(course) !== courseId) {
          return course;
        }

        if (field === 'credits') {
          const numericCredits = Number(value);
          return Number.isFinite(numericCredits)
            ? { ...course, credits: numericCredits }
            : course;
        }

        return { ...course, [field]: value } as Course;
      })
    );
  };

  const toggleCompletion = (courseId: string) => {
    setProgress(prev => ({
      ...prev,
      [courseId]: { completed: !prev[courseId]?.completed }
    }));
  };

  const updateCourseType = (courseId: string, type: CourseTypeKey | '') => {
    setCourseTypes(prev => {
      const next = { ...prev };
      if (!type) {
        delete next[courseId];
        return next;
      }

      next[courseId] = type;
      return next;
    });
  };

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
      const courseKey = getCourseKey(course);
      if (!progress[courseKey]?.completed) {
        return;
      }

      const courseType = courseTypes[courseKey];
      if (!courseType) {
        return;
      }

      const numericCredits = Number(course.credits);
      if (!Number.isFinite(numericCredits)) {
        return;
      }

      summary.total += numericCredits;
      summary[courseType] += numericCredits;
    });

    return summary;
  }, [courses, courseTypes, progress]);

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

  const totalRequired = useMemo(
    () => Object.values(requirements).reduce((acc, value) => acc + value, 0),
    [requirements]
  );

  const totalPercent =
    totalRequired > 0 ? Math.min((credits.total / totalRequired) * 100, 100) : 0;

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

  const planEntries = useMemo(
    () => Object.entries(planRequirements) as Array<[
      PlanKey,
      (typeof planRequirements)[PlanKey]
    ]>,
    []
  );

  const groupedByYear = useMemo(() => {
    const byYear = new Map<number, Map<number, Course[]>>();

    courses.forEach(course => {
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

  const completedCoursesByType = useMemo(
    () =>
      (Object.keys(typeLabels) as CourseTypeKey[]).reduce<Record<CourseTypeKey, Course[]>>(
        (acc, type) => {
          acc[type] = courses.filter(course => {
            const courseKey = getCourseKey(course);
            return progress[courseKey]?.completed && courseTypes[courseKey] === type;
          });
          return acc;
        },
        {
          required: [],
          core: [],
          major: [],
          majorElective: [],
          minor: [],
          free: [],
          ge: []
        }
      ),
    [courses, progress, courseTypes]
  );

  const shouldShowPlanModal = hasLoadedFromStorage ? showPlanModal : false;

  const handlePlanModalChange = (open: boolean) => {
    if (!open && !selectedPlan) {
      return;
    }
    setShowPlanModal(open);
  };

  const planName = selectedPlan ? planRequirements[selectedPlan].name : 'ยังไม่ได้เลือก';

  return (
    <div className="dark min-h-screen bg-background py-10 text-foreground">
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
                  <span className="text-sm text-muted-foreground">
                    วิชาเอกเลือก {plan.majorElective} หน่วยกิต
                  </span>
                </span>
                {selectedPlan === key && <Check className="h-5 w-5" />}
              </Button>
            ))}
          </div>
          <DialogFooter className="sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              คุณสามารถเปลี่ยนแผนการศึกษาได้ทุกเมื่อจากเมนูด้านบน
            </p>
            <Button variant="outline" onClick={() => setShowPlanModal(false)} disabled={!selectedPlan}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">
              ระบบติดตามหน่วยกิตการศึกษา
            </h1>
            <p className="text-muted-foreground">
              บริหารจัดการแผนการเรียน พร้อมคำนวณหน่วยกิตแยกตามประเภทวิชา
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Badge variant="secondary" className="justify-center px-3 py-1 text-sm">
              แผนที่เลือก: {planName}
            </Badge>
            <Button variant="outline" className="gap-2" onClick={() => setShowPlanModal(true)}>
              <Settings className="h-4 w-4" />
              เปลี่ยนแผนการศึกษา
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>หน่วยกิตรวม</CardTitle>
              <CardDescription>
                {totalRequired > 0
                  ? `เมื่อรวมทุกประเภทวิชาต้องการ ${totalRequired} หน่วยกิต`
                  : 'กรุณาเลือกแผนการศึกษาก่อน'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-semibold">
                {credits.total} / {totalRequired}
              </div>
              <Progress value={totalPercent} />
              <p className="text-sm text-muted-foreground">
                รวมทั้งหมด {credits.total} หน่วยกิตที่เรียนจบแล้ว
              </p>
            </CardContent>
          </Card>

          {summaryCards.map(({ type, label, required, earned, percent }) => (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{label}</CardTitle>
                  <Badge variant="outline" className={cn('px-2 py-0.5', typeColors[type])}>
                    {type.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription>
                  {required > 0 ? `ต้องการ ${required} หน่วยกิต` : 'รอเลือกแผนการศึกษา'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-semibold">
                  {earned} / {required}
                </div>
                <Progress value={percent} />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="flex flex-col gap-6">
          {groupedByYear.map(({ year, semesters }) => (
            <Card key={year}>
              <CardHeader>
                <CardTitle className="text-2xl">ปีการศึกษา {year}</CardTitle>
                <CardDescription>
                  จัดการรายวิชาในปีที่ {year} แยกตามภาคการศึกษา
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {semesters.map(({ semester, courses: semesterCourses }) => {
                  const courseCount = semesterCourses.length;
                  const completedCount = semesterCourses.filter(course => {
                    const courseKey = getCourseKey(course);
                    return progress[courseKey]?.completed;
                  }).length;

                  return (
                    <div key={`${year}-${semester}`} className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
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
                          onClick={() => addCourse(year, semester)}
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
                                const isCompleted = Boolean(progress[courseKey]?.completed);
                                const courseType = courseTypes[courseKey];
                                const selectValue = courseType ?? 'none';

                                return (
                                  <TableRow
                                    key={courseKey}
                                    className={cn(isCompleted && 'bg-muted/40')}
                                  >
                                    <TableCell className="text-center">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={isCompleted}
                                          onCheckedChange={() => toggleCompletion(courseKey)}
                                          aria-label={`ทำเครื่องหมายเรียนแล้ว ${course.code || course.nameEN || 'course'}`}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={course.code}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                          updateCourse(courseKey, 'code', event.target.value)
                                        }
                                        placeholder="รหัสวิชา"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={course.nameEN}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                          updateCourse(courseKey, 'nameEN', event.target.value)
                                        }
                                        placeholder="ชื่อวิชา (EN)"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={course.nameTH}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                          updateCourse(courseKey, 'nameTH', event.target.value)
                                        }
                                        placeholder="ชื่อวิชา (TH)"
                                      />
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Input
                                        type="number"
                                        value={course.credits}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                          updateCourse(courseKey, 'credits', event.target.value)
                                        }
                                        className="text-center"
                                        min={1}
                                        max={6}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={selectValue}
                                        onValueChange={value =>
                                          updateCourseType(
                                            courseKey,
                                            value === 'none' ? '' : (value as CourseTypeKey)
                                          )
                                        }
                                      >
                                        <SelectTrigger
                                          className={cn(
                                            'w-full justify-between',
                                            courseType && typeColors[courseType]
                                          )}
                                        >
                                          <SelectValue placeholder="เลือกประเภทวิชา" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">ไม่กำหนด</SelectItem>
                                          <SelectItem value="required">วิชาบังคับ</SelectItem>
                                          <SelectItem value="core">วิชาแกน</SelectItem>
                                          <SelectItem value="major">วิชาเอก</SelectItem>
                                          <SelectItem value="majorElective">วิชาเอกเลือก</SelectItem>
                                          <SelectItem value="minor">วิชาโท</SelectItem>
                                          <SelectItem value="ge">วิชา GE</SelectItem>
                                          <SelectItem value="free">วิชาเสรี</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => {
                                          if (window.confirm('ต้องการลบวิชานี้?')) {
                                            deleteCourse(courseKey);
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

          {groupedByYear.length === 0 && (
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

              {!Object.values(completedCoursesByType).some(list => list.length > 0) && (
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
