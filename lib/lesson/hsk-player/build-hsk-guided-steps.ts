import {
  parseHskGuidedSteps,
  type HskGuidedStep,
  type HskGuidedStepKind,
} from "@/lib/lesson/hsk-guided-step";
import { buildHskPlayerContent } from "@/lib/lesson/hsk-player/build-hsk-player-content";
import type { LessonContent } from "@/types/lesson-content";

export type HskPlayerStepPlan = {
  steps: HskGuidedStep[];
  totalSteps: number;
  usesPackageSteps: boolean;
};

const FALLBACK_STEP_TYPES = [
  "teacher-intro",
  "key-phrase",
  "pinyin",
  "tones",
  "vocabulary",
  "dialogue",
  "practice-menu",
  "complete",
] as const;

function buildFallbackStepsFromPlayerContent(
  lesson: LessonContent,
  content: ReturnType<typeof buildHskPlayerContent>
): HskGuidedStep[] {
  return [
    {
      id: "teacher-intro",
      type: "teacher-intro",
      titleMn: "Багшийн тайлбар",
      teacherSpeechMn: content.teacherTip,
      bulletsMn: content.introBullets,
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      mediaSection: "teacher",
      items: [],
    },
    {
      id: "key-phrase",
      type: "key-phrase",
      titleMn: "Гол хэллэг",
      teacherSpeechMn: "",
      bulletsMn: [content.keyPhrase.usage],
      chinese: content.keyPhrase.chinese,
      pinyin: content.keyPhrase.pinyin,
      mongolian: content.keyPhrase.mongolian,
      examples: content.keyPhrase.breakdown
        ? [{ label: content.keyPhrase.breakdown }]
        : [],
      mediaSection: "hero",
      items: [],
    },
    {
      id: "pinyin",
      type: "pinyin",
      titleMn: "Pinyin",
      teacherSpeechMn: "",
      bulletsMn: content.pinyinExplainer,
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: content.pinyinRows.map((row) => ({
        chinese: row.chinese,
        pinyin: row.pinyin,
        mongolian: row.hint,
      })),
      mediaSection: "pinyin",
      items: [],
    },
    {
      id: "tones",
      type: "tones",
      titleMn: "Tone дасгал",
      teacherSpeechMn: content.toneNote,
      bulletsMn: content.toneWarning ? [content.toneWarning] : [],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: content.tones.map((tone) => ({
        chinese: tone.example,
        pinyin: tone.pinyin,
        mongolian: tone.mongolian,
        label: tone.label,
      })),
      mediaSection: "tone",
      items: [],
    },
    {
      id: "vocabulary",
      type: "vocabulary",
      titleMn: "Үгийн сан",
      teacherSpeechMn: "",
      bulletsMn: [],
      chinese: content.featuredWord?.chinese ?? "",
      pinyin: content.featuredWord?.pinyin ?? "",
      mongolian: content.featuredWord?.mongolian ?? "",
      examples: [],
      mediaSection: "vocabulary",
      items: [],
    },
    {
      id: "dialogue",
      type: "dialogue",
      titleMn: "Ярианы дасгал",
      teacherSpeechMn: "",
      bulletsMn: [],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: content.dialogueLines.map((line) => ({
        chinese: line.chinese,
        pinyin: line.pinyin,
        mongolian: line.mongolian,
        label: line.speaker,
      })),
      mediaSection: "dialogue",
      items: [],
    },
    {
      id: "practice-menu",
      type: "practice-menu",
      titleMn: "Дасгал",
      teacherSpeechMn: "",
      bulletsMn: [],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      mediaSection: "practice",
      items: [],
    },
    {
      id: "complete",
      type: "complete",
      titleMn: "Дууслаа",
      teacherSpeechMn: content.completeMessage,
      bulletsMn: [],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      mediaSection: "complete",
      items: [],
    },
  ].filter((step) => {
    if (lesson.id.includes("prelesson") || lesson.id.includes("pinyin-tone")) {
      return !["key-phrase", "vocabulary", "dialogue"].includes(step.id);
    }
    return true;
  }) as HskGuidedStep[];
}

export function parseGuidedStepsFromSourceNote(sourceNote?: string | null): HskGuidedStep[] {
  if (!sourceNote?.trim().startsWith("{")) return [];
  try {
    const parsed = JSON.parse(sourceNote) as Record<string, unknown>;
    const hskStudy = parsed.hskStudyContent;
    if (typeof hskStudy !== "object" || hskStudy === null) return [];
    const guidedSteps = (hskStudy as Record<string, unknown>).guidedSteps;
    return parseHskGuidedSteps(guidedSteps);
  } catch {
    return [];
  }
}

export function buildHskPlayerStepPlanFromLesson(lesson: LessonContent): HskPlayerStepPlan {
  const fromStudy = lesson.hskStudy?.guidedSteps ?? [];
  if (fromStudy.length > 0) {
    return {
      steps: fromStudy,
      totalSteps: fromStudy.length,
      usesPackageSteps: true,
    };
  }

  const fromNote = parseGuidedStepsFromSourceNote(lesson.sourceNote);
  if (fromNote.length > 0) {
    return {
      steps: fromNote,
      totalSteps: fromNote.length,
      usesPackageSteps: true,
    };
  }

  const content = buildHskPlayerContent(lesson);
  const fallback = buildFallbackStepsFromPlayerContent(lesson, content);
  return {
    steps: fallback,
    totalSteps: fallback.length || FALLBACK_STEP_TYPES.length,
    usesPackageSteps: false,
  };
}
