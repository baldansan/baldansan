import "server-only";

import { temeeAudioUrl } from "@/lib/temee-lesson/audio";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import type { QuizQuestion } from "@/types/lesson";
import type { TemeeLesson } from "@/types/temee-lesson";

/**
 * Хичээл бүрийн файл `content/temee-lessons/<lessonId>.json` — нэрээр нь автоматаар олдоно.
 * БҮРТГЭЛ ШААРДЛАГАГҮЙ: шинэ хичээл нэмэхэд зөвхөн JSON файлаа тавина (зэрэг ажиллаж буй чатууд
 * нэг файлыг зэрэг засаж зөрчилдөхгүй). Bundler энэ хавтасны файл бүрийг тусдаа хэсэг болгодог тул
 * нэг хичээл нээхэд бусдынх нь татагдахгүй. (path.join(process.cwd(), хувьсагч) ХОРИОТОЙ.)
 *
 * `status: "draft"` хичээл сурагчид харагдахгүй — зөвхөн `?temee=1` холбоосоор (эзэн шалгахад).
 */
const LESSON_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function loadTemeeLesson(
  lessonId: string,
  options: { includeDraft?: boolean } = {}
): Promise<TemeeLesson | null> {
  if (!LESSON_ID.test(lessonId)) return null;
  try {
    const mod = (await import(`@/content/temee-lessons/${lessonId}.json`)) as { default: unknown };
    const lesson = mod.default as TemeeLesson;
    if (lesson?.lessonId !== lessonId) return null;
    if (lesson.status === "draft" && !options.includeDraft) return null;
    return lesson;
  } catch {
    return null; // энэ хичээлд Тэмээ багшийн хичээл хараахан байхгүй
  }
}

/** Оршил, үгийн жагсаалтыг Тэмээ багшийн хичээлд тааруулна (эх багцыг өөрчлөхгүй, хуулбар буцаана). */
export function applyTemeeLessonToPackage(
  pkg: HskLessonPackage,
  temee: TemeeLesson
): HskLessonPackage {
  const keep = temee.vocabKeep ? new Set(temee.vocabKeep) : null;
  return {
    ...pkg,
    hook: {
      ...pkg.hook,
      teacher_mn: temee.intro_mn,
      ...(temee.warmup_mn ? { warmup_mn: temee.warmup_mn } : {}),
    },
    vocabulary: keep ? pkg.vocabulary.filter((w) => keep.has(w.zh)) : pkg.vocabulary,
    // Ангид ярилцах асуулт, бичгийн загвар нь заагаагүй үг, хуучин нэр томьёотой —
    // бие даан сурах хүнд Тэмээ багшийн дасгал үүнийг орлоно.
    texts: (pkg.texts ?? []).map((t) => ({
      ...t,
      reflection: undefined,
      writingSample: undefined,
      writingPrompt_mn: undefined,
    })),
  };
}

/** Тэмээ багшийн сорил → аппын сорилын асуулт. */
export function temeeQuizQuestions(temee: TemeeLesson): QuizQuestion[] {
  return (temee.quiz ?? []).map((q, index) => ({
    id: `${temee.lessonId}-t${q.id}`,
    orderIndex: index + 1,
    type: "multiple_choice" as const,
    question: q.question,
    options: q.options,
    correctAnswer: q.answer,
    explanation: q.explanation,
    ...(q.audio ? { audioUrl: temeeAudioUrl(q.audio, temee.lessonId) } : {}),
  }));
}
