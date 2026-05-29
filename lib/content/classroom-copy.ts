/** Classroom / teacher workflow copy — Phase 7 Step 7 */

import { PLANNED_BADGE } from "@/lib/content/b2b-copy";

export { PLANNED_BADGE };

export const CLASSROOM_PLANNED_NOTE =
  "Classroom management дараагийн шатанд бүрэн идэвхжинэ.";

export const CLASS_CREATE_PLANNED_NOTE =
  "Анги үүсгэх бодит database workflow дараагийн шатанд идэвхжинэ.";

export const ASSIGNMENT_WRITE_PLANNED_NOTE =
  "Assignment write workflow дараагийн шатанд идэвхжинэ.";

export const DEMO_DATA_NOTE =
  "Demo data — real classroom tracking дараагийн шатанд.";

export const CLASS_FORM_NOTE =
  "Энэ form нь classroom workflow-ийн UI preview. Дараагийн шатанд Supabase class table-тэй холбогдоно.";

export const TEACHER_DASHBOARD_SUMMARY = {
  classes: { label: "Анги", value: "1 demo", sub: "HSK5 Demo Group" },
  assignedLessons: { label: "Assigned lessons", value: "4", sub: "3 active" },
  students: { label: "Сурагч", value: "12", sub: "demo placeholder" },
  avgQuizScore: { label: "Average quiz score", value: "78%", sub: "demo" },
  lessonsReady: { label: "Lessons ready to assign", value: "HSK5 · 4+", sub: "public course" },
};

export const CLASSROOM_WORKFLOW_STEPS = [
  "Class үүсгэнэ",
  "Сурагчид нэмнэ",
  "Lesson assignment өгнө",
  "Сурагч watch/vocab/quiz хийж дуусгана",
  "Багш progress тайлан харна",
  "Алдаатай үг/quiz дээр classroom review хийнэ",
];

export const CLASSROOM_WORKFLOW_CARDS = [
  {
    title: "Class management",
    desc: "Анги үүсгэх, сурагч нэмэх, бүлэг хянах.",
  },
  {
    title: "Assignment",
    desc: "Watch, vocabulary, quiz, review даалгавар өгөх.",
  },
  {
    title: "Student progress",
    desc: "Сурагч бүрийн lesson completion, quiz оноо.",
  },
  {
    title: "Quiz analytics",
    desc: "Ангийн дундаж оноо, хэцүү асуулт.",
  },
  {
    title: "Difficult vocabulary review",
    desc: "Classroom review — алдаатай үгс дээр focus.",
  },
];

export const SCHOOL_ROLLOUT_STEPS = [
  "Demo lesson үзнэ",
  "Багшийн workflow туршина",
  "Class/assignment setup төлөвлөнө",
  "Сурагчидтай pilot явуулна",
  "Progress тайлан шалгана",
];

export const ASSIGNMENT_TYPES = [
  { value: "watch", label: "Watch" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "quiz", label: "Quiz" },
  { value: "review", label: "Review" },
  { value: "full_lesson", label: "Full lesson" },
] as const;

export const CLASS_LEVELS = [
  "HSK1",
  "HSK2",
  "HSK3",
  "HSK4",
  "HSK5",
  "HSK6",
  "Mixed",
  "Custom",
] as const;

export const DEMO_CLASSES = [
  {
    id: "demo",
    name: "HSK5 Demo Group",
    level: "HSK5",
    students: 12,
    assignedLessons: 4,
    progressNote: "planned",
  },
];

export const DEMO_ASSIGNMENTS = [
  {
    id: "a1",
    title: "Lesson 1 — Watch + Vocabulary + Quiz",
    lessonId: "1",
    status: "in_progress" as const,
    dueLabel: "Энэ 7 хоног",
  },
  {
    id: "a2",
    title: "Lesson 2 — Vocabulary Review",
    lessonId: "2",
    status: "assigned" as const,
    dueLabel: "Дараагийн 7 хоног",
  },
  {
    id: "a3",
    title: "Weekly Review",
    lessonId: null,
    status: "completed" as const,
    dueLabel: "Дууссан (demo)",
  },
];

export const ASSIGNMENT_STATUS_LABELS: Record<
  "assigned" | "in_progress" | "completed",
  string
> = {
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
};
