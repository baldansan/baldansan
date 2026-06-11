import type {
  MockTestAnswers,
  MockTestQuestionRow,
  MockTestScoreResult,
} from "@/lib/mock-test/types";

function normalizeStrict(value: string): string {
  return value
    .trim()
    .replace(/[\s.,，。、；;：:！!？?"""''「」『』]/g, "");
}

function normalizeJudge(value: string): "√" | "×" {
  const v = value.trim();
  if (v === "√" || v === "true" || v === "T" || v === "1") return "√";
  return "×";
}

export function gradeQuestion(
  question: MockTestQuestionRow,
  userAnswer: string | null
): boolean | null {
  if (question.autograde === "manual") return null;
  const correct = question.correct_answer;
  if (!correct) return null;

  const user = (userAnswer ?? "").trim();
  if (!user) return false;

  if (question.q_type === "judge") {
    return normalizeJudge(user) === normalizeJudge(correct);
  }

  if (question.q_type === "order") {
    const u = user.toUpperCase().replace(/[^A-F]/g, "");
    const c = correct.toUpperCase().replace(/[^A-F]/g, "");
    return u === c;
  }

  if (
    question.autograde === "strict" ||
    question.q_type === "complete" ||
    question.q_type === "fill_char"
  ) {
    return normalizeStrict(user) === normalizeStrict(correct);
  }

  return user.toUpperCase() === correct.trim().toUpperCase();
}

export function scoreMockTestAttempt(
  questions: MockTestQuestionRow[],
  answers: MockTestAnswers
): MockTestScoreResult {
  const scoreBySkill: Record<string, number> = {};
  const maxBySkill: Record<string, number> = {};
  let rawScore = 0;
  let maxScore = 0;
  let gradedCount = 0;
  let manualCount = 0;

  const details = questions.map((q) => {
    const key = String(q.q_no);
    const userAnswer = answers[key] ?? null;
    const pts = Number(q.points) || 1;
    const isCorrect = gradeQuestion(q, userAnswer);

    if (isCorrect === null) {
      manualCount += 1;
      return {
        qNo: q.q_no,
        questionId: q.id,
        skill: q.skill,
        qType: q.q_type,
        userAnswer,
        correctAnswer: q.correct_answer,
        isCorrect: null,
        points: pts,
        autograde: q.autograde,
        explanationMn: q.explanation_mn,
      };
    }

    maxBySkill[q.skill] = (maxBySkill[q.skill] ?? 0) + pts;
    maxScore += pts;
    gradedCount += 1;

    if (isCorrect) {
      rawScore += pts;
      scoreBySkill[q.skill] = (scoreBySkill[q.skill] ?? 0) + pts;
    } else {
      scoreBySkill[q.skill] = scoreBySkill[q.skill] ?? 0;
    }

    return {
      qNo: q.q_no,
      questionId: q.id,
      skill: q.skill,
      qType: q.q_type,
      userAnswer,
      correctAnswer: q.correct_answer,
      isCorrect,
      points: pts,
      autograde: q.autograde,
      explanationMn: q.explanation_mn,
    };
  });

  return {
    rawScore,
    maxScore,
    scoreBySkill,
    maxBySkill,
    gradedCount,
    manualCount,
    details,
  };
}

/** Rebuild result view from saved user_question_responses (past attempts). */
export function scoreResultFromSavedResponses(
  questions: MockTestQuestionRow[],
  responses: Array<{
    question_id: string;
    user_answer: string | null;
    is_correct: boolean | null;
  }>
): MockTestScoreResult {
  const responseByQuestion = new Map(
    responses.map((response) => [response.question_id, response])
  );

  const scoreBySkill: Record<string, number> = {};
  const maxBySkill: Record<string, number> = {};
  let rawScore = 0;
  let maxScore = 0;
  let gradedCount = 0;
  let manualCount = 0;

  const details = questions.map((q) => {
    const saved = responseByQuestion.get(q.id);
    const userAnswer = saved?.user_answer ?? null;
    const pts = Number(q.points) || 1;
    const isCorrect =
      saved?.is_correct !== undefined && saved?.is_correct !== null
        ? saved.is_correct
        : gradeQuestion(q, userAnswer);

    if (isCorrect === null) {
      manualCount += 1;
      return {
        qNo: q.q_no,
        questionId: q.id,
        skill: q.skill,
        qType: q.q_type,
        userAnswer,
        correctAnswer: q.correct_answer,
        isCorrect: null,
        points: pts,
        autograde: q.autograde,
        explanationMn: q.explanation_mn,
      };
    }

    maxBySkill[q.skill] = (maxBySkill[q.skill] ?? 0) + pts;
    maxScore += pts;
    gradedCount += 1;

    if (isCorrect) {
      rawScore += pts;
      scoreBySkill[q.skill] = (scoreBySkill[q.skill] ?? 0) + pts;
    } else {
      scoreBySkill[q.skill] = scoreBySkill[q.skill] ?? 0;
    }

    return {
      qNo: q.q_no,
      questionId: q.id,
      skill: q.skill,
      qType: q.q_type,
      userAnswer,
      correctAnswer: q.correct_answer,
      isCorrect,
      points: pts,
      autograde: q.autograde,
      explanationMn: q.explanation_mn,
    };
  });

  return {
    rawScore,
    maxScore,
    scoreBySkill,
    maxBySkill,
    gradedCount,
    manualCount,
    details,
  };
}
