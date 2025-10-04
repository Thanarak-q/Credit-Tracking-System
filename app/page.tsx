'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Check, X, Plus, Trash2, Settings } from 'lucide-react';

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
  required: 'bg-indigo-100 border-indigo-500 text-indigo-800',
  core: 'bg-blue-100 border-blue-500 text-blue-800',
  major: 'bg-orange-100 border-orange-500 text-orange-800',
  majorElective: 'bg-red-100 border-red-500 text-red-800',
  minor: 'bg-purple-100 border-purple-500 text-purple-800',
  free: 'bg-green-100 border-green-500 text-green-800',
  ge: 'bg-yellow-100 border-yellow-500 text-yellow-800'
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

  const groupedCourses = useMemo(() => {
    return courses.reduce<Record<string, Course[]>>((acc, course) => {
      const key = `${course.year}-${course.semester}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(course);
      return acc;
    }, {});
  }, [courses]);

  const shouldShowPlanModal = hasLoadedFromStorage ? showPlanModal : false;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Plan Selection Modal */}
      {shouldShowPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">เลือกแผนการศึกษา</h2>
            <p className="text-gray-600 mb-6">กรุณาเลือกแผนการศึกษาของคุณก่อนใช้งานระบบ</p>
            
            <div className="space-y-3">
              {(Object.entries(planRequirements) as Array<[
                PlanKey,
                (typeof planRequirements)[PlanKey]
              ]>).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedPlan(key);
                    setShowPlanModal(false);
                  }}
                  className="w-full p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <div className="font-semibold text-lg">{plan.name}</div>
                  <div className="text-sm text-gray-600">วิชาเอกเลือก: {plan.majorElective} หน่วยกิต</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ระบบติดตามหน่วยกิตการศึกษา</h1>
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            <Settings size={18} />
            เปลี่ยนแผนการศึกษา
          </button>
        </div>

        {selectedPlan && (
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-6">
            <div className="font-semibold text-blue-800">
              แผนการศึกษาปัจจุบัน: {planRequirements[selectedPlan].name}
            </div>
            <div className="text-sm text-blue-600">
              วิชาเอกเลือก: {planRequirements[selectedPlan].majorElective} หน่วยกิต
            </div>
          </div>
        )}
        
        {/* Credit Dashboard */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-lg">รวมทั้งหมด</span>
              <span className="text-2xl font-bold text-blue-600">
                {credits.total} / {totalRequired} หน่วยกิต
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((credits.total / totalRequired) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(typeLabels).map(([key, label]) => (
              <div key={key} className={`p-3 rounded-lg ${typeColors[key]}`}>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xl font-bold">
                  {credits[key]} / {requirements[key]}
                </div>
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2 mt-2">
                  <div 
                    className="bg-current h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((credits[key] / requirements[key]) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Course Tables */}
        <div className="space-y-8">
          {[1, 2, 3, 4].map(year => (
            <div key={year} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-700">ชั้นปีที่ {year}</h2>
              
              {[1, 2].map(semester => (
                <div key={semester} className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-gray-600">ภาคการศึกษาที่ {semester}</h3>
                    <button
                      onClick={() => addCourse(year, semester)}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                    >
                      <Plus size={18} />
                      เพิ่มวิชา
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-orange-500 text-white">
                        <tr>
                          <th className="p-3 text-center">เรียนแล้ว</th>
                          <th className="p-3 text-left">รหัสวิชา</th>
                          <th className="p-3 text-left">ชื่อวิชา (EN)</th>
                          <th className="p-3 text-left">ชื่อวิชา (TH)</th>
                          <th className="p-3 text-center">หน่วยกิต</th>
                          <th className="p-3 text-center">ประเภทวิชา</th>
                          <th className="p-3 text-center">ลบ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedCourses[`${year}-${semester}`]?.map(course => {
                          const courseKey = getCourseKey(course);
                          const isCompleted = progress[courseKey]?.completed;
                          const courseType = courseTypes[courseKey];
                          
                          return (
                            <tr 
                              key={courseKey} 
                              className={`border-b ${isCompleted ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                            >
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isCompleted || false}
                                  onChange={() => toggleCompletion(courseKey)}
                                  className="w-5 h-5 cursor-pointer accent-green-600"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={course.code}
                                  onChange={(event) => updateCourse(courseKey, 'code', event.target.value)}
                                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="รหัสวิชา"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={course.nameEN}
                                  onChange={(event) => updateCourse(courseKey, 'nameEN', event.target.value)}
                                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="ชื่อภาษาอังกฤษ"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={course.nameTH}
                                  onChange={(event) => updateCourse(courseKey, 'nameTH', event.target.value)}
                                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="ชื่อภาษาไทย"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  value={course.credits}
                                  onChange={(event) => updateCourse(courseKey, 'credits', event.target.value)}
                                  className="w-20 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  min="1"
                                  max="6"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <select
                                  value={courseType || ''}
                                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                                    updateCourseType(courseKey, event.target.value as CourseTypeKey | '')
                                  }
                                  className={`w-full p-2 border-2 rounded font-semibold text-sm focus:ring-2 focus:ring-blue-500 ${
                                    courseType ? typeColors[courseType] : 'bg-white'
                                  }`}
                                >
                                  <option value="">-- เลือกประเภท --</option>
                                  <option value="required">วิชาบังคับ</option>
                                  <option value="core">วิชาแกน</option>
                                  <option value="major">วิชาเอก</option>
                                  <option value="majorElective">วิชาเอกเลือก</option>
                                  <option value="minor">วิชาโท</option>
                                  <option value="ge">วิชา GE</option>
                                  <option value="free">วิชาเสรี</option>
                                </select>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    if (confirm('ต้องการลบวิชานี้?')) {
                                      deleteCourse(courseKey);
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Completed Courses Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">วิชาที่เรียนแล้ว</h2>
          
          {(Object.entries(typeLabels) as Array<[CourseTypeKey, string]>).map(([type, label]) => {
            const completedCourses = courses.filter(course => {
              const courseKey = getCourseKey(course);
              return progress[courseKey]?.completed && courseTypes[courseKey] === type;
            });

            if (completedCourses.length === 0) return null;

            return (
              <div key={type} className="mb-6">
                <h3 className={`text-lg font-semibold mb-3 p-3 rounded-lg ${typeColors[type]}`}>
                  {label} ({credits[type]} / {requirements[type]} หน่วยกิต)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {completedCourses.map(course => {
                    const courseKey = getCourseKey(course);
                    return (
                      <div key={courseKey} className="border-l-4 border-gray-300 pl-3 py-2 hover:bg-gray-50">
                        <div className="font-semibold text-gray-700">{course.code}</div>
                        <div className="text-sm text-gray-600">{course.nameEN}</div>
                        <div className="text-sm text-gray-500">{course.nameTH}</div>
                        <div className="text-xs text-gray-400">{course.credits} หน่วยกิต</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!courses.some(course => {
            const courseKey = getCourseKey(course);
            return progress[courseKey]?.completed && courseTypes[courseKey];
          }) && (
            <div className="text-center text-gray-400 py-8">
              ยังไม่มีวิชาที่เรียนผ่าน กรุณาติ๊กและเลือกประเภทวิชา
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
