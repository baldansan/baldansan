import type { HskCharacterNote } from "@/lib/lesson/hsk-lesson-content";

export const HSK1_L01_V13_CHARACTERS: HskCharacterNote[] = [
  {
    chinese: "一",
    pinyin: "yī",
    mongolian: "нэг",
    strokeNote: "1 зураас — зүүнээс баруун тийш",
    mnemonic: "Нэг шугам",
  },
  {
    chinese: "二",
    pinyin: "èr",
    mongolian: "хоёр",
    strokeNote: "2 зураас — дээр доор",
    mnemonic: "Хоёр зураас",
  },
  {
    chinese: "三",
    pinyin: "sān",
    mongolian: "гурав",
    strokeNote: "3 зураас — дээр, дунд, доор",
    mnemonic: "Гурван шугам",
  },
  {
    chinese: "十",
    pinyin: "shí",
    mongolian: "арав",
    strokeNote: "2 зураас — тасалгаатай",
    mnemonic: "Арав гэдэг тэмдэг",
  },
  {
    chinese: "八",
    pinyin: "bā",
    mongolian: "найм",
    strokeNote: "2 зураас — хоёр тал",
    mnemonic: "Найм гэдэг тэмдэг",
  },
  {
    chinese: "六",
    pinyin: "liù",
    mongolian: "зургаа",
    strokeNote: "4 зураас — нэг бүрдэл",
    mnemonic: "Зургаа гэдэг тэмдэг",
  },
];

export function mergeHsk1L01CharacterNotes(
  existing: HskCharacterNote[]
): HskCharacterNote[] {
  const byChar = new Map(existing.map((c) => [c.chinese, c]));
  for (const note of HSK1_L01_V13_CHARACTERS) {
    const prev = byChar.get(note.chinese);
    byChar.set(note.chinese, prev ? { ...prev, ...note } : note);
  }
  const order = HSK1_L01_V13_CHARACTERS.map((c) => c.chinese);
  const result: HskCharacterNote[] = [];
  for (const ch of order) {
    const note = byChar.get(ch);
    if (note) result.push(note);
    byChar.delete(ch);
  }
  for (const note of byChar.values()) {
    result.push(note);
  }
  return result;
}
