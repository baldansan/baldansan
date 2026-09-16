/**
 * «Гүнзгий заах» нэмэлт агуулга — HSK1/HSK2 зэрэг суурь түвшинд зориулсан.
 *
 * ЯАГААД ТУСДАА ВЭ:
 * Хичээлийн үндсэн багц (`lessons.source_note` дэх том JSON) нь номоос
 * хөрвүүлсэн эх өгөгдөл. Түүнийг дахин бичвэл эх сурвалжтайгаа зөрөх,
 * алдвал хичээл бүхэлдээ эвдрэх эрсдэлтэй. Тиймээс багшийн нэмэлт
 * тайлбарыг ТУСАД НЬ хадгалж, дэлгэц дээр дээрээс нь давхарлана.
 * Нэмэлт байхгүй бол хичээл урьдын адил ажиллана.
 *
 * Бүх талбар нь СОНГОЛТ — дутуу бөглөсөн хичээл ч эвдрэхгүй.
 */

export type DeepExample = {
  zh: string;
  pinyin: string;
  mn: string;
  /** Тухайн жишээ юуг харуулж байгаа тухай нэг мөр. */
  note_mn?: string;
};

export type DeepMistake = {
  /** Буруу хувилбар — суралцагчдын бодитоор гаргадаг алдаа. */
  wrong: string;
  right: string;
  why_mn: string;
};

export type DeepCompare = {
  zh: string;
  pinyin?: string;
  mn: string;
  /** Энэ үгээс юугаараа ялгаатай вэ. */
  diff_mn: string;
};

/** Үг тус бүрийн дэлгэрэнгүй заавар. */
export type DeepWord = {
  zh: string;
  pinyin?: string;
  /** 2–4 өгүүлбэр: юу гэсэн үг, өгүүлбэрт хаана ордог, ямар үед хэлдэг. */
  teach_mn: string;
  /** Хэзээ хэрэглэх / хэзээ хэрэглэхгүй — богино мөрүүд. */
  usage_mn?: string[];
  examples?: DeepExample[];
  mistakes?: DeepMistake[];
  compare?: DeepCompare[];
};

export type DeepGrammarStep = {
  title_mn: string;
  body_mn: string;
  example?: DeepExample;
};

export type DeepDrillType = "choice" | "fill" | "judge";

export type DeepDrill = {
  type: DeepDrillType;
  question: string;
  options?: string[];
  /** choice → сонголтын текст; fill → зөв үг; judge → "true" | "false". */
  answer: string;
  why_mn: string;
};

/** Дүрмийн цэгийг алхам алхмаар задалсан хувилбар. */
export type DeepGrammar = {
  point: string;
  gloss_mn: string;
  /** «Өгүүлэгдэхүүн + 很 + тэмдэг нэр» маягийн томьёо. */
  structure?: string;
  steps?: DeepGrammarStep[];
  examples?: DeepExample[];
  mistakes?: DeepMistake[];
  drills?: DeepDrill[];
};

export type DeepHanziComponent = {
  c: string;
  meaning_mn: string;
  /** Утга заана уу, дуудлага заана уу гэдэг. */
  role_mn?: string;
};

export type DeepHanziWord = {
  zh: string;
  pinyin?: string;
  mn: string;
};

/** Ханзны бүтэц, гарал үүсэл, андуурч болох ханзууд. */
export type DeepHanzi = {
  hanzi: string;
  pinyin?: string;
  meaning_mn?: string;
  radical?: DeepHanziComponent;
  components?: DeepHanziComponent[];
  /** Хэлбэр нь яагаад ийм болсон тухай 1–3 өгүүлбэр. */
  story_mn?: string;
  stroke_count?: number;
  stroke_tips_mn?: string[];
  confusable?: DeepCompare[];
  words?: DeepHanziWord[];
};

export type DeepPronunciationPair = {
  a: DeepExample;
  b: DeepExample;
  note_mn?: string;
};

export type DeepPronunciationDrill = {
  title_mn: string;
  instruction_mn?: string;
  pairs: DeepPronunciationPair[];
};

export type DeepPronunciation = {
  /** Энэ хичээлд дуудлагын хувьд юунд анхаарах вэ. */
  focus_mn?: string;
  drills?: DeepPronunciationDrill[];
  tips_mn?: string[];
};

export type LessonDeepTeaching = {
  lesson_id: string;
  version: number;
  words?: DeepWord[];
  grammar?: DeepGrammar[];
  hanzi?: DeepHanzi[];
  pronunciation?: DeepPronunciation;
};

/** Хоосон нэмэлт үү — дэлгэц дээр юу ч нэмэхгүй гэсэн үг. */
export function deepTeachingIsEmpty(
  deep: LessonDeepTeaching | null | undefined
): boolean {
  if (!deep) return true;
  return (
    (deep.words?.length ?? 0) === 0 &&
    (deep.grammar?.length ?? 0) === 0 &&
    (deep.hanzi?.length ?? 0) === 0 &&
    (deep.pronunciation?.drills?.length ?? 0) === 0 &&
    !deep.pronunciation?.focus_mn
  );
}

/** Тухайн ханзны нэмэлт. Олдохгүй бол null — зохиохгүй. */
export function findDeepHanzi(
  deep: LessonDeepTeaching | null | undefined,
  hanzi: string
): DeepHanzi | null {
  const needle = hanzi.trim();
  if (!needle) return null;
  return deep?.hanzi?.find((row) => row.hanzi.trim() === needle) ?? null;
}

/** Тухайн үгийн нэмэлт. Олдохгүй бол null. */
export function findDeepWord(
  deep: LessonDeepTeaching | null | undefined,
  zh: string
): DeepWord | null {
  const needle = zh.trim();
  if (!needle) return null;
  return deep?.words?.find((row) => row.zh.trim() === needle) ?? null;
}
