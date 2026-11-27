import {
  parseHskGuidedSteps,
  withGuidedStepMeta,
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
      imageId: "",
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
      imageId: "",
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
      imageId: "",
      mediaSection: "pinyin",
      items: [],
    },
    {
      id: "tones",
      type: "tones",
      titleMn: "Хөг / Дууны өнгө",
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
        symbol: tone.symbol,
        motionMn: tone.motionMn,
        howToSayMn: tone.howToSayMn,
        learnerHintMn: tone.learnerHintMn,
        motionSymbol: tone.motionSymbol,
        toneNumber: tone.toneNumber,
      })),
      imageId: "",
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
      imageId: "",
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
      imageId: "",
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
      imageId: "",
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
      imageId: "",
      mediaSection: "complete",
      items: [],
    },
  ].filter((step) => {
    if (lesson.id.includes("prelesson") || lesson.id.includes("pinyin-tone")) {
      return !["key-phrase", "vocabulary", "dialogue"].includes(step.id);
    }
    return true;
  }).map((step) =>
    withGuidedStepMeta({
      ...(step as Omit<HskGuidedStep, "sourceType" | "toneLayout">),
      sourceType: step.type,
    })
  );
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

/** Алхамд сурагчид харуулах жинхэнэ агуулга байгаа эсэх (гарчгаас өөр зүйл). */
function stepHasBody(step: HskGuidedStep): boolean {
  return (
    Boolean(step.teacherSpeechMn?.trim()) ||
    // Задлагч хоосон алхмын bullets-д гарчгийг нь хуулж тавьдаг — түүнийг агуулга гэж тооцохгүй.
    step.bulletsMn.some((b) => b.trim() && b.trim() !== step.titleMn.trim()) ||
    Boolean(step.chinese?.trim()) ||
    step.examples.length > 0 ||
    step.items.length > 0
  );
}

/**
 * Импортын үед хичээл бүрд ижил ХООСОН загвар 8 алхам (Багшийн тайлбар, Гол хэллэг, Pinyin,
 * Хөг / Дууны өнгө, …) хадгалагдсан байдаг (360 гаруй хичээлд яг адил). Бүх алхам хоосон бол
 * энэ нь жинхэнэ алхам биш — хичээлийн өөрийн агуулгаас алхмыг үүсгэнэ.
 */
function usableSteps(steps: HskGuidedStep[]): HskGuidedStep[] {
  return steps.some(stepHasBody) ? steps : [];
}

export function buildHskPlayerStepPlanFromLesson(lesson: LessonContent): HskPlayerStepPlan {
  const fromStudy = usableSteps(lesson.hskStudy?.guidedSteps ?? []);
  if (fromStudy.length > 0) {
    return {
      steps: fromStudy,
      totalSteps: fromStudy.length,
      usesPackageSteps: true,
    };
  }

  const fromNote = usableSteps(parseGuidedStepsFromSourceNote(lesson.sourceNote));
  if (fromNote.length > 0) {
    return {
      steps: fromNote,
      totalSteps: fromNote.length,
      usesPackageSteps: true,
    };
  }

  const content = buildHskPlayerContent(lesson);
  // HSK1-ээс дээш түвшинд «Pinyin», «Хөг / Дууны өнгө» алхам зөвхөн жинхэнэ агуулгатай үед гарна;
  // хоосон яриа, хоосон «гол хэллэг» алхмыг ч алгасна (өмнө нь бүх түвшинд HSK1-ийн загвар алхам гардаг байв).
  const beginner = content.study.hskLevel === 1;
  const fallback = buildFallbackStepsFromPlayerContent(lesson, content).filter((step) => {
    if (beginner) return true;
    const hasBody =
      Boolean(step.teacherSpeechMn?.trim()) ||
      step.bulletsMn.some((b) => b.trim()) ||
      step.examples.length > 0 ||
      Boolean(step.chinese?.trim());
    if (step.type === "pinyin" || step.type === "tones") return false;
    if (step.type === "dialogue" || step.type === "key-phrase" || step.type === "teacher-intro") return hasBody;
    return true;
  });
  return {
    steps: fallback,
    totalSteps: fallback.length || FALLBACK_STEP_TYPES.length,
    usesPackageSteps: false,
  };
}
