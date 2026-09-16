/**
 * Letter grades for learners.
 *
 * A learner is scored 0–100 out of four parts, then bucketed into A–F. Any
 * part with no data at all is dropped and its weight is shared out among the
 * parts that do have data — otherwise a learner who has never sat a mock exam
 * could never reach an A, which would say more about the exam feature than
 * about the learner.
 */

export const LEARNER_GRADES = ["A", "B", "C", "D", "F"] as const;

export type LearnerGrade = (typeof LEARNER_GRADES)[number];

/** "unrated" = too little activity to judge fairly. */
export type LearnerGradeBucket = LearnerGrade | "unrated";

export const LEARNER_GRADE_BUCKETS = [
  ...LEARNER_GRADES,
  "unrated",
] as const satisfies readonly LearnerGradeBucket[];

export type LearnerScorePartKey = "quiz" | "mock" | "lessons" | "activity";

export type LearnerScoreInput = {
  /** How many lesson quizzes the learner has finished. */
  quizAttempts: number;
  /** Mean correct-answer percentage across those quizzes, 0–100. */
  quizAveragePercent: number | null;
  /** How many mock exams the learner has finished. */
  mockAttempts: number;
  /** Mean mock exam percentage, 0–100. */
  mockAveragePercent: number | null;
  /** Lessons marked completed. */
  completedLessons: number;
  /** Words marked learned. */
  learnedWords: number;
  /** Minutes of tracked study time in the scoring window. */
  activeMinutes: number;
};

export type LearnerScorePart = {
  key: LearnerScorePartKey;
  label: string;
  /** 0–100, or null when the learner has no data for this part. */
  score: number | null;
  /** Share of the final score this part actually carried, 0–100. */
  appliedWeight: number;
};

export type LearnerScore = {
  /** 0–100, rounded. Null when the learner is unrated. */
  total: number | null;
  grade: LearnerGradeBucket;
  parts: LearnerScorePart[];
  /** Why the learner is unrated, for display. Null when rated. */
  unratedReason: string | null;
};

/** Nominal weights; redistributed when a part has no data. */
const PART_WEIGHTS: Record<LearnerScorePartKey, number> = {
  quiz: 40,
  mock: 20,
  lessons: 25,
  activity: 15,
};

const PART_LABELS: Record<LearnerScorePartKey, string> = {
  quiz: "Дасгалын дундаж",
  mock: "Шалгалтын дундаж",
  lessons: "Хичээл дуусгалт",
  activity: "Идэвх",
};

/**
 * Benchmarks for the two parts that are counts rather than percentages.
 * Reaching the benchmark scores full marks; beyond it does not add more.
 */
export const LESSON_COMPLETION_TARGET = 10;
export const LEARNED_WORDS_TARGET = 150;
export const ACTIVE_MINUTES_TARGET = 300;

/** Below this many quizzes there is not enough evidence to grade. */
export const MIN_QUIZ_ATTEMPTS_FOR_GRADE = 5;

const GRADE_THRESHOLDS: { grade: LearnerGrade; min: number }[] = [
  { grade: "A", min: 90 },
  { grade: "B", min: 80 },
  { grade: "C", min: 70 },
  { grade: "D", min: 60 },
  { grade: "F", min: 0 },
];

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function ratioScore(value: number, target: number): number {
  if (target <= 0) return 0;
  return clampPercent((value / target) * 100);
}

export function gradeFromScore(total: number): LearnerGrade {
  return (
    GRADE_THRESHOLDS.find((threshold) => total >= threshold.min)?.grade ?? "F"
  );
}

export function computeLearnerScore(input: LearnerScoreInput): LearnerScore {
  const rawParts: Record<LearnerScorePartKey, number | null> = {
    quiz:
      input.quizAttempts > 0 && input.quizAveragePercent != null
        ? clampPercent(input.quizAveragePercent)
        : null,
    mock:
      input.mockAttempts > 0 && input.mockAveragePercent != null
        ? clampPercent(input.mockAveragePercent)
        : null,
    lessons:
      input.completedLessons > 0
        ? ratioScore(input.completedLessons, LESSON_COMPLETION_TARGET)
        : null,
    activity:
      input.learnedWords > 0 || input.activeMinutes > 0
        ? clampPercent(
            ratioScore(input.learnedWords, LEARNED_WORDS_TARGET) * 0.5 +
              ratioScore(input.activeMinutes, ACTIVE_MINUTES_TARGET) * 0.5
          )
        : null,
  };

  const availableKeys = (
    Object.keys(rawParts) as LearnerScorePartKey[]
  ).filter((key) => rawParts[key] != null);

  const availableWeight = availableKeys.reduce(
    (sum, key) => sum + PART_WEIGHTS[key],
    0
  );

  const parts: LearnerScorePart[] = (
    Object.keys(rawParts) as LearnerScorePartKey[]
  ).map((key) => ({
    key,
    label: PART_LABELS[key],
    score: rawParts[key],
    appliedWeight:
      rawParts[key] == null || availableWeight === 0
        ? 0
        : Math.round((PART_WEIGHTS[key] / availableWeight) * 100),
  }));

  if (input.quizAttempts < MIN_QUIZ_ATTEMPTS_FOR_GRADE) {
    return {
      total: null,
      grade: "unrated",
      parts,
      unratedReason: `Үнэлэхэд ${MIN_QUIZ_ATTEMPTS_FOR_GRADE} дасгал шаардлагатай (одоо ${input.quizAttempts}).`,
    };
  }

  if (availableWeight === 0) {
    return {
      total: null,
      grade: "unrated",
      parts,
      unratedReason: "Үнэлэх өгөгдөл алга.",
    };
  }

  const weighted = availableKeys.reduce(
    (sum, key) => sum + (rawParts[key] ?? 0) * PART_WEIGHTS[key],
    0
  );
  const total = Math.round(weighted / availableWeight);

  return {
    total,
    grade: gradeFromScore(total),
    parts,
    unratedReason: null,
  };
}

export type ClassLearnerScoreInput = {
  /** Most recent quiz result for this student, 0–100. */
  quizPercent: number | null;
  /** Share of assigned work completed, 0–100. */
  completionRate: number;
  assignmentsAssigned: number;
  assignmentsCompleted: number;
  /** Null when the teacher cannot read the student's word progress. */
  learnedWords: number | null;
};

/**
 * Grade for a student inside one class.
 *
 * A teacher sees a narrower slice than an admin does — assignment results and
 * the latest quiz, not the learner's whole history — so this scores what the
 * class actually measures rather than pretending the admin inputs are there.
 */
export function computeClassLearnerScore(
  input: ClassLearnerScoreInput
): LearnerScore {
  const classWeights = { quiz: 45, assignments: 40, words: 15 };

  const quizScore =
    input.quizPercent == null ? null : clampPercent(input.quizPercent);
  const assignmentScore =
    input.assignmentsAssigned > 0 ? clampPercent(input.completionRate) : null;
  const wordScore =
    input.learnedWords == null || input.learnedWords <= 0
      ? null
      : ratioScore(input.learnedWords, LEARNED_WORDS_TARGET);

  const entries: { score: number | null; weight: number; label: string; key: LearnerScorePartKey }[] =
    [
      { score: quizScore, weight: classWeights.quiz, label: "Сүүлийн дасгал", key: "quiz" },
      {
        score: assignmentScore,
        weight: classWeights.assignments,
        label: "Даалгаврын гүйцэтгэл",
        key: "lessons",
      },
      { score: wordScore, weight: classWeights.words, label: "Сурсан үг", key: "activity" },
    ];

  const availableWeight = entries
    .filter((entry) => entry.score != null)
    .reduce((sum, entry) => sum + entry.weight, 0);

  const parts: LearnerScorePart[] = entries.map((entry) => ({
    key: entry.key,
    label: entry.label,
    score: entry.score,
    appliedWeight:
      entry.score == null || availableWeight === 0
        ? 0
        : Math.round((entry.weight / availableWeight) * 100),
  }));

  if (input.assignmentsAssigned === 0 && input.quizPercent == null) {
    return {
      total: null,
      grade: "unrated",
      parts,
      unratedReason: "Даалгавар оноогоогүй, дасгал ажиллаагүй байна.",
    };
  }

  if (availableWeight === 0) {
    return {
      total: null,
      grade: "unrated",
      parts,
      unratedReason: "Үнэлэх өгөгдөл алга.",
    };
  }

  const weighted = entries.reduce(
    (sum, entry) => sum + (entry.score ?? 0) * (entry.score == null ? 0 : entry.weight),
    0
  );
  const total = Math.round(weighted / availableWeight);

  return { total, grade: gradeFromScore(total), parts, unratedReason: null };
}

export const LEARNER_GRADE_LABELS: Record<LearnerGradeBucket, string> = {
  A: "A — Маш сайн",
  B: "B — Сайн",
  C: "C — Дунд",
  D: "D — Сул",
  F: "F — Хангалтгүй",
  unrated: "Үнэлэхэд эрт",
};

export const LEARNER_GRADE_RANGES: Record<LearnerGradeBucket, string> = {
  A: "90–100 оноо",
  B: "80–89 оноо",
  C: "70–79 оноо",
  D: "60–69 оноо",
  F: "60-аас доош",
  unrated: `${MIN_QUIZ_ATTEMPTS_FOR_GRADE}-аас цөөн дасгал`,
};

/** Tailwind classes for a grade chip: background, text, ring. */
export const LEARNER_GRADE_TONES: Record<LearnerGradeBucket, string> = {
  A: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  B: "bg-lime-50 text-lime-800 ring-lime-200",
  C: "bg-amber-50 text-amber-900 ring-amber-200",
  D: "bg-orange-50 text-orange-900 ring-orange-200",
  F: "bg-red-50 text-red-800 ring-red-200",
  unrated: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function gradeBucketLabel(bucket: LearnerGradeBucket): string {
  return LEARNER_GRADE_LABELS[bucket];
}

/** Count learners per bucket, in A → F → unrated display order. */
export function summarizeGrades(
  buckets: LearnerGradeBucket[]
): { bucket: LearnerGradeBucket; count: number }[] {
  const counts = new Map<LearnerGradeBucket, number>();
  for (const bucket of buckets) {
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return LEARNER_GRADE_BUCKETS.map((bucket) => ({
    bucket,
    count: counts.get(bucket) ?? 0,
  }));
}
