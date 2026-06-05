import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import { isTextbookContent } from "@/lib/lesson-content-type";
import { inferLessonLanguage } from "@/lib/language-track";
import {
  parseHskStudyContentFromLesson,
  type HskCharacterNote,
} from "@/lib/lesson/hsk-lesson-content";
import { resolveHskLessonPackageFromLesson } from "@/lib/lesson/resolve-hsk-lesson-package";
import type { HskCharacter } from "@/types/hsk-lesson-package";
import type { LessonContent } from "@/types/lesson-content";
import type { GameVocabItem } from "@/lib/games/game-types";
import { toGameVocabItem } from "@/lib/games/game-data-core";

export type GameLabels = {
  matchTitle: string;
  matchDesc: string;
  translateTitle: string;
  translateDesc: string;
  translateBadge: string;
  missingWordTitle: string;
  missingWordDesc: string;
  arrangeTitle: string;
  arrangeDesc: string;
  strokeTitle: string;
  strokeDesc: string;
  targetScriptLabel: string;
  levelLabel: string;
  strokeEmptyMessage: string;
  arrangeEmptyMessage: string;
  missingEmptyMessage: string;
  strokeHint: string;
  radicalTitle: string;
  radicalDesc: string;
  radicalEmptyMessage: string;
  radicalFamilyLabel: string;
};

const CHINESE_LABELS: GameLabels = {
  matchTitle: "Холбох",
  matchDesc: "Хятад үг ↔ орчуулга холбох",
  translateTitle: "Орчуулах",
  translateDesc: "Зөв орчуулгыг сонгож сурах",
  translateBadge: "Хятад → Монгол",
  missingWordTitle: "Дутуу үг",
  missingWordDesc: "Дутуу үгийг бөглөж өгүүлбэр гүйцээ",
  arrangeTitle: "Дараалал",
  arrangeDesc: "Үсгийг зөв дараалалд оруулах",
  strokeTitle: "Дутуу бүрдэл",
  strokeDesc: "Ханзны бүтэц / 偏旁 таних",
  targetScriptLabel: "Хятад",
  levelLabel: "HSK",
  strokeEmptyMessage:
    "Энэ хичээлд ханзны бүтэц тоглоом үүсгэхэд хангалттай өгөгдөл алга.",
  arrangeEmptyMessage: "Энэ тоглоомд example sentence хэрэгтэй.",
  missingEmptyMessage:
    "Энэ тоглоомд example sentence хэрэгтэй. Үг бүрт жишээ өгүүлбэр нэмэгдсэн эсэхийг шалгана уу.",
  strokeHint: "偏旁 / зураасны дараалал — ханзны бүтэц таних",
  radicalTitle: "Үндэс · бүрдэл",
  radicalDesc: "偏旁-ийн утга тааруулж, ханз бүрдэх",
  radicalEmptyMessage:
    "Энэ хичээлд components бүхий ханз байхгүй байна (characters.json).",
  radicalFamilyLabel: "Үндэстэй ханзын бүлэг",
};

const KOREAN_LABELS: GameLabels = {
  matchTitle: "Үсэг таних",
  matchDesc: "Солонгос үг ↔ орчуулга холбох",
  translateTitle: "Утга сонгох",
  translateDesc: "Зөв утга / авиаг сонго",
  translateBadge: "Солонгос → Монгол",
  missingWordTitle: "Дутуу үсэг",
  missingWordDesc: "Дутуу үсэг, үгийг бөглө",
  arrangeTitle: "Үе/үг эвлүүлэх",
  arrangeDesc: "Солонгос үе, үгийг зөв эвлүүл",
  strokeTitle: "Үсэг бүтээх",
  strokeDesc: "Хангыль үсэг бүтээх дасгал",
  targetScriptLabel: "Солонгос",
  levelLabel: "Солонгос",
  strokeEmptyMessage: "Энэ хичээлд үсэг бүтээх дасгал үүсгэхэд хангалттай өгөгдөл алга.",
  arrangeEmptyMessage: "Энэ хичээлд үе/үг эвлүүлэх дасгал үүсгэхэд хангалттай үг алга.",
  missingEmptyMessage: "Энэ хичээлд дутуу үсэг/үг дасгал үүсгэхэд хангалттай үг алга.",
  strokeHint: "Хангыль үсэг бүтээх — дутуу хэсгийг сонго",
  radicalTitle: "Үндэс · бүрдэл",
  radicalDesc: "偏旁-ийн утга тааруулж, ханз бүрдэх",
  radicalEmptyMessage: "Энэ хичээлд ханзны бүрдэл тоглоом үүсгэхэд хангалттай өгөгдөл алга.",
  radicalFamilyLabel: "Үндэстэй ханзын бүлэг",
};

const KOREAN_PRELESSON_LABELS: GameLabels = {
  ...KOREAN_LABELS,
  matchTitle: "Үсэг таних",
  translateTitle: "Авиа сонгох",
  translateDesc: "Эгшиг, авианы зөв утгыг сонго",
  arrangeTitle: "Үе бүтээх",
  arrangeDesc: "Солонгос үе, үгийг зөв бүтээ",
  missingWordTitle: "Дутуу үсэг",
  strokeTitle: "Үсэг бүтээх",
};

export type GameLessonContext = {
  vocabulary: GameVocabItem[];
  courseId: string;
  language?: string;
  isKorean: boolean;
  isPrelesson: boolean;
  isTextbook: boolean;
  labels: GameLabels;
  hskCharacterNotes: HskCharacterNote[];
  lessonCharacters: HskCharacter[];
};

export function resolveGameLabels(
  isKorean: boolean,
  isPrelesson: boolean
): GameLabels {
  if (!isKorean) return CHINESE_LABELS;
  if (isPrelesson) return KOREAN_PRELESSON_LABELS;
  return KOREAN_LABELS;
}

export function buildGameLessonContext(lesson: LessonContent): GameLessonContext {
  const isKorean = inferLessonLanguage(lesson) === "ko";
  const isPrelesson = isPrelessonPackage(lesson);
  const isTextbook = isTextbookContent(lesson);
  const hskStudy =
    lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);

  const lessonPackage = resolveHskLessonPackageFromLesson(lesson);

  return {
    vocabulary: lesson.vocabulary.map(toGameVocabItem),
    courseId: lesson.courseId,
    language: lesson.language,
    isKorean,
    isPrelesson,
    isTextbook,
    labels: resolveGameLabels(isKorean, isPrelesson),
    hskCharacterNotes: hskStudy.characterNotes,
    lessonCharacters: lessonPackage?.characters?.characters ?? [],
  };
}

const PRELESSON_ID_PATTERN = /PRELESSON|K-PRE-|KR-L1-PRE/i;

export function isPrelessonLessonId(lessonId: string): boolean {
  return PRELESSON_ID_PATTERN.test(lessonId);
}

export type GameLinkSlug =
  | "match"
  | "translate"
  | "missing-word"
  | "arrange"
  | "stroke"
  | "radical";

export function defaultGameLinksForContext(
  context: Pick<GameLessonContext, "isKorean" | "isPrelesson">
): GameLinkSlug[] {
  if (context.isKorean && context.isPrelesson) {
    return ["match", "translate", "arrange", "missing-word", "stroke"];
  }
  if (context.isKorean) {
    return ["match", "translate", "missing-word", "arrange", "stroke"];
  }
  return [
    "match",
    "translate",
    "missing-word",
    "arrange",
    "stroke",
    "radical",
  ];
}

export function gameLinkLabel(
  slug: GameLinkSlug,
  labels: GameLabels
): string {
  switch (slug) {
    case "match":
      return labels.matchTitle;
    case "translate":
      return labels.translateTitle;
    case "missing-word":
      return labels.missingWordTitle;
    case "arrange":
      return labels.arrangeTitle;
    case "stroke":
      return labels.strokeTitle;
    case "radical":
      return labels.radicalTitle;
  }
}

export function emptyGameLessonContext(): GameLessonContext {
  return {
    vocabulary: [],
    courseId: "",
    isKorean: false,
    isPrelesson: false,
    isTextbook: false,
    labels: CHINESE_LABELS,
    hskCharacterNotes: [],
    lessonCharacters: [],
  };
}
