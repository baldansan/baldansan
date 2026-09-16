/**
 * «Миний сул тал» — суралцагчийн өөрийнх нь question_attempts мөрүүдээс
 * ЯМАР ХЭСЭГТ хэр алдаж байгааг тооцох цэвэр логик (I/O-гүй, тестлэхэд хялбар).
 *
 * ДҮРЭМ: энд тоо зохиохгүй. Мөр байхгүй бол 0 биш, «мэдээлэл алга» гэж
 * буцаана — дэлгэц дээр «—» болж харагдана.
 */

/**
 * Дүрмийн хичээлүүд lesson_id-гаараа ялгагдана.
 * Эх сурвалж: HSK30_DUREM_COURSE_ID (lib/hsk30-durem/load-course.ts),
 * HELZUI_COURSE_ID (lib/helzui/load-course.ts).
 * Тэднийг шууд импортлобол том JSON клиент багцад орох тул энд хуулав.
 */
export const HSK30_LESSON_ID = "hsk30-durem";
export const HELZUI_LESSON_ID = "helzui-suuri";

export type WeakSpotArea =
  | "grammar"
  | "lesson_exercise"
  | "word_practice"
  | "exam"
  | "mistake_review"
  | "other";

export const WEAK_SPOT_AREA_LABELS: Record<WeakSpotArea, string> = {
  grammar: "Дүрэм",
  lesson_exercise: "Хичээлийн дасгал",
  word_practice: "Үгийн дасгал",
  exam: "Шалгалт",
  mistake_review: "Алдааны давталт",
  other: "Бусад",
};

export const WEAK_SPOT_AREA_ICONS: Record<WeakSpotArea, string> = {
  grammar: "🧩",
  lesson_exercise: "✏️",
  word_practice: "💡",
  exam: "📝",
  mistake_review: "🔁",
  other: "📌",
};

/**
 * Дүгнэлт гаргахад тооцох хэсгүүд.
 * mistake_review-г оруулахгүй — тэнд зориуд алдсан асуултаа давтдаг тул
 * нарийвчлал нь бусадтай харьцуулагдахгүй. other мөн адил (тодорхойгүй).
 */
export const VERDICT_AREAS: WeakSpotArea[] = [
  "grammar",
  "lesson_exercise",
  "word_practice",
  "exam",
];

/** Дүгнэлт гаргахад шаардагдах хамгийн бага хариултын тоо. */
export const MIN_TOTAL_ATTEMPTS = 10;
/** Нэг хэсгийг «хамгийн сул» гэж нэрлэхэд шаардагдах хамгийн бага хариулт. */
export const MIN_AREA_ATTEMPTS = 5;

export type WeakSpotAttempt = {
  lessonId: string;
  stage: string;
  questionId: string;
  questionType: string;
  isCorrect: boolean;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  createdAt: string;
};

/**
 * lesson_id + stage-аас хэсгийг тодорхойлно.
 * Тайлбар: `order` stage нь хичээлийн «дараалал» дасгал болон quiz дотрох
 * өгүүлбэр эвлүүлэх асуултын аль алинд бичигддэг тул дасгалд тооцов.
 */
export function resolveWeakSpotArea(
  lessonId: string,
  stage: string
): WeakSpotArea {
  if (lessonId === HSK30_LESSON_ID || lessonId === HELZUI_LESSON_ID) {
    return "grammar";
  }
  switch (stage) {
    case "grammar":
    // subject / predicate нь «Өгүүлбэрийн бүтэц» модулийн нэрс — дүрэм.
    case "subject":
    case "predicate":
      return "grammar";
    case "grammar_exercise":
    case "order":
      return "lesson_exercise";
    case "word_practice":
      return "word_practice";
    case "quiz":
    case "mock_exam":
      return "exam";
    case "mistake_review":
      return "mistake_review";
    default:
      return "other";
  }
}

/** Өөрийгөө үнэлэх (self_*) мөрүүд асуулт-хариулт биш — тооцохгүй. */
export function isGradedAttempt(attempt: WeakSpotAttempt): boolean {
  return !attempt.selectedAnswer?.startsWith("self_");
}

export type AreaStat = {
  area: WeakSpotArea;
  total: number;
  wrong: number;
  /** Зөв хариултын хувь. total === 0 үед null (0 биш). */
  accuracyPct: number | null;
};

export type LessonStat = {
  lessonId: string;
  total: number;
  wrong: number;
  accuracyPct: number | null;
  lastWrongAt: string | null;
};

export type GrammarStat = {
  /** lessonId|stage — давхцахгүй түлхүүр */
  key: string;
  lessonId: string;
  stage: string;
  total: number;
  wrong: number;
  accuracyPct: number | null;
  lastWrongAt: string | null;
};

function accuracy(total: number, wrong: number): number | null {
  if (total <= 0) return null;
  return Math.round(((total - wrong) / total) * 100);
}

function laterIso(a: string | null, b: string): string {
  if (!a) return b;
  return new Date(b).getTime() > new Date(a).getTime() ? b : a;
}

/** Хэсэг бүрийн нийт/буруу тоо. Мөр огт байхгүй хэсэг жагсаалтад орохгүй. */
export function buildAreaStats(attempts: WeakSpotAttempt[]): AreaStat[] {
  const byArea = new Map<WeakSpotArea, { total: number; wrong: number }>();

  for (const attempt of attempts) {
    const area = resolveWeakSpotArea(attempt.lessonId, attempt.stage);
    const row = byArea.get(area) ?? { total: 0, wrong: 0 };
    row.total += 1;
    if (!attempt.isCorrect) row.wrong += 1;
    byArea.set(area, row);
  }

  return [...byArea.entries()]
    .map(([area, row]) => ({
      area,
      total: row.total,
      wrong: row.wrong,
      accuracyPct: accuracy(row.total, row.wrong),
    }))
    .sort((a, b) => b.wrong - a.wrong || b.total - a.total);
}

/** Хамгийн олон алдсан хичээлүүд (алдаагүй хичээл жагсаалтад орохгүй). */
export function buildLessonStats(
  attempts: WeakSpotAttempt[],
  limit = 6
): LessonStat[] {
  const byLesson = new Map<
    string,
    { total: number; wrong: number; lastWrongAt: string | null }
  >();

  for (const attempt of attempts) {
    const row =
      byLesson.get(attempt.lessonId) ?? {
        total: 0,
        wrong: 0,
        lastWrongAt: null,
      };
    row.total += 1;
    if (!attempt.isCorrect) {
      row.wrong += 1;
      row.lastWrongAt = laterIso(row.lastWrongAt, attempt.createdAt);
    }
    byLesson.set(attempt.lessonId, row);
  }

  return [...byLesson.entries()]
    .filter(([, row]) => row.wrong > 0)
    .map(([lessonId, row]) => ({
      lessonId,
      total: row.total,
      wrong: row.wrong,
      accuracyPct: accuracy(row.total, row.wrong),
      lastWrongAt: row.lastWrongAt,
    }))
    .sort((a, b) => b.wrong - a.wrong || (a.accuracyPct ?? 100) - (b.accuracyPct ?? 100))
    .slice(0, limit);
}

/**
 * Дүрмийн хэсгийн алдаа — дүрмийн цэг/модуль бүрээр.
 * hsk30-durem: stage = levelId, helzui-suuri: stage = moduleId,
 * жирийн хичээл: stage = "grammar" → хичээлээрээ группэлнэ.
 */
export function buildGrammarStats(
  attempts: WeakSpotAttempt[],
  limit = 6
): GrammarStat[] {
  const byKey = new Map<
    string,
    {
      lessonId: string;
      stage: string;
      total: number;
      wrong: number;
      lastWrongAt: string | null;
    }
  >();

  for (const attempt of attempts) {
    if (resolveWeakSpotArea(attempt.lessonId, attempt.stage) !== "grammar") {
      continue;
    }
    const key = `${attempt.lessonId}|${attempt.stage}`;
    const row =
      byKey.get(key) ?? {
        lessonId: attempt.lessonId,
        stage: attempt.stage,
        total: 0,
        wrong: 0,
        lastWrongAt: null,
      };
    row.total += 1;
    if (!attempt.isCorrect) {
      row.wrong += 1;
      row.lastWrongAt = laterIso(row.lastWrongAt, attempt.createdAt);
    }
    byKey.set(key, row);
  }

  return [...byKey.entries()]
    .filter(([, row]) => row.wrong > 0)
    .map(([key, row]) => ({
      key,
      lessonId: row.lessonId,
      stage: row.stage,
      total: row.total,
      wrong: row.wrong,
      accuracyPct: accuracy(row.total, row.wrong),
      lastWrongAt: row.lastWrongAt,
    }))
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, limit);
}

export type WeakSpotVerdict =
  | { kind: "no_data" }
  /** Мөр бий ч дүгнэлт гаргахад хангалтгүй. */
  | { kind: "too_little"; total: number }
  /** Хангалттай мөр бий, гэхдээ алдаа алга. */
  | { kind: "clean"; total: number }
  | {
      kind: "weakest";
      area: WeakSpotArea;
      wrong: number;
      total: number;
      accuracyPct: number;
      /** Дараагийн хамгийн сул хэсгээс хэдэн пунктээр доогуур вэ (ганцхан хэсэгтэй бол null). */
      gapPct: number | null;
    };

/**
 * Тоон дүн дээр үндэслэсэн богино дүгнэлт.
 * Магтаал зохиохгүй — мэдээлэл дутвал шууд «хангалтгүй» гэж хэлнэ.
 */
export function buildVerdict(areaStats: AreaStat[]): WeakSpotVerdict {
  const total = areaStats.reduce((sum, row) => sum + row.total, 0);
  if (total === 0) return { kind: "no_data" };

  const wrongTotal = areaStats.reduce((sum, row) => sum + row.wrong, 0);
  if (total < MIN_TOTAL_ATTEMPTS) return { kind: "too_little", total };
  if (wrongTotal === 0) return { kind: "clean", total };

  const eligible = areaStats
    .filter(
      (row) =>
        VERDICT_AREAS.includes(row.area) &&
        row.total >= MIN_AREA_ATTEMPTS &&
        row.accuracyPct != null
    )
    .sort(
      (a, b) =>
        (a.accuracyPct as number) - (b.accuracyPct as number) ||
        b.wrong - a.wrong
    );

  if (eligible.length === 0) return { kind: "too_little", total };

  const weakest = eligible[0]!;
  const next = eligible[1];
  return {
    kind: "weakest",
    area: weakest.area,
    wrong: weakest.wrong,
    total: weakest.total,
    accuracyPct: weakest.accuracyPct as number,
    gapPct:
      next?.accuracyPct != null
        ? (next.accuracyPct as number) - (weakest.accuracyPct as number)
        : null,
  };
}

/* ---------- Алдсан үгсийн нэр дэвшигч ---------- */

export type MissedWordCandidate = {
  /** hsk_words-оос хайх текст (ханз / пиньинь / монгол утга) */
  text: string;
  wrongCount: number;
  lastWrongAt: string;
  fromWordPractice: boolean;
  fromQuiz: boolean;
};

/** Хэт урт хариулт (өгүүлбэр) үг байх магадлал багатай. */
const MAX_WORD_ANSWER_LENGTH = 40;

function addCandidate(
  map: Map<string, MissedWordCandidate>,
  text: string | null | undefined,
  at: string,
  source: "quiz" | "word_practice"
): void {
  const value = (text ?? "").trim();
  if (!value || value.length > MAX_WORD_ANSWER_LENGTH) return;
  const existing = map.get(value);
  if (existing) {
    existing.wrongCount += 1;
    existing.lastWrongAt = laterIso(existing.lastWrongAt, at);
    if (source === "quiz") existing.fromQuiz = true;
    else existing.fromWordPractice = true;
    return;
  }
  map.set(value, {
    text: value,
    wrongCount: 1,
    lastWrongAt: at,
    fromWordPractice: source === "word_practice",
    fromQuiz: source === "quiz",
  });
}

export type QuizWrongAnswer = {
  correctAnswer: string;
  createdAt: string;
};

/**
 * Үгийн дасгалын буруу хариулт + quiz-ийн answers JSON-оос үгийн нэр дэвшигч
 * цуглуулна. Аль нь жинхэнэ үг байсныг hsk_words-оос хайж баталгаажуулна
 * (энэ функц зөвхөн нэр дэвшигчийг цуглуулна).
 */
export function collectMissedWordCandidates(
  attempts: WeakSpotAttempt[],
  quizWrongAnswers: QuizWrongAnswer[]
): MissedWordCandidate[] {
  const map = new Map<string, MissedWordCandidate>();

  for (const attempt of attempts) {
    if (attempt.isCorrect) continue;
    if (attempt.stage !== "word_practice") continue;
    addCandidate(map, attempt.correctAnswer, attempt.createdAt, "word_practice");
  }

  for (const answer of quizWrongAnswers) {
    addCandidate(map, answer.correctAnswer, answer.createdAt, "quiz");
  }

  return [...map.values()].sort(
    (a, b) =>
      b.wrongCount - a.wrongCount ||
      new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime()
  );
}
