import type { QuizQuestion } from "@/types/lesson";

/** HSK1 Lesson 1 quiz — tone, pinyin, vocabulary aligned with lesson content. */
export const HSK1_L01_V13_QUIZ: QuizQuestion[] = [
  {
    id: "hsk1-l01-q1",
    type: "multiple_choice",
    question: "「你好」-ийн pinyin зөв бичиглэл аль вэ?",
    options: ["ni hao", "nǐ hǎo", "ní hǎo", "nī hào"],
    correctAnswer: "nǐ hǎo",
    explanation: "Бичихдээ хоёр 3-р хөг: nǐ hǎo.",
  },
  {
    id: "hsk1-l01-q2",
    type: "multiple_choice",
    question: "「你好」-ийн монгол утга аль вэ?",
    options: ["Баярлалаа", "Сайн байна уу", "Уучлаарай", "Баяртай"],
    correctAnswer: "Сайн байна уу",
    explanation: "你好 = Сайн байна уу — хамгийн энгийн мэндчилгээ.",
  },
  {
    id: "hsk1-l01-q3",
    type: "multiple_choice",
    question: "1-р хөг (mā) ямар дууны хөдөлгөөнтэй вэ?",
    options: ["↗ дээшлэх", "→ өндөр, тэгш", "∨ доошлоод дээшлэх", "↘ огцом буух"],
    correctAnswer: "→ өндөр, тэгш",
    explanation: "1-р хөг — өндөр, тэгш, тогтвортой.",
  },
  {
    id: "hsk1-l01-q4",
    type: "multiple_choice",
    question: "「您」-ийн утга аль вэ?",
    options: ["чи", "та (хүндэтгэсэн)", "та нар", "сайн"],
    correctAnswer: "та (хүндэтгэсэн)",
    explanation: "您 = хүндэтгэсэн «та».",
  },
  {
    id: "hsk1-l01-q5",
    type: "multiple_choice",
    question: "Хоёр 3-р хөг дараалан ирэхэд (nǐ hǎo) хэлэх үед:",
    options: [
      "Эхнийх 4-р хөг болно",
      "Эхнийх ихэвчлэн 2-р хөг шиг сонсогдоно",
      "Хоёулаа 1-р хөг болно",
      "Хөг алга болно",
    ],
    correctAnswer: "Эхнийх ихэвчлэн 2-р хөг шиг сонсогдоно",
    explanation: "Tone sandhi — бичиг nǐ hǎo хэвээр.",
  },
  {
    id: "hsk1-l01-q6",
    type: "multiple_choice",
    question: "「没关系」-ийн утга аль вэ?",
    options: ["Уучлаарай", "Зүгээр ээ", "Сайн байна уу", "Баярлалаа"],
    correctAnswer: "Зүгээр ээ",
    explanation: "没关系 = зүгээр ээ, хамаагүй.",
  },
];

export function mergeHsk1L01Quiz(existing: QuizQuestion[]): QuizQuestion[] {
  if (existing.length >= 3) return existing;
  return HSK1_L01_V13_QUIZ;
}
