import type { HskStudyContent } from "@/lib/lesson/hsk-lesson-content";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

/**
 * АНХААР: доорх DEFAULT_* бичвэрүүд бол HSK1-ийн 1-р хичээл («你好») болон анхан шатны (пиньинь, хөг
 * заадаг) хичээлд зориулсан. Өмнө нь өгөгдөл дутуу БҮХ хичээлд (HSK4–6 хүртэл) нөөц болж гардаг
 * байсан — одоо зөвхөн тохирох хичээлд гарна, бусдад хоосон буцаана (дуудагч тал хоосныг нууна).
 */
function isNihaoLesson(lesson: Pick<LessonContent, "id" | "chineseTitle">): boolean {
  return lesson.id.includes("nihao") || lesson.chineseTitle.includes("你好");
}

/** Пиньинь, хөгийг шинээр зааж буй түвшин (HSK1). Түвшин тодорхойгүй бол анхан шат гэж үзэхгүй. */
export function isBeginnerPinyinLevel(content: Pick<HskStudyContent, "hskLevel">): boolean {
  return content.hskLevel === 1;
}

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
  if (isNihaoLesson(lesson)) {
    return DEFAULT_INTRO;
  }
  const title = lesson.chineseTitle.trim() || lesson.title.trim();
  if (isBeginnerPinyinLevel(content)) {
    return `Сайн байна уу! Энэ хичээлээр ${title} гэж сурна. Эхлээд сонсоод, дараа нь pinyin болон хөгийг хамтад нь давтана.`;
  }
  return `Энэ хичээлийн сэдэв: ${title}. Шинэ үг, эх бичвэр, дүрмээ дарааллаар нь үзнэ.`;
}

export function resolveHskWhyImportant(
  lesson: Pick<LessonContent, "id"> & Partial<Pick<LessonContent, "chineseTitle">>,
  content: HskStudyContent
): string[] {
  const fromObjectives = content.objectives.slice(0, 4);
  if (fromObjectives.length >= 2) return fromObjectives;
  if (isNihaoLesson({ id: lesson.id, chineseTitle: lesson.chineseTitle ?? "" })) {
    return DEFAULT_WHY_IMPORTANT;
  }
  return fromObjectives;
}

export function resolveHskPinyinExplainer(content: HskStudyContent): string[] {
  const fromContent = [
    ...content.pinyinIntro,
    ...content.pronunciationNotes,
  ].filter(Boolean);
  if (fromContent.length >= 2) return fromContent.slice(0, 5);
  return isBeginnerPinyinLevel(content) ? DEFAULT_PINYIN_EXPLAINER : fromContent;
}

export function resolveHskTeacherAdvice(content: HskStudyContent): string {
  const extra = content.teacherNotes[1]?.trim() ?? content.teacherNotes[0]?.trim();
  if (extra && !extra.includes("courseType=")) return extra;
  return isBeginnerPinyinLevel(content) ? DEFAULT_TEACHER_ADVICE : "";
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
  if (isNihaoLesson(lesson)) {
    return DEFAULT_NIHAO_TONE_NOTE;
  }
  return isBeginnerPinyinLevel(content) ? "Хөгийг зөв сонсож, дуурайж хэлэх нь эхний алхам." : "";
}

export function resolveKeyVocabularyWords(
  vocabulary: VocabularyWord[],
  limit = 3
): VocabularyWord[] {
  return vocabulary.slice(0, limit);
}

export function hskTextbookSubtitle(
  lesson: Pick<LessonContent, "chineseTitle" | "title"> & Partial<Pick<LessonContent, "courseId">>
): string {
  const target = lesson.chineseTitle.trim() || lesson.title.trim();
  // «pinyin, хөг» гэсэн үг зөвхөн тэдгээрийг шинээр заадаг анхан шатны номд (HSK1, 新HSK1, 发展汉语 初级 I, YCT).
  const beginner = /^(hsk1|xinhsk1|fazhan-chuji1|yct-)/.test(lesson.courseId ?? "");
  return beginner
    ? `Багшийн тайлбартайгаар ${target}, pinyin, хөг, үндсэн үгсээ сурна.`
    : `${target} — шинэ үг, эх бичвэр, дүрмээ багшийн тайлбартайгаар сурна.`;
}
