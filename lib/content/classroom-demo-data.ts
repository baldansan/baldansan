/** Mock demo data for classroom UI preview — not persisted */

export type DemoStudent = {
  id: string;
  name: string;
  progress: string;
  quizScore: string;
  learnedWords: number;
};

export const DEMO_CLASS = {
  id: "demo",
  name: "HSK5 Demo Group",
  level: "HSK5",
  description:
    "Сургалтын төвийн pilot анги — demo data ашиглан classroom workflow-г харуулна.",
  teacherNote:
    "Энэ анги нь demo. Бодит сурагчийн мэдээлэл Supabase classroom schema идэвхжсний дараа харагдана.",
  studentCount: 12,
  assignedLessons: ["1", "2", "3"],
};

export const DEMO_STUDENTS: DemoStudent[] = [
  {
    id: "s1",
    name: "Student 1",
    progress: "Lesson 1 ✓ · Lesson 2 60%",
    quizScore: "85%",
    learnedWords: 24,
  },
  {
    id: "s2",
    name: "Student 2",
    progress: "Lesson 1 ✓ · Lesson 2 ✓",
    quizScore: "92%",
    learnedWords: 31,
  },
  {
    id: "s3",
    name: "Student 3",
    progress: "Lesson 1 80%",
    quizScore: "70%",
    learnedWords: 18,
  },
  {
    id: "s4",
    name: "Student 4",
    progress: "Lesson 1 ✓",
    quizScore: "78%",
    learnedWords: 22,
  },
];

export const DEMO_CLASS_INSIGHTS = {
  avgQuizScore: "78%",
  difficultVocabulary: ["比较", "虽然", "因为"],
  lessonsNeedingReview: ["Lesson 2 — vocabulary", "Lesson 3 — quiz prep"],
};

export const DEMO_ASSIGNED_LESSONS = [
  { id: "1", title: "Lesson 1", status: "active" },
  { id: "2", title: "Lesson 2", status: "active" },
  { id: "3", title: "Lesson 3", status: "planned" },
];

export const DEMO_CLASS_OPTIONS = [
  { value: "demo", label: "HSK5 Demo Group" },
];

export const DEMO_LESSON_OPTIONS = [
  { value: "1", label: "Lesson 1" },
  { value: "2", label: "Lesson 2" },
  { value: "3", label: "Lesson 3" },
  { value: "4", label: "Lesson 4" },
];
