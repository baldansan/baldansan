import {
  parseHskStudyContentFromLesson,
  type HskDialogueLine,
  type HskStudyContent,
  type HskToneExample,
} from "@/lib/lesson/hsk-lesson-content";
import {
  isBeginnerPinyinLevel,
  resolveHskIntroSpeech,
  resolveHskLessonToneNote,
  resolveHskPinyinExplainer,
  resolveHskTeacherAdvice,
  resolveKeyVocabularyWords,
} from "@/lib/lesson/hsk-learner-copy";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

export type HskPlayerContent = {
  study: HskStudyContent;
  introBullets: string[];
  keyPhrase: {
    chinese: string;
    pinyin: string;
    mongolian: string;
    breakdown: string;
    usage: string;
  };
  pinyinRows: Array<{ chinese: string; pinyin: string; hint?: string }>;
  pinyinExplainer: string[];
  tones: HskToneExample[];
  toneNote: string;
  toneWarning: string;
  featuredWord: VocabularyWord | null;
  dialogueLines: HskDialogueLine[];
  completeMessage: string;
  teacherTip: string;
};

const DEFAULT_DIALOGUE: HskDialogueLine[] = [
  { speaker: "A", chinese: "你好！", pinyin: "nǐ hǎo!", mongolian: "Сайн байна уу!" },
  { speaker: "B", chinese: "你好！", pinyin: "nǐ hǎo!", mongolian: "Сайн байна уу!" },
  { speaker: "A", chinese: "对不起！", pinyin: "duìbuqǐ!", mongolian: "Уучлаарай!" },
  { speaker: "B", chinese: "没关系！", pinyin: "méi guānxi!", mongolian: "Зүгээр!" },
];

const DEFAULT_TONES: HskToneExample[] = [
  { label: "1-р хөг", example: "mā", pinyin: "mā", mongolian: "өндөр, тэгш", motionSymbol: "→", toneNumber: 1 },
  { label: "2-р хөг", example: "má", pinyin: "má", mongolian: "дээшлэх", motionSymbol: "↗", toneNumber: 2 },
  { label: "3-р хөг", example: "mǎ", pinyin: "mǎ", mongolian: "доошлоод дээшлэх", motionSymbol: "∨", toneNumber: 3 },
  { label: "4-р хөг", example: "mà", pinyin: "mà", mongolian: "огцом буух", motionSymbol: "↘", toneNumber: 4 },
];

function resolveIntroBullets(
  lesson: LessonContent,
  content: HskStudyContent
): string[] {
  const isNihao =
    lesson.id.includes("nihao") || lesson.chineseTitle.includes("你好");
  if (isNihao) {
    return [
      "Өнөөдөр бид 你好 гэдэг хамгийн анхны мэндчилгээг сурна.",
      "Энэ нь «Сайн байна уу» гэсэн утгатай.",
      "Хүнтэй уулзахдаа хэрэглэнэ.",
    ];
  }
  const intro = resolveHskIntroSpeech(lesson, content);
  return intro.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 4);
}

function resolveKeyPhrase(lesson: LessonContent, content: HskStudyContent) {
  const isNihao = lesson.id.includes("nihao") || lesson.chineseTitle.includes("你好");
  const chinese = lesson.chineseTitle.trim() || lesson.vocabulary[0]?.chinese || "";
  const mainWord =
    lesson.vocabulary.find((w) => w.chinese === chinese) ??
    lesson.vocabulary[0];
  const pinyin = mainWord?.pinyin || (isNihao ? "nǐ hǎo" : "");
  const mongolian = mainWord?.mongolian || lesson.title || "";

  let breakdown = "";
  if (chinese === "你好" || chinese.includes("你好")) {
    breakdown = "你 + 好 = 你好";
  } else if (lesson.vocabulary.length >= 2) {
    breakdown = lesson.vocabulary
      .slice(0, 2)
      .map((w) => w.chinese)
      .join(" + ");
  }

  return {
    chinese,
    pinyin,
    mongolian,
    breakdown,
    // Мэндчилгээний тайлбар зөвхөн «你好» хичээлд — бусад хичээлд хоосон.
    usage: isNihao ? "Хүнтэй уулзах, утсаар ярих, дэлгүүрт ороход хэлнэ." : "",
  };
}

function resolvePinyinRows(lesson: LessonContent): HskPlayerContent["pinyinRows"] {
  const isNihao = lesson.id.includes("nihao") || lesson.chineseTitle.includes("你好");
  const phrase = lesson.chineseTitle.trim() || lesson.vocabulary[0]?.chinese || "";
  const words = resolveKeyVocabularyWords(lesson.vocabulary, 3);
  const rows: HskPlayerContent["pinyinRows"] = [];

  const phraseWord = lesson.vocabulary.find((w) => w.chinese === phrase);
  if (phrase && (phraseWord?.pinyin || isNihao)) {
    rows.push({
      chinese: phrase,
      pinyin: phraseWord?.pinyin || "nǐ hǎo",
      hint: isNihao ? "Бүтэн мэндчилгээ" : phraseWord?.mongolian || "",
    });
  }

  for (const word of words) {
    if (word.chinese === phrase) continue;
    rows.push({
      chinese: word.chinese,
      pinyin: word.pinyin,
      hint: word.mongolian,
    });
    if (rows.length >= 3) break;
  }

  if (rows.length < 2 && isNihao) {
    rows.push({ chinese: "你", pinyin: "nǐ", hint: "чи, та" });
    rows.push({ chinese: "好", pinyin: "hǎo", hint: "сайн" });
  }

  return rows.slice(0, 4);
}

function resolveDialogueLines(lesson: LessonContent, content: HskStudyContent): HskDialogueLine[] {
  const lines = content.dialogues.flatMap((d) => d.lines);
  if (lines.length >= 2) return lines.slice(0, 6);
  // «你好 / 你好» нөөц яриа зөвхөн тэр хичээлд — бусад хичээлд өөр хичээлийн яриа гаргахгүй.
  const isNihao = lesson.id.includes("nihao") || lesson.chineseTitle.includes("你好");
  return isNihao ? DEFAULT_DIALOGUE : lines;
}

export function buildHskPlayerContent(lesson: LessonContent): HskPlayerContent {
  const study = lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);
  const keyPhrase = resolveKeyPhrase(lesson, study);
  const beginner = isBeginnerPinyinLevel(study);
  const tones =
    study.tones.length > 0 ? study.tones.slice(0, 4) : beginner ? DEFAULT_TONES : [];

  return {
    study,
    introBullets: resolveIntroBullets(lesson, study),
    keyPhrase,
    pinyinRows: resolvePinyinRows(lesson),
    pinyinExplainer: resolveHskPinyinExplainer(study).slice(0, 4),
    tones,
    toneNote: resolveHskLessonToneNote(lesson, study),
    toneWarning: beginner
      ? "Монгол сурагчдад хөг хамгийн эхэнд хэцүү санагддаг — эхлээд сонсоод дуурай."
      : "",
    featuredWord:
      lesson.vocabulary.find((w) => w.chinese === "你") ??
      lesson.vocabulary[0] ??
      null,
    dialogueLines: resolveDialogueLines(lesson, study),
    completeMessage: beginner
      ? `Чи ${keyPhrase.chinese}, pinyin, tone, үндсэн үгсээ сурлаа.`
      : `Чи ${keyPhrase.chinese} хичээлийн үндсэн үгсээ сурлаа.`,
    teacherTip: resolveHskTeacherAdvice(study),
  };
}
