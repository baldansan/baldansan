import { orderedSkillsForTest } from "@/lib/mock-test/section-timing";
import type {
  MockTestQuestionRow,
  MockTestRow,
  MockTestScoreResult,
} from "@/lib/mock-test/types";

export type WritingSelfGrade = "none" | "half" | "full";

export type HskScoreBreakdown = {
  maxTotal: number;
  passThreshold: number;
  totalScore: number;
  passed: boolean;
  sectionScores: Record<string, number | null>;
  sectionMax: Record<string, number>;
  writingGraded: boolean;
  writingPending: boolean;
};

export function hskMaxTotal(hskLevel: number): number {
  return hskLevel <= 2 ? 200 : 300;
}

export function hskPassThreshold(hskLevel: number): number {
  return hskLevel <= 2 ? 120 : 180;
}

function sectionRawTotals(
  questions: MockTestQuestionRow[],
  details: MockTestScoreResult["details"]
): Record<string, { earned: number; max: number; manual: number }> {
  const detailByQno = new Map(details.map((detail) => [detail.qNo, detail]));
  const totals: Record<string, { earned: number; max: number; manual: number }> =
    {};

  for (const question of questions) {
    const skill = question.skill;
    if (!totals[skill]) {
      totals[skill] = { earned: 0, max: 0, manual: 0 };
    }
    const pts = Number(question.points) || 1;
    const detail = detailByQno.get(question.q_no);
    if (detail?.autograde === "manual") {
      totals[skill].manual += pts;
      continue;
    }
    totals[skill].max += pts;
    if (detail?.isCorrect) {
      totals[skill].earned += pts;
    }
  }

  return totals;
}

export function sectionScoreToHundred(earned: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((earned / max) * 100);
}

export function manualWritingQuestions(
  questions: MockTestQuestionRow[]
): MockTestQuestionRow[] {
  return questions.filter(
    (question) =>
      question.skill === "writing" && question.autograde === "manual"
  );
}

export function computeHskScoreBreakdown(
  test: MockTestRow,
  questions: MockTestQuestionRow[],
  result: MockTestScoreResult,
  writingGrades: Record<number, WritingSelfGrade> = {}
): HskScoreBreakdown {
  const skills = orderedSkillsForTest(test);
  const raw = sectionRawTotals(questions, result.details);
  const sectionScores: Record<string, number | null> = {};
  const sectionMax: Record<string, number> = {};
  let writingGraded = true;
  let writingPending = false;

  for (const skill of skills) {
    sectionMax[skill] = 100;
    const bucket = raw[skill] ?? { earned: 0, max: 0, manual: 0 };

    if (bucket.manual > 0 && skill === "writing") {
      const manualQs = manualWritingQuestions(questions);
      let manualEarned = 0;
      let manualMax = 0;
      let anyUngraded = false;

      for (const question of manualQs) {
        const pts = Number(question.points) || 1;
        manualMax += pts;
        const grade = writingGrades[question.q_no] ?? "none";
        if (grade === "none") {
          anyUngraded = true;
          continue;
        }
        if (grade === "full") manualEarned += pts;
        if (grade === "half") manualEarned += pts * 0.5;
      }

      if (anyUngraded && manualQs.length > 0) {
        sectionScores[skill] = null;
        writingGraded = false;
        writingPending = true;
      } else {
        const autoEarned = bucket.earned;
        const autoMax = bucket.max;
        const totalEarned = autoEarned + manualEarned;
        const totalMax = autoMax + manualMax;
        sectionScores[skill] = sectionScoreToHundred(totalEarned, totalMax);
      }
      continue;
    }

    if (bucket.max <= 0 && bucket.manual <= 0) {
      sectionScores[skill] = null;
      continue;
    }

    sectionScores[skill] = sectionScoreToHundred(bucket.earned, bucket.max);
  }

  const scoredSections = skills.filter(
    (skill) => sectionScores[skill] != null
  );
  const totalScore = scoredSections.reduce(
    (sum, skill) => sum + (sectionScores[skill] ?? 0),
    0
  );
  const maxTotal = hskMaxTotal(test.hsk_level);
  const passThreshold = hskPassThreshold(test.hsk_level);
  const countedTotal = writingPending
    ? scoredSections
        .filter((skill) => skill !== "writing")
        .reduce((sum, skill) => sum + (sectionScores[skill] ?? 0), 0)
    : totalScore;
  const passed = !writingPending && countedTotal >= passThreshold;

  return {
    maxTotal,
    passThreshold,
    totalScore: writingPending ? countedTotal : totalScore,
    passed,
    sectionScores,
    sectionMax,
    writingGraded,
    writingPending,
  };
}

export type HskAttemptScoreMetadata = {
  hsk_total: number;
  hsk_max: number;
  pass_threshold: number;
  passed: boolean;
  section_scores: Record<string, number | null>;
  writing_graded: boolean;
  writing_self_grades?: Record<string, WritingSelfGrade>;
};

export function toAttemptScoreMetadata(
  breakdown: HskScoreBreakdown,
  writingGrades: Record<number, WritingSelfGrade>
): HskAttemptScoreMetadata {
  return {
    hsk_total: breakdown.totalScore,
    hsk_max: breakdown.maxTotal,
    pass_threshold: breakdown.passThreshold,
    passed: breakdown.passed,
    section_scores: breakdown.sectionScores,
    writing_graded: breakdown.writingGraded,
    writing_self_grades: Object.fromEntries(
      Object.entries(writingGrades).map(([qNo, grade]) => [String(qNo), grade])
    ),
  };
}
