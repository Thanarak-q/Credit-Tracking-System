// import React, { useState, useEffect } from 'react';
// import { Check, X, Plus, Trash2, Settings, Calendar, Clock } from 'lucide-react';

// const initialCoursesData = [
//   { code: '001101', nameEN: 'Fundamental English 1', nameTH: 'ภาษาอังกฤษพื้นฐาน 1', credits: 3, year: 1, semester: 1 },
//   { code: '140104', nameEN: 'Citizenship', nameTH: 'การเป็นพลเมือง', credits: 3, year: 1, semester: 1 },
//   { code: '203103', nameEN: 'General Chemistry 1', nameTH: 'เคมีทั่วไป 1', credits: 3, year: 1, semester: 1 },
//   { code: '204111', nameEN: 'Fundamentals of Programming', nameTH: 'การเขียนโปรแกรมเบื้องต้น', credits: 3, year: 1, semester: 1 },
//   { code: '206111', nameEN: 'Calculus 1', nameTH: 'แคลคูลัส 1', credits: 3, year: 1, semester: 1 },
//   { code: '206183', nameEN: 'Discrete Structure', nameTH: 'โครงสร้างเชิงวิจักษ์', credits: 3, year: 1, semester: 1 },
//   { code: '001102', nameEN: 'Fundamental English 2', nameTH: 'ภาษาอังกฤษพื้นฐาน 2', credits: 3, year: 1, semester: 2 },
//   { code: '202101', nameEN: 'Basic Biology 1', nameTH: 'ชีววิทยาพื้นฐาน 1', credits: 3, year: 1, semester: 2 },
//   { code: '204361', nameEN: 'Software Engineering', nameTH: 'วิศวกรรมซอฟต์แวร์', credits: 3, year: 3, semester: 1 },
// ];

// const planRequirements = {
//   regular: { name: 'แผนปกติ', majorElective: 15 },
//   coop: { name: 'แผนสหกิจศึกษา', majorElective: 12 },
//   honors: { name: 'แผนก้าวหน้า', majorElective: 27 }
// };

// const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
// const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

// const ScheduleBuilder = ({ year, semester, courses, scheduleData, setScheduleData }) => {
//   const [dragging, setDragging] = useState(null);
//   const [resizing, setResizing] = useState(null);

//   const semesterCourses = courses.filter(c => c.year === year && c.semester === semester);

//   const timeToPosition = (time) => {
//     const [hours, minutes] = time.split(':').map(Number);
//     return ((hours - 7) * 60 + minutes) / 60;
//   };

//   const positionToTime = (pos) => {
//     const totalMinutes = Math.round(pos * 60);
//     const hours = Math.floor(totalMinutes / 60) + 7;
//     const minutes = totalMinutes % 60;
//     return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
//   };

//   const handleMouseDown = (e, courseId, type) => {
//     e.preventDefault();
//     if (type === 'move') {
//       setDragging({ courseId, startX: e.clientX, startY: e.clientY });
//     } else if (type === 'resize') {
//       setResizing({ courseId, startX: e.clientX });
//     }
//   };

//   const handleMouseMove = (e) => {
//     if (dragging) {
//       const deltaX = e.clientX - dragging.startX;
//       const deltaY = e.clientY - dragging.startY;
//       const hoursDelta = deltaX / 100;
//       const daysDelta = Math.round(deltaY / 70);
      
//       setScheduleData(prev => {
//         const schedule = prev[dragging.courseId];
//         if (!schedule) return prev;
        
//         const startPos = timeToPosition(schedule.start_time) + hoursDelta;
//         const endPos = timeToPosition(schedule.end_time) + hoursDelta;
//         const currentDayIndex = DAYS.indexOf(schedule.day);
//         const newDayIndex = currentDayIndex + daysDelta;
        
//         if (startPos >= 0 && endPos <= 12 && newDayIndex >= 0 && newDayIndex < DAYS.length) {
//           return {
//             ...prev,
//             [dragging.courseId]: {
//               ...schedule,
//               start_time: positionToTime(startPos),
//               end_time: positionToTime(endPos),
//               day: DAYS[newDayIndex]
//             }
//           };
//         }
//         return prev;
//       });
      
//       setDragging({ ...dragging, startX: e.clientX, startY: e.clientY });
//     }
    
//     if (resizing) {
//       const deltaX = e.clientX - resizing.startX;
//       const hoursDelta = deltaX / 100;
      
//       setScheduleData(prev => {
//         const schedule = prev[resizing.courseId];
//         if (!schedule) return prev;
        
//         const endPos = timeToPosition(schedule.end_time) + hoursDelta;
        
//         if (endPos > timeToPosition(schedule.start_time) + 0.5 && endPos <= 12) {
//           return {
//             ...prev,
//             [resizing.courseId]: {
//               ...schedule,
//               end_time: positionToTime(endPos)
//             }
//           };
//         }
//         return prev;
//       });
      
//       setResizing({ ...resizing, startX: e.clientX });
//     }
//   };

//   const handleMouseUp = () => {
//     setDragging(null);
//     setResizing(null);
//   };

//   useEffect(() => {
//     if (dragging || resizing) {
//       document.addEventListener('mousemove', handleMouseMove);
//       document.addEventListener('mouseup', handleMouseUp);
//       return () => {
//         document.removeEventListener('mousemove', handleMouseMove);
//         document.removeEventListener('mouseup', handleMouseUp);
//       };
//     }
//   }, [dragging, resizing]);

//   const handleDayChange = (courseId, newDay) => {
//     setScheduleData(prev => ({
//       ...prev,
//       [courseId]: { ...prev[courseId], day: newDay }
//     }));
//   };

//   const addToSchedule = (courseId) => {
//     setScheduleData(prev => ({
//       ...prev,
//       [courseId]: {
//         day: 'MON',
//         start_time: '09:00',
//         end_time: '11:00',
//         room: ''
//       }
//     }));
//   };

//   const removeFromSchedule = (courseId) => {
//     setScheduleData(prev => {
//       const newData = { ...prev };
//       delete newData[courseId];
//       return newData;
//     });
//   };

//   const courseColors = [
//     'bg-green-500',
//     'bg-orange-500',
//     'bg-blue-500',
//     'bg-red-500',
//     'bg-teal-500',
//     'bg-purple-500',
//     'bg-pink-500',
//     'bg-cyan-500'
//   ];

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6 mt-6">
//       <div className="flex items-center gap-3 mb-4">
//         <Calendar className="text-blue-600" size={24} />
//         <h3 className="text-xl font-semibold text-gray-700">
//           ตารางเรียน - ชั้นปีที่ {year} ภาคการศึกษาที่ {semester}
//         </h3>
//       </div>

//       <div className="mb-4 p-4 bg-gray-50 rounded-lg">
//         <h4 className="font-semibold mb-2 text-gray-700">วิชาที่สามารถเพิ่มในตาราง:</h4>
//         <div className="flex flex-wrap gap-2">
//           {semesterCourses.filter(c => !scheduleData[c.id || c.code]).map(course => (
//             <button
//               key={course.id || course.code}
//               onClick={() => addToSchedule(course.id || course.code)}
//               className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
//             >
//               + {course.code}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         <div className="min-w-[1000px]">
//           {/* Header - Time slots */}
//           <div className="flex border-b-2 border-gray-700">
//             <div className="w-24 bg-gray-700 text-white p-3 font-semibold flex items-center justify-center">
//               Day / Time
//             </div>
//             {HOURS.map(hour => (
//               <div key={hour} className="flex-1 bg-gray-700 text-white p-3 text-center font-semibold border-l border-gray-600">
//                 {hour}:00
//               </div>
//             ))}
//           </div>

//           {/* Days rows */}
//           <div className="relative">
//             {DAYS.map((day, dayIndex) => (
//               <div key={day} className="flex border-b border-gray-300 h-[70px]">
//                 <div className="w-24 bg-gray-100 p-3 font-semibold text-gray-700 flex items-center justify-center">
//                   {day}
//                 </div>
//                 {HOURS.map(hour => (
//                   <div key={`${day}-${hour}`} className="flex-1 bg-gray-50 border-l border-gray-200 relative"></div>
//                 ))}
//               </div>
//             ))}

//             {/* Course Blocks */}
//             {Object.entries(scheduleData).map(([courseId, schedule], idx) => {
//               const course = semesterCourses.find(c => (c.id || c.code) === courseId);
//               if (!course || !schedule) return null;

//               const dayIndex = DAYS.indexOf(schedule.day);
//               if (dayIndex === -1) return null;

//               const startPos = timeToPosition(schedule.start_time);
//               const endPos = timeToPosition(schedule.end_time);
//               const duration = endPos - startPos;

//               return (
//                 <div
//                   key={courseId}
//                   className={`absolute ${courseColors[idx % courseColors.length]} text-white p-2 rounded-lg shadow-lg cursor-move overflow-hidden border-2 border-white`}
//                   style={{
//                     left: `calc(6rem + ${startPos * (100 / 13)}%)`,
//                     top: `${dayIndex * 70}px`,
//                     width: `calc(${duration * (100 / 13)}% - 4px)`,
//                     height: '66px',
//                     zIndex: dragging?.courseId === courseId || resizing?.courseId === courseId ? 50 : 10
//                   }}
//                   onMouseDown={(e) => handleMouseDown(e, courseId, 'move')}
//                 >
//                   <div className="flex items-center justify-between h-full">
//                     <div className="flex-1 min-w-0">
//                       <div className="font-semibold text-sm truncate">{course.code}</div>
//                       <div className="text-xs truncate">{course.nameTH}</div>
//                       <div className="text-xs mt-1">
//                         <Clock size={10} className="inline mr-1" />
//                         {schedule.start_time}-{schedule.end_time}
//                       </div>
//                       {schedule.room && (
//                         <div className="text-xs truncate">Room: {schedule.room}</div>
//                       )}
//                     </div>

//                     {/* Resize Handle - Right edge */}
//                     <div
//                       className="w-2 h-full bg-white bg-opacity-30 cursor-ew-resize hover:bg-opacity-50 ml-1"
//                       onMouseDown={(e) => {
//                         e.stopPropagation();
//                         handleMouseDown(e, courseId, 'resize');
//                       }}
//                     ></div>

//                     {/* Remove Button */}
//                     <button
//                       className="absolute top-1 right-1 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-500 hover:text-white"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         removeFromSchedule(courseId);
//                       }}
//                       onMouseDown={(e) => e.stopPropagation()}
//                     >
//                       <X size={12} />
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>

//       <div className="mt-6 p-4 bg-gray-50 rounded-lg">
//         <h4 className="font-semibold mb-3 text-gray-700">ปรับเวลาและวันด้วยตนเอง:</h4>
//         <div className="space-y-3">
//           {Object.entries(scheduleData).map(([courseId, schedule]) => {
//             const course = semesterCourses.find(c => (c.id || c.code) === courseId);
//             if (!course) return null;

//             return (
//               <div key={courseId} className="grid grid-cols-6 gap-2 items-center">
//                 <div className="font-semibold text-sm">{course.code}</div>
//                 <select
//                   value={schedule.day}
//                   onChange={(e) => setScheduleData(prev => ({
//                     ...prev,
//                     [courseId]: { ...schedule, day: e.target.value }
//                   }))}
//                   className="border rounded px-2 py-1 text-sm"
//                 >
//                   {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
//                 </select>
//                 <input
//                   type="time"
//                   value={schedule.start_time}
//                   onChange={(e) => setScheduleData(prev => ({
//                     ...prev,
//                     [courseId]: { ...schedule, start_time: e.target.value }
//                   }))}
//                   className="border rounded px-2 py-1 text-sm"
//                 />
//                 <input
//                   type="time"
//                   value={schedule.end_time}
//                   onChange={(e) => setScheduleData(prev => ({
//                     ...prev,
//                     [courseId]: { ...schedule, end_time: e.target.value }
//                   }))}
//                   className="border rounded px-2 py-1 text-sm"
//                 />
//                 <input
//                   type="text"
//                   placeholder="ห้องเรียน"
//                   value={schedule.room || ''}
//                   onChange={(e) => setScheduleData(prev => ({
//                     ...prev,
//                     [courseId]: { ...schedule, room: e.target.value }
//                   }))}
//                   className="border rounded px-2 py-1 text-sm"
//                 />
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function CourseTracker() {
//   const [selectedPlan, setSelectedPlan] = useState(() => {
//     return localStorage.getItem('selectedPlan') || '';
//   });
  
//   const [showPlanModal, setShowPlanModal] = useState(!selectedPlan);
  
//   const [courses, setCourses] = useState(() => {
//     const saved = localStorage.getItem('courses');
//     return saved ? JSON.parse(saved) : initialCoursesData;
//   });
  
//   const [progress, setProgress] = useState(() => {
//     const saved = localStorage.getItem('progress');
//     return saved ? JSON.parse(saved) : {};
//   });

//   const [courseTypes, setCourseTypes] = useState(() => {
//     const saved = localStorage.getItem('courseTypes');
//     return saved ? JSON.parse(saved) : {};
//   });

//   const [scheduleData, setScheduleData] = useState(() => {
//     const saved = localStorage.getItem('scheduleData');
//     return saved ? JSON.parse(saved) : {};
//   });

//   const [activeSchedule, setActiveSchedule] = useState({ year: 1, semester: 1 });

//   useEffect(() => {
//     localStorage.setItem('selectedPlan', selectedPlan);
//   }, [selectedPlan]);

//   useEffect(() => {
//     localStorage.setItem('courses', JSON.stringify(courses));
//   }, [courses]);

//   useEffect(() => {
//     localStorage.setItem('progress', JSON.stringify(progress));
//   }, [progress]);

//   useEffect(() => {
//     localStorage.setItem('courseTypes', JSON.stringify(courseTypes));
//   }, [courseTypes]);

//   useEffect(() => {
//     localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
//   }, [scheduleData]);

//   const addCourse = (year, semester) => {
//     const newCourse = {
//       code: '',
//       nameEN: '',
//       nameTH: '',
//       credits: 3,
//       year,
//       semester,
//       id: Date.now()
//     };
//     setCourses([...courses, newCourse]);
//   };

//   const deleteCourse = (courseId) => {
//     setCourses(courses.filter(c => (c.id || c.code) !== courseId));
//     const newProgress = { ...progress };
//     delete newProgress[courseId];
//     setProgress(newProgress);
//     const newCourseTypes = { ...courseTypes };
//     delete newCourseTypes[courseId];
//     setCourseTypes(newCourseTypes);
//   };

//   const updateCourse = (courseId, field, value) => {
//     setCourses(courses.map(c => 
//       (c.id || c.code) === courseId ? { ...c, [field]: value } : c
//     ));
//   };

//   const toggleCompletion = (courseId) => {
//     setProgress(prev => ({
//       ...prev,
//       [courseId]: { completed: !prev[courseId]?.completed }
//     }));
//   };

//   const updateCourseType = (courseId, type) => {
//     setCourseTypes(prev => ({
//       ...prev,
//       [courseId]: type
//     }));
//   };

//   const calculateCredits = () => {
//     const summary = { 
//       total: 0, 
//       required: 0,
//       core: 0, 
//       major: 0, 
//       majorElective: 0,
//       minor: 0, 
//       free: 0, 
//       ge: 0 
//     };
    
//     courses.forEach(course => {
//       const courseId = course.id || course.code;
//       if (progress[courseId]?.completed && courseTypes[courseId]) {
//         const credits = parseInt(course.credits) || 0;
//         summary.total += credits;
//         summary[courseTypes[courseId]] += credits;
//       }
//     });
    
//     return summary;
//   };

//   const credits = calculateCredits();
  
//   const requirements = {
//     required: 24,
//     core: 24,
//     major: 41,
//     majorElective: selectedPlan ? planRequirements[selectedPlan].majorElective : 0,
//     ge: 6,
//     free: 6,
//     minor: 15
//   };
  
//   const totalRequired = Object.values(requirements).reduce((a, b) => a + b, 0);

//   const groupedCourses = {};
//   courses.forEach(course => {
//     const key = `${course.year}-${course.semester}`;
//     if (!groupedCourses[key]) groupedCourses[key] = [];
//     groupedCourses[key].push(course);
//   });

//   const typeColors = {
//     required: 'bg-indigo-100 border-indigo-500 text-indigo-800',
//     core: 'bg-blue-100 border-blue-500 text-blue-800',
//     major: 'bg-orange-100 border-orange-500 text-orange-800',
//     majorElective: 'bg-red-100 border-red-500 text-red-800',
//     minor: 'bg-purple-100 border-purple-500 text-purple-800',
//     free: 'bg-green-100 border-green-500 text-green-800',
//     ge: 'bg-yellow-100 border-yellow-500 text-yellow-800'
//   };

//   const typeLabels = {
//     required: 'วิชาบังคับ',
//     core: 'วิชาแกน',
//     major: 'วิชาเอก',
//     majorElective: 'วิชาเอกเลือก',
//     minor: 'วิชาโท',
//     free: 'วิชาเสรี',
//     ge: 'วิชา GE'
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-4">
//       {showPlanModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
//             <h2 className="text-2xl font-bold mb-4">เลือกแผนการศึกษา</h2>
//             <p className="text-gray-600 mb-6">กรุณาเลือกแผนการศึกษาของคุณก่อนใช้งานระบบ</p>
            
//             <div className="space-y-3">
//               {Object.entries(planRequirements).map(([key, plan]) => (
//                 <button
//                   key={key}
//                   onClick={() => {
//                     setSelectedPlan(key);
//                     setShowPlanModal(false);
//                   }}
//                   className="w-full p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
//                 >
//                   <div className="font-semibold text-lg">{plan.name}</div>
//                   <div className="text-sm text-gray-600">วิชาเอกเลือก: {plan.majorElective} หน่วยกิต</div>
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="max-w-7xl mx-auto">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-3xl font-bold text-gray-800">ระบบติดตามหน่วยกิตการศึกษา</h1>
//           <button
//             onClick={() => setShowPlanModal(true)}
//             className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
//           >
//             <Settings size={18} />
//             เปลี่ยนแผนการศึกษา
//           </button>
//         </div>

//         {selectedPlan && (
//           <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-6">
//             <div className="font-semibold text-blue-800">
//               แผนการศึกษาปัจจุบัน: {planRequirements[selectedPlan].name}
//             </div>
//             <div className="text-sm text-blue-600">
//               วิชาเอกเลือก: {planRequirements[selectedPlan].majorElective} หน่วยกิต
//             </div>
//           </div>
//         )}
        
//         <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//           <div className="mb-4">
//             <div className="flex justify-between items-center mb-2">
//               <span className="font-semibold text-lg">รวมทั้งหมด</span>
//               <span className="text-2xl font-bold text-blue-600">
//                 {credits.total} / {totalRequired} หน่วยกิต
//               </span>
//             </div>
//             <div className="w-full bg-gray-200 rounded-full h-4">
//               <div 
//                 className="bg-blue-600 h-4 rounded-full transition-all duration-300"
//                 style={{ width: `${Math.min((credits.total / totalRequired) * 100, 100)}%` }}
//               ></div>
//             </div>
//           </div>
          
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//             {Object.entries(typeLabels).map(([key, label]) => (
//               <div key={key} className={`p-3 rounded-lg ${typeColors[key]}`}>
//                 <div className="font-semibold text-sm">{label}</div>
//                 <div className="text-xl font-bold">
//                   {credits[key]} / {requirements[key]}
//                 </div>
//                 <div className="w-full bg-white bg-opacity-50 rounded-full h-2 mt-2">
//                   <div 
//                     className="bg-current h-2 rounded-full transition-all"
//                     style={{ width: `${Math.min((credits[key] / requirements[key]) * 100, 100)}%` }}
//                   ></div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="space-y-8">
//           {[1, 2, 3, 4].map(year => (
//             <div key={year} className="bg-white rounded-lg shadow-md p-6">
//               <h2 className="text-2xl font-bold mb-4 text-gray-700">ชั้นปีที่ {year}</h2>
              
//               {[1, 2].map(semester => (
//                 <div key={semester} className="mb-6">
//                   <div className="flex justify-between items-center mb-3">
//                     <h3 className="text-xl font-semibold text-gray-600">ภาคการศึกษาที่ {semester}</h3>
//                     <button
//                       onClick={() => addCourse(year, semester)}
//                       className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
//                     >
//                       <Plus size={18} />
//                       เพิ่มวิชา
//                     </button>
//                   </div>
                  
//                   <div className="overflow-x-auto">
//                     <table className="w-full">
//                       <thead className="bg-orange-500 text-white">
//                         <tr>
//                           <th className="p-3 text-center">เรียนแล้ว</th>
//                           <th className="p-3 text-left">รหัสวิชา</th>
//                           <th className="p-3 text-left">ชื่อวิชา (EN)</th>
//                           <th className="p-3 text-left">ชื่อวิชา (TH)</th>
//                           <th className="p-3 text-center">หน่วยกิต</th>
//                           <th className="p-3 text-center">ประเภทวิชา</th>
//                           <th className="p-3 text-center">ลบ</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {groupedCourses[`${year}-${semester}`]?.map(course => {
//                           const courseId = course.id || course.code;
//                           const isCompleted = progress[courseId]?.completed;
//                           const courseType = courseTypes[courseId];
                          
//                           return (
//                             <tr 
//                               key={courseId} 
//                               className={`border-b ${isCompleted ? 'bg-green-50' : 'hover:bg-gray-50'}`}
//                             >
//                               <td className="p-3 text-center">
//                                 <input
//                                   type="checkbox"
//                                   checked={isCompleted || false}
//                                   onChange={() => toggleCompletion(courseId)}
//                                   className="w-5 h-5 cursor-pointer accent-green-600"
//                                 />
//                               </td>
//                               <td className="p-3">
//                                 <input
//                                   type="text"
//                                   value={course.code}
//                                   onChange={(e) => updateCourse(courseId, 'code', e.target.value)}
//                                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                   placeholder="รหัสวิชา"
//                                 />
//                               </td>
//                               <td className="p-3">
//                                 <input
//                                   type="text"
//                                   value={course.nameEN}
//                                   onChange={(e) => updateCourse(courseId, 'nameEN', e.target.value)}
//                                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                   placeholder="ชื่อภาษาอังกฤษ"
//                                 />
//                               </td>
//                               <td className="p-3">
//                                 <input
//                                   type="text"
//                                   value={course.nameTH}
//                                   onChange={(e) => updateCourse(courseId, 'nameTH', e.target.value)}
//                                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                   placeholder="ชื่อภาษาไทย"
//                                 />
//                               </td>
//                               <td className="p-3 text-center">
//                                 <input
//                                   type="number"
//                                   value={course.credits}
//                                   onChange={(e) => updateCourse(courseId, 'credits', e.target.value)}
//                                   className="w-20 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                   min="1"
//                                   max="6"
//                                 />
//                               </td>
//                               <td className="p-3 text-center">
//                                 <select
//                                   value={courseType || ''}
//                                   onChange={(e) => updateCourseType(courseId, e.target.value)}
//                                   className={`w-full p-2 border-2 rounded font-semibold text-sm focus:ring-2 focus:ring-blue-500 ${
//                                     courseType ? typeColors[courseType] : 'bg-white'
//                                   }`}
//                                 >
//                                   <option value="">-- เลือกประเภท --</option>
//                                   <option value="required">วิชาบังคับ</option>
//                                   <option value="core">วิชาแกน</option>
//                                   <option value="major">วิชาเอก</option>
//                                   <option value="majorElective">วิชาเอกเลือก</option>
//                                   <option value="minor">วิชาโท</option>
//                                   <option value="ge">วิชา GE</option>
//                                   <option value="free">วิชาเสรี</option>
//                                 </select>
//                               </td>
//                               <td className="p-3 text-center">
//                                 <button
//                                   onClick={() => {
//                                     if (confirm('ต้องการลบวิชานี้?')) {
//                                       deleteCourse(courseId);
//                                     }
//                                   }}
//                                   className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50"
//                                 >
//                                   <Trash2 size={20} />
//                                 </button>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>

//                   <ScheduleBuilder 
//                     year={year}
//                     semester={semester}
//                     courses={courses}
//                     scheduleData={scheduleData}
//                     setScheduleData={setScheduleData}
//                   />
//                 </div>
//               ))}
//             </div>
//           ))}
//         </div>

//         <div className="bg-white rounded-lg shadow-md p-6 mt-8">
//           <h2 className="text-2xl font-bold mb-4 text-gray-700">วิชาที่เรียนแล้ว</h2>
          
//           {Object.entries(typeLabels).map(([type, label]) => {
//             const completedCourses = courses.filter(c => {
//               const courseId = c.id || c.code;
//               return progress[courseId]?.completed && courseTypes[courseId] === type;
//             });
            
//             if (completedCourses.length === 0) return null;
            
//             return (
//               <div key={type} className="mb-6">
//                 <h3 className={`text-lg font-semibold mb-3 p-3 rounded-lg ${typeColors[type]}`}>
//                   {label} ({credits[type]} / {requirements[type]} หน่วยกิต)
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
//                   {completedCourses.map(course => (
//                     <div key={course.id || course.code} className="border-l-4 border-gray-300 pl-3 py-2 hover:bg-gray-50">
//                       <div className="font-semibold text-gray-700">{course.code}</div>
//                       <div className="text-sm text-gray-600">{course.nameEN}</div>
//                       <div className="text-sm text-gray-500">{course.nameTH}</div>
//                       <div className="text-xs text-gray-400">{course.credits} หน่วยกิต</div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             );
//           })}
          
//           {Object.values(typeLabels).every(type => 
//             !courses.some(c => {
//               const courseId = c.id || c.code;
//               return progress[courseId]?.completed && courseTypes[courseId];
//             })
//           ) && (
//             <div className="text-center text-gray-400 py-8">
//               ยังไม่มีวิชาที่เรียนผ่าน กรุณาติ๊กและเลือกประเภทวิชา
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }