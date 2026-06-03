import type { VocabularyWord } from "@/types/lesson";

export type VocabComponentMn = {
  component: string;
  meaningMn: string;
};

export type Hsk1L01VocabEntry = VocabularyWord & {
  components?: VocabComponentMn[];
  memoryHintMn?: string;
  mnemonicImageId?: string;
  mnemonicStatus?: "learning_aid_not_official_etymology";
  examplePinyin?: string;
};

/** Official new words + phrase mnemonics for HSK1 Lesson 1. */
export const HSK1_L01_V13_VOCABULARY: Hsk1L01VocabEntry[] = [
  {
    id: "hsk1-l01-v-你",
    chinese: "你",
    pinyin: "nǐ",
    mongolian: "чи / та",
    hskLevel: "HSK1",
    exampleChinese: "你好！",
    examplePinyin: "Nǐ hǎo!",
    exampleMongolian: "Сайн байна уу!",
    memoryHintMn: "«Чи» гэж хэлэхдээ 你 гэж бод — энгийн мэндчилгээний эхний үг.",
    mnemonicStatus: "learning_aid_not_official_etymology",
  },
  {
    id: "hsk1-l01-v-好",
    chinese: "好",
    pinyin: "hǎo",
    mongolian: "сайн",
    hskLevel: "HSK1",
    exampleChinese: "你好！",
    examplePinyin: "Nǐ hǎo!",
    exampleMongolian: "Сайн байна уу!",
    components: [
      { component: "女", meaningMn: "эмэгтэй" },
      { component: "子", meaningMn: "хүүхэд" },
    ],
    memoryHintMn: "女 + 子 гэж төсөөлбөл 好-г амархан тогтоож болно.",
    mnemonicImageId: "vocab-hao-mnemonic",
    mnemonicStatus: "learning_aid_not_official_etymology",
  },
  {
    id: "hsk1-l01-v-您",
    chinese: "您",
    pinyin: "nín",
    mongolian: "та (хүндэтгэсэн)",
    hskLevel: "HSK1",
    exampleChinese: "您好！",
    examplePinyin: "Nín hǎo!",
    exampleMongolian: "Сайн байна уу! (хүндэтгэсэн)",
    memoryHintMn: "你 дээр хүндэтгэл нэмсэн «та» гэж төсөөлбөл амархан тогтоно.",
    mnemonicStatus: "learning_aid_not_official_etymology",
  },
  {
    id: "hsk1-l01-v-你们",
    chinese: "你们",
    pinyin: "nǐmen",
    mongolian: "та нар",
    hskLevel: "HSK1",
    exampleChinese: "你们好！",
    examplePinyin: "Nǐmen hǎo!",
    exampleMongolian: "Сайн байна уу, та нар!",
    memoryHintMn: "你 + 们 (олон) гэж төсөөлбөл «та нар» гэсэн утга ойлгогдоно.",
    mnemonicStatus: "learning_aid_not_official_etymology",
  },
  {
    id: "hsk1-l01-v-对不起",
    chinese: "对不起",
    pinyin: "duìbuqǐ",
    mongolian: "уучлаарай",
    hskLevel: "HSK1",
    exampleChinese: "对不起！",
    examplePinyin: "Duìbuqǐ!",
    exampleMongolian: "Уучлаарай!",
    memoryHintMn: "Бурхан сүйтгэсэн мэт уучлал хүсч байна гэж төсөөлбөл тогтохоор.",
    mnemonicStatus: "learning_aid_not_official_etymology",
  },
  {
    id: "hsk1-l01-v-没关系",
    chinese: "没关系",
    pinyin: "méi guānxi",
    mongolian: "зүгээр ээ",
    hskLevel: "HSK1",
    exampleChinese: "没关系！",
    examplePinyin: "Méi guānxi!",
    exampleMongolian: "Зүгээр ээ!",
    memoryHintMn: "«Хамаагүй, зүгээр» гэж хариулж байна гэж төсөөлбөл амархан.",
    mnemonicStatus: "learning_aid_not_official_etymology",
  },
];

export function mergeHsk1L01Vocabulary(
  existing: VocabularyWord[]
): VocabularyWord[] {
  const official = new Map(
    HSK1_L01_V13_VOCABULARY.map((w) => [w.chinese, w])
  );
  const merged: VocabularyWord[] = [];
  const seen = new Set<string>();

  for (const word of existing) {
    const key = word.chinese.trim();
    if (!key) continue;
    const overlay = official.get(key);
    if (overlay) {
      merged.push({ ...word, ...overlay, id: word.id || overlay.id });
      seen.add(key);
    } else {
      merged.push(word);
      seen.add(key);
    }
  }

  for (const word of HSK1_L01_V13_VOCABULARY) {
    if (!seen.has(word.chinese)) {
      merged.push(word);
    }
  }

  return merged;
}
