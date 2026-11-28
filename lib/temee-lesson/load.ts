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
    // Эх бичвэрийн давхарга тусдаа ноорог байж болно.
    if (lesson.text?.status === "draft" && !options.includeDraft) {
      return { ...lesson, text: undefined };
    }
    return lesson;
  } catch {
    return null; // энэ хичээлд Тэмээ багшийн хичээл хараахан байхгүй
  }
}

/** «马丁：你去哪儿？» ба «你去哪儿» хоёрыг ижил гэж үзнэ. */
function normalizeSentenceKey(zh: string): string {
  return zh
    .replace(/^[^：:]{1,8}[：:]/, "")
    .replace(/[\s，。！？、；：,.!?;:（）()“”"'《》…—-]/g, "");
}

/** Оршил, үгийн жагсаалтыг Тэмээ багшийн хичээлд тааруулна (эх багцыг өөрчлөхгүй, хуулбар буцаана). */
export function applyTemeeLessonToPackage(
  pkg: HskLessonPackage,
  temee: TemeeLesson
): HskLessonPackage {
  const keep = temee.vocabKeep ? new Set(temee.vocabKeep) : null;
  // Эх бичвэрийн мөрийг ярьж буй хүний нэр, цэг таслалаас үл хамааран таниулна.
  const textNotes = temee.text
    ? new Map(Object.entries(temee.text.notes).map(([zh, note]) => [normalizeSentenceKey(zh), note]))
    : null;
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
      sentences: textNotes
        ? (t.sentences ?? []).map((s) => {
            const note = textNotes.get(normalizeSentenceKey(s.zh));
            return note ? { ...s, temee_note: note } : s;
          })
        : t.sentences,
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
