import { moduleHasContent } from "@/lib/lesson/resolve-hsk-lesson-package";
import {
  resolveExercisePracticeSource,
  type ExercisePracticeSource,
} from "@/lib/lesson/build-exercise-questions";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import type { QuizQuestion } from "@/types/lesson";

export type LessonPathStageId =
  | "goal_warmup"
  | "vocabulary"
  | "text"
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
  "vocabulary",
  "text",
  "grammar",
  "practice",
  "quiz",
  "summary",
];

const MINUTES_BY_STAGE: Record<LessonPathStageId, number> = {
  goal_warmup: 3,
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
  quizQuestions: QuizQuestion[]
): boolean {
  switch (id) {
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
      return moduleHasContent(pkg, "grammar");
    case "practice":
      return resolveExercisePracticeSource(pkg) != null;
    case "quiz":
      return quizQuestions.length > 0;
    case "summary":
      return true;
    default:
      return false;
  }
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
  quizQuestions: QuizQuestion[] = []
): LessonPathPlan {
  const warmupExtras: LessonPathPlan["warmupExtras"] = [];
  if (moduleHasContent(pkg, "dialogues")) warmupExtras.push("dialogues");
  if (moduleHasContent(pkg, "pronunciation")) warmupExtras.push("pronunciation");

  let practiceSource: LessonPathPlan["practiceSource"] =
    resolveExercisePracticeSource(pkg);

  const activeIds = STAGE_ORDER.filter((id) =>
    stageHasContent(id, pkg, quizQuestions)
  );

  const stages: LessonPathStage[] = activeIds.map((id, index) => {
    const def = STAGE_DEFS[id];
    return {
      ...def,
      number: index + 1,
      minutes: MINUTES_BY_STAGE[id],
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
