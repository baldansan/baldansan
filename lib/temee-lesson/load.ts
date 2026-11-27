import "server-only";

import { temeeAudioUrl } from "@/lib/temee-lesson/audio";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import type { QuizQuestion } from "@/types/lesson";
import type { TemeeLesson } from "@/types/temee-lesson";

/**
 * Хичээл бүрийн файлыг тусад нь (lazy) ачаална — нэг хичээл нээхэд бусдынх нь татагдахгүй.
 * Шинэ хичээл нэмэхдээ энд нэг мөр + lib/temee-lesson/meta.ts-д нэг мөр нэмнэ.
 * (path.join(process.cwd(), хувьсагч) ХОРИОТОЙ — Vercel бүх repo-г багцалдаг.)
 */
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "fazhan-chuji1-l01": () => import("@/content/temee-lessons/fazhan-chuji1-l01.json"),
};

export async function loadTemeeLesson(lessonId: string): Promise<TemeeLesson | null> {
  const loader = LOADERS[lessonId];
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.default as TemeeLesson;
  } catch {
    return null;
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
