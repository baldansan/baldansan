/**
 * Ангийн загвар шалгалтын домэйн төрлүүд ба тооцооллууд.
 *
 * Хүснэгт: public.classroom_exams (059_class_mock_exams.sql).
 * Шалгалт өөрөө public.mock_tests дотор (id нь TEXT), оролдлого нь
 * public.user_test_attempts дотор.
 *
 * Энд байгаа функцууд цэвэр (pure) — Supabase-гүйгээр шалгаж болно.
 */

import {
  hskMaxTotal,
  hskPassThreshold,
  type HskAttemptScoreMetadata,
} from "@/lib/mock-test/hsk-scoring";

export const CLASSROOM_EXAM_STATUSES = ["scheduled", "open", "closed"] as const;

export type ClassroomExamStatus = (typeof CLASSROOM_EXAM_STATUSES)[number];

export const CLASSROOM_EXAM_STATUS_LABELS: Record<ClassroomExamStatus, string> = {
  scheduled: "Товлосон",
  open: "Нээлттэй",
  closed: "Хаасан",
};

export function isClassroomExamStatus(
  value: string
): value is ClassroomExamStatus {
  return (CLASSROOM_EXAM_STATUSES as readonly string[]).includes(value);
}

export type ClassroomExam = {
  id: string;
  classroomId: string;
  /** public.mock_tests.id — TEXT түлхүүр, жишээ нь "HSK4-M1". */
  testId: string;
  title: string | null;
  scheduledFor: string | null;
  dueDate: string | null;
  status: ClassroomExamStatus;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** mock_tests-оос join хийж авсан нэмэлт мэдээлэл. */
  testTitle?: string | null;
  hskLevel?: number | null;
};

/** Багшид сонгуулах бэлэн загвар шалгалт. */
export type ExamTestOption = {
  id: string;
  title: string;
  hskLevel: number;
  totalQuestions: number;
  timeLimitMin: number;
};

/**
 * Нэг сурагчийн нэг шалгалтын мөр.
 *
 * sat = false бол «Өгөөгүй». Тэр сурагчийг 0 оноотой гэж ХЭЗЭЭ Ч тооцохгүй —
 * дундаж, тэнцсэн хувийн аль алинаас нь гадуур үлдэнэ.
 */
export type ClassroomExamStudentRow = {
  studentRowId: string;
  studentUserId: string | null;
  displayName: string;
  sat: boolean;
  attemptId: string | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  /** null = тодорхойгүй (бичих хэсэг дүгнэгдээгүй). */
  passed: boolean | null;
  writingPending: boolean;
  finishedAt: string | null;
};

export type ExamPassThreshold = {
  /** Тэнцэхэд шаардлагатай оноо. */
  score: number;
  /** Нийт авах боломжтой оноо. */
  maxScore: number;
  /** Хувиар илэрхийлсэн босго. */
  percent: number;
  /**
   * hsk       — аппын HSK оноолтын босго (lib/mock-test/hsk-scoring).
   * fallback  — шалгалтын HSK түвшин олдоогүй тул 60%-иар тооцов.
   */
  source: "hsk" | "fallback";
};

export type ClassroomExamSummary = {
  exam: ClassroomExam;
  rows: ClassroomExamStudentRow[];
  totalStudents: number;
  satCount: number;
  notSatCount: number;
  /** Зөвхөн өгсөн сурагчдаар бодсон дундаж оноо. Хэн ч өгөөгүй бол null. */
  averageScore: number | null;
  averagePercentage: number | null;
  passedCount: number;
  failedCount: number;
  /** Бичих хэсэг дүгнэгдээгүй тул тэнцсэн эсэх нь тодорхойгүй мөрийн тоо. */
  undeterminedCount: number;
  /** Тэнцсэн хувь — тодорхой дүн гарсан оролдлогуудаар. null = тоолох мөр алга. */
  passRate: number | null;
  threshold: ExamPassThreshold;
};

/** Албан ёсны HSK босго олдохгүй үед ашиглах нөөц босго (хувиар). */
export const FALLBACK_PASS_PERCENT = 60;

/**
 * Тухайн шалгалтын тэнцэх босгыг тодорхойлно.
 *
 * HSK түвшин мэдэгдэж байвал аппын hskPassThreshold/hskMaxTotal-ыг ашиглана
 * (HSK 1–2: 120/200, HSK 3+: 180/300). Түвшин мэдэгдэхгүй бол 60% гэж үзээд
 * source = "fallback" гэж тэмдэглэнэ — UI дээр үүнийг ил хэлнэ.
 */
export function resolvePassThreshold(
  hskLevel: number | null | undefined,
  maxScoreHint?: number | null
): ExamPassThreshold {
  if (hskLevel != null && Number.isFinite(hskLevel) && hskLevel > 0) {
    const maxScore = hskMaxTotal(hskLevel);
    const score = hskPassThreshold(hskLevel);
    return {
      score,
      maxScore,
      percent: Math.round((score / maxScore) * 100),
      source: "hsk",
    };
  }

  const maxScore =
    maxScoreHint != null && maxScoreHint > 0 ? maxScoreHint : 100;
  return {
    score: Math.round((maxScore * FALLBACK_PASS_PERCENT) / 100),
    maxScore,
    percent: FALLBACK_PASS_PERCENT,
    source: "fallback",
  };
}

export function toPercentage(
  score: number | null,
  maxScore: number | null
): number | null {
  if (score == null || maxScore == null || maxScore <= 0) return null;
  return Math.round((score / maxScore) * 100);
}

/** user_test_attempts-ийн нэг мөрөөс шаардлагатай хэсгийг л авна. */
export type ExamAttemptRow = {
  id: string;
  userId: string;
  /** public.mock_tests.id */
  testId: string;
  finishedAt: string | null;
  rawScore: number | null;
  maxScore: number | null;
  metadata: HskAttemptScoreMetadata | null;
};

/**
 * Нэг оролдлогыг сурагчийн мөр болгоно.
 *
 * Бичих хэсэг гараар дүгнэгддэг тул дүгнэгдээгүй байхад оноо дутуу байна.
 * Ийм үед босгыг давсан бол «тэнцсэн» гэж болно (цаашид өсөх л боломжтой),
 * харин даваагүй бол «тэнцээгүй» гэж хэлэхгүй — тодорхойгүй (null) гэж үзнэ.
 */
export function scoreFromAttempt(
  attempt: ExamAttemptRow,
  threshold: ExamPassThreshold
): {
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  writingPending: boolean;
} {
  const metadata = attempt.metadata;
  const score =
    metadata?.hsk_total != null
      ? Number(metadata.hsk_total)
      : attempt.rawScore != null
        ? Number(attempt.rawScore)
        : null;
  const maxScore =
    metadata?.hsk_max != null
      ? Number(metadata.hsk_max)
      : attempt.maxScore != null
        ? Number(attempt.maxScore)
        : threshold.maxScore;
  const passScore = metadata?.pass_threshold ?? threshold.score;
  const writingPending = metadata ? metadata.writing_graded === false : false;

  let passed: boolean | null = null;
  if (score != null) {
    if (score >= passScore) passed = true;
    else if (!writingPending) passed = false;
  }

  return {
    score,
    maxScore,
    percentage: toPercentage(score, maxScore),
    passed,
    writingPending,
  };
}

/** Ангийн нэгдсэн дүн. Өгөөгүй сурагчийг ХЭЗЭЭ Ч 0 гэж тооцохгүй. */
export function summarizeExam(
  exam: ClassroomExam,
  rows: ClassroomExamStudentRow[],
  threshold: ExamPassThreshold
): ClassroomExamSummary {
  const satRows = rows.filter((row) => row.sat && row.score != null);
  const satCount = rows.filter((row) => row.sat).length;
  const passedCount = rows.filter((row) => row.passed === true).length;
  const failedCount = rows.filter((row) => row.passed === false).length;
  const undeterminedCount = satCount - passedCount - failedCount;
  const determined = passedCount + failedCount;

  const averageScore = satRows.length
    ? Math.round(
        (satRows.reduce((sum, row) => sum + (row.score ?? 0), 0) /
          satRows.length) *
          10
      ) / 10
    : null;

  const percentRows = satRows.filter((row) => row.percentage != null);
  const averagePercentage = percentRows.length
    ? Math.round(
        percentRows.reduce((sum, row) => sum + (row.percentage ?? 0), 0) /
          percentRows.length
      )
    : null;

  return {
    exam,
    rows,
    totalStudents: rows.length,
    satCount,
    notSatCount: rows.length - satCount,
    averageScore,
    averagePercentage,
    passedCount,
    failedCount,
    undeterminedCount: undeterminedCount > 0 ? undeterminedCount : 0,
    passRate: determined > 0 ? Math.round((passedCount / determined) * 100) : null,
    threshold,
  };
}

/** Суралцагчид харуулах товч төлөв. */
export type LearnerExamStatusLabel =
  | "Өгөөгүй"
  | "Тэнцсэн"
  | "Тэнцээгүй"
  | "Дүн хүлээгдэж байна";

/** Шалгалтын харагдах нэр — багш гарчиг бичээгүй бол шалгалтынхаа нэрийг авна. */
export function examDisplayTitle(exam: ClassroomExam): string {
  const title = exam.title?.trim();
  if (title) return title;
  const testTitle = exam.testTitle?.trim();
  if (testTitle) return testTitle;
  return exam.testId;
}
