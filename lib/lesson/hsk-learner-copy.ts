import type { HskStudyContent } from "@/lib/lesson/hsk-lesson-content";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

const DEFAULT_INTRO =
  "Сайн байна уу! Энэ бол Хятад хэлний хамгийн эхний мэндчилгээ. Хүнтэй уулзахдаа 你好 гэж хэлнэ. 你 гэдэг нь «чи/та», 好 гэдэг нь «сайн» гэсэн утгатай. Хоёрыг нийлүүлээд 你好 — «сайн байна уу» болно.";

const DEFAULT_WHY_IMPORTANT = [
  "Хятад хэлний хамгийн түгээмэл мэндчилгээ.",
  "Хүнтэй анх уулзах, утсаар ярих, дэлгүүрт ороход ашиглана.",
  "Эелдэг, энгийн, хүндэтгэсэн мэндчилгээ.",
  "HSK1-ийн эхний хичээл — эндээс эхлэх нь зөв.",
];

const DEFAULT_PINYIN_EXPLAINER = [
  "Pinyin гэдэг нь Хятад үгийг латин үсгээр бичих арга.",
  "你好 гэдэг үгийг nǐ hǎo гэж уншина.",
  "Дээрх тэмдэг (ˉ ˊ ˇ ˋ) нь хөг — дууны өнгө, аяны өөрчлөлт.",
  "Хөг буруу бол утга өөрчлөгдөж болно — тиймээс хөгийг заавал анхаар.",
];

const DEFAULT_TEACHER_ADVICE =
  "Монгол сурагчдад хамгийн эхэнд хэцүү санагддаг зүйл бол хөг. Тиймээс үгийг эхлээд сонсоод, дараа нь дуугаар нь дуурайж хэлээрэй. Шууд Монгол үсгээр цээжлэхээс илүү pinyin + хөгийг хамтад нь харж сурах нь зөв.";

const DEFAULT_NIHAO_TONE_NOTE =
  "你好 дээр nǐ бол 3-р хөг, hǎo мөн 3-р хөгөөр уншигдана.";

export function resolveHskIntroSpeech(
  lesson: Pick<LessonContent, "id" | "title" | "chineseTitle">,
  content: HskStudyContent
): string {
  if (content.teacherNotes[0]?.trim()) return content.teacherNotes[0].trim();
  if (content.objectives[0]?.trim()) return content.objectives[0].trim();
  if (lesson.id.includes("nihao") || lesson.chineseTitle.includes("你好")) {
    return DEFAULT_INTRO;
  }
  const title = lesson.chineseTitle.trim() || lesson.title.trim();
  return `Сайн байна уу! Энэ хичээлээр ${title} гэж сурна. Эхлээд сонсоод, дараа нь pinyin болон хөгийг хамтад нь давтана.`;
}

export function resolveHskWhyImportant(
  _lesson: Pick<LessonContent, "id">,
  content: HskStudyContent
): string[] {
  const fromObjectives = content.objectives.slice(0, 4);
  if (fromObjectives.length >= 2) return fromObjectives;
  return DEFAULT_WHY_IMPORTANT;
}

export function resolveHskPinyinExplainer(content: HskStudyContent): string[] {
  const fromContent = [
    ...content.pinyinIntro,
    ...content.pronunciationNotes,
  ].filter(Boolean);
  if (fromContent.length >= 2) return fromContent.slice(0, 5);
  return DEFAULT_PINYIN_EXPLAINER;
}

export function resolveHskTeacherAdvice(content: HskStudyContent): string {
  const extra = content.teacherNotes[1]?.trim() ?? content.teacherNotes[0]?.trim();
  if (extra && !extra.includes("courseType=")) return extra;
  return DEFAULT_TEACHER_ADVICE;
}

export function resolveHskLessonToneNote(
  lesson: Pick<LessonContent, "id" | "chineseTitle">,
  content: HskStudyContent
): string {
  const fromGuide = content.studyGuideSteps.find((step) =>
    step.toLowerCase().includes("хөг") ||
    step.toLowerCase().includes("tone") ||
    step.includes("өнгө")
  );
  if (fromGuide) return fromGuide;
  if (lesson.id.includes("nihao") || lesson.chineseTitle.includes("你好")) {
    return DEFAULT_NIHAO_TONE_NOTE;
  }
  return "Хөгийг зөв сонсож, дуурайж хэлэх нь эхний алхам.";
}

export function resolveKeyVocabularyWords(
  vocabulary: VocabularyWord[],
  limit = 3
): VocabularyWord[] {
  return vocabulary.slice(0, limit);
}

export function hskTextbookSubtitle(
  lesson: Pick<LessonContent, "chineseTitle" | "title">
): string {
  const target = lesson.chineseTitle.trim() || lesson.title.trim();
  return `Багшийн тайлбартайгаар ${target}, pinyin, хөг, үндсэн үгсээ сурна.`;
}
