import type { LearnerGradeBucket } from "@/lib/learner-grade";
import type { WeakSpotArea } from "@/lib/analytics/weak-spots";

/** Every figure is a number or null — null means "no data", never 0. */

export type AttendanceCounts = {
  present: number;
  late: number;
  absent: number;
  excused: number;
};

export type DashClass = {
  classroomId: string;
  name: string;
  isDemo: boolean;
  teacherId: string | null;
  teacherName: string;
  students: number;
  linkedStudents: number;
  activeStudents: number;
  /** Active in the last 7 days, % of linked students. */
  activePct: number | null;
  /** activePct minus the previous 7 days, in percentage points. */
  trend: number | null;
  attendancePct: number | null;
  attendance: AttendanceCounts;
  examAvgPct: number | null;
  examPassPct: number | null;
  quizAccuracyPct: number | null;
  /** Study hours per linked student, last 30 days. */
  hoursPerStudent: number | null;
  assignmentCompletionPct: number | null;
  avgPoints: number | null;
  totalPoints: number | null;
  /** 1 = best, among the classes in view. */
  pointsRank: number | null;
  distribution: { bucket: LearnerGradeBucket; count: number }[];
  /** % of linked students active, oldest week first (8 weeks). */
  weekly: (number | null)[];
};

export type DashTeacher = {
  teacherId: string | null;
  name: string;
  classes: number;
  students: number;
  avgPoints: number | null;
  attendancePct: number | null;
  examPassPct: number | null;
  completionPct: number | null;
  hoursPerStudent: number | null;
  activePct: number | null;
};

export type DashPerson = {
  id: string;
  name: string;
  className: string;
  isDemo: boolean;
  reasons: string[];
};

export type DashTopStudent = {
  userId: string;
  name: string;
  points: number;
  rank: number;
  delta: number | null;
  percentile: number | null;
  isDemo: boolean;
};

export type DashMissedQuestion = {
  key: string;
  questionId: string;
  lessonId: string;
  text: string | null;
  attempts: number;
  wrongPct: number;
};

export type DashExam = {
  examId: string;
  classroomName: string;
  title: string;
  date: string | null;
  total: number;
  sat: number;
  avgPct: number | null;
  passPct: number | null;
};

export type DashWeakArea = {
  area: WeakSpotArea;
  label: string;
  total: number;
  wrong: number;
  accuracyPct: number | null;
};

export type DashHero = {
  students: number;
  teachers: number;
  classes: number;
  activePct: number | null;
  activePctDelta: number | null;
  attendancePct: number | null;
  examPassPct: number | null;
  pointsWeek: number | null;
  pointsDelta: number | null;
  activeToday: number;
  /** Daily active students for the last 14 days (sparkline). */
  activeSpark: number[];
};

export type DashSnapshot = {
  hero: DashHero;
  classes: DashClass[];
  teachers: DashTeacher[];
  daily: { labels: string[]; active: number[]; minutes: number[] };
  weekLabels: string[];
  weakAreas: DashWeakArea[];
  missed: DashMissedQuestion[];
  top: DashTopStudent[];
  attention: DashPerson[];
  exams: DashExam[];
};

export type OrganizationDashboard = {
  organizationName: string | null;
  generatedAt: string;
  /** Real data only. */
  real: DashSnapshot;
  /** Real + example rows; null when the organization has no example classes. */
  all: DashSnapshot | null;
  demoClassCount: number;
  /** False when the points RPCs / view are missing: points show «—». */
  pointsAvailable: boolean;
  warnings: string[];
};
