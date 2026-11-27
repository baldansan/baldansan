import { moduleHasContent } from "@/lib/lesson/resolve-hsk-lesson-package";
import {
  resolveExercisePracticeSource,
  type ExercisePracticeSource,
} from "@/lib/lesson/build-exercise-questions";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import type { QuizQuestion } from "@/types/lesson";
import type { TemeeLessonMeta } from "@/types/temee-lesson";

export type LessonPathStageId =
  | "goal_warmup"
  | "temee"
  | "vocabulary"
  | "text"
  | "sounds"
  | "grammar"
  | "practice"
  | "quiz"
  | "summary";

export type LessonPathStage = {
  id: LessonPathStageId;
  /** 1-based display number within this lesson path */
  number: number;
  icon: string;
  label: string;
  hint: string;
  minutes: number;
};

const STAGE_DEFS: Record<
  LessonPathStageId,
  Omit<LessonPathStage, "number" | "minutes">
> = {
  goal_warmup: {
    id: "goal_warmup",
    icon: "🎯",
    label: "Зорилго ба халаалт",
    hint: "Энэ хичээл юу өгөх вэ",
  },
  temee: {
    id: "temee",
    icon: "🐫",
    label: "Тэмээ багшийн хичээл",
    hint: "Алхам алхмаар тайлбар",
  },
  sounds: {
    id: "sounds",
    icon: "👂",
    label: "Авианы дасгал",
    hint: "Сонсож, дагаж хэлэх",
  },
  vocabulary: {
    id: "vocabulary",
    icon: "📚",
    label: "Шинэ үгс",
    hint: "Үг цээжлэх",
  },
  text: {
    id: "text",
    icon: "📖",
    label: "Эх бичвэр",
    hint: "Богино эх унших",
  },
  grammar: {
    id: "grammar",
    icon: "📐",
    label: "Дүрэм",
    hint: "Бүтэц, тайлбар",
  },
  practice: {
    id: "practice",
    icon: "✏️",
    label: "Дасгал",
    hint: "Дасгал хийх",
  },
  quiz: {
    id: "quiz",
    icon: "🧩",
    label: "Сорил",
    hint: "Мэдлэгээ шалгах",
  },
  summary: {
    id: "summary",
    icon: "✨",
    label: "Дүгнэлт",
    hint: "Өнөөдрийн олз",
  },
};

const STAGE_ORDER: LessonPathStageId[] = [
  "goal_warmup",
  "temee",
  "vocabulary",
  "text",
  "sounds",
  "grammar",
  "practice",
  "quiz",
  "summary",
];

const MINUTES_BY_STAGE: Record<LessonPathStageId, number> = {
  goal_warmup: 3,
  temee: 12,
  sounds: 10,
  vocabulary: 5,
  text: 5,
  grammar: 4,
  practice: 5,
  quiz: 4,
  summary: 3,
};

function stageHasContent(
  id: LessonPathStageId,
  pkg: HskLessonPackage,
  quizQuestions: QuizQuestion[],
  temee: TemeeLessonMeta | null
): boolean {
  switch (id) {
    case "temee":
      return temee != null;
    case "sounds":
      return temee?.hasSounds === true;
    case "goal_warmup":
      return moduleHasContent(pkg, "hook");
    case "vocabulary":
      return (
        moduleHasContent(pkg, "vocabulary") ||
        moduleHasContent(pkg, "characters")
      );
    case "text":
      return moduleHasContent(pkg, "texts");
    case "grammar":
      // Тэмээ багшийн хичээл хуучин «Дүрэм» үеийг орлож байвал давхар гаргахгүй.
      if (temee?.replacesGrammar) return false;
      return moduleHasContent(pkg, "grammar");
    case "practice":
      if (temee?.hasPractice) return true;
      return resolveExercisePracticeSource(pkg) != null;
    case "quiz":
      return quizQuestions.length > 0;
    case "summary":
      return true;
    default:
      return false;
  }
}

/**
 * Стандарт дараалал (нэр, дүрс) — хичээлийн нүүрэнд замыг багцгүйгээр харуулахад.
 * Тэмээ багшийн хичээлтэй бол түүний үеүүд орж, орлогдсон «Дүрэм» хасагдана.
 */
export function standardLessonPathStages(
  temee: TemeeLessonMeta | null = null
): { id: LessonPathStageId; label: string; hint: string }[] {
  return STAGE_ORDER.filter((id) => {
    if (id === "temee") return temee != null;
    if (id === "sounds") return temee?.hasSounds === true;
    if (id === "grammar") return !temee?.replacesGrammar;
    return true;
  }).map((id) => ({
    id,
    label:
      id === "temee" && temee
        ? temee.teachLabel
        : id === "sounds" && temee?.soundsLabel
          ? temee.soundsLabel
          : STAGE_DEFS[id].label,
    hint: STAGE_DEFS[id].hint,
  }));
}

export type LessonPathPlan = {
  stages: LessonPathStage[];
  totalMinutes: number;
  /** Extra modules folded into stage 1 (dialogues, pronunciation) */
  warmupExtras: ("dialogues" | "pronunciation")[];
  /** Exercise source for stage 5 */
  practiceSource: ExercisePracticeSource | null;
};

export function buildLessonPathPlan(
  pkg: HskLessonPackage,
  quizQuestions: QuizQuestion[] = [],
  temee: TemeeLessonMeta | null = null
): LessonPathPlan {
  const warmupExtras: LessonPathPlan["warmupExtras"] = [];
  if (moduleHasContent(pkg, "dialogues")) warmupExtras.push("dialogues");
  if (moduleHasContent(pkg, "pronunciation")) warmupExtras.push("pronunciation");

  let practiceSource: LessonPathPlan["practiceSource"] =
    resolveExercisePracticeSource(pkg);

  const activeIds = STAGE_ORDER.filter((id) =>
    stageHasContent(id, pkg, quizQuestions, temee)
  );

  const stages: LessonPathStage[] = activeIds.map((id, index) => {
    const def = STAGE_DEFS[id];
    const label =
      id === "temee" && temee
        ? temee.teachLabel
        : id === "sounds" && temee?.soundsLabel
          ? temee.soundsLabel
          : def.label;
    const minutes =
      id === "temee" && temee?.teachMinutes
        ? temee.teachMinutes
        : id === "sounds" && temee?.soundsMinutes
          ? temee.soundsMinutes
          : MINUTES_BY_STAGE[id];
    return {
      ...def,
      label,
      number: index + 1,
      minutes,
    };
  });

  const totalMinutes = stages.reduce((sum, s) => sum + s.minutes, 0);

  return { stages, totalMinutes, warmupExtras, practiceSource };
}

export function formatPathProgress(completedCount: number, total: number): string {
  return `${completedCount}/${total} үе`;
}

export function formatPathDuration(minutes: number): string {
  return `~${minutes} мин`;
}
