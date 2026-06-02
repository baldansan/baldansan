import { withGuidedStepMeta } from "@/lib/lesson/hsk-guided-step";
import type { HskGuidedStep } from "@/lib/lesson/hsk-guided-step";

function step(
  partial: Omit<HskGuidedStep, "sourceType" | "toneLayout"> & {
    sourceType: string;
    toneLayout?: "production" | "standard";
  }
): HskGuidedStep {
  return withGuidedStepMeta({
    ...partial,
    toneLayout: partial.toneLayout ?? "standard",
  });
}

/** V13 Gold Standard — 9-step teacher-led flow for HSK1 Lesson 1. */
export function buildHsk1L01V13GuidedSteps(): HskGuidedStep[] {
  return [
    step({
      id: "v13-step-1-teacher-intro",
      type: "teacher-intro",
      sourceType: "teacher_intro",
      titleMn: "Багшийн эхлэл",
      teacherSpeechMn:
        "Өнөөдөр бид Хятад хэлний хамгийн эхний мэндчилгээ болох 你好-г сурна. Гэхдээ зөвхөн орчуулга цээжлэхгүй — бид 你好-г хэзээ хэрэглэх, яаж унших, хөг яагаад чухал болохыг хамтдаа ойлгоно.",
      bulletsMn: [
        "Өнөөдөр бид Хятад хэлний хамгийн эхний мэндчилгээ болох 你好-г сурна.",
        "Гэхдээ зөвхөн орчуулга цээжлэхгүй.",
        "Бид 你好-г хэзээ хэрэглэх, яаж унших, хөг яагаад чухал болохыг сурна.",
      ],
      chinese: "你好",
      pinyin: "nǐ hǎo",
      mongolian: "Сайн байна уу",
      examples: [],
      imageId: "",
      mediaSection: "teacher",
      items: [],
    }),

    step({
      id: "v13-step-2-greeting",
      type: "dialogue",
      sourceType: "dialogue_practice",
      titleMn: "你好-г хэрэглэж үзье",
      teacherSpeechMn:
        "Энэ бол хамгийн энгийн мэндчилгээ. Хүнтэй уулзах, дэлгүүрт орох, яриа эхлүүлэх үед ашиглаж болно.",
      bulletsMn: [
        "Хамгийн түгээмэл мэндчилгээ.",
        "Хүнтэй анх уулзах, дэлгүүрт орох, чат эхлүүлэх үед тохиромжтой.",
      ],
      chinese: "你好",
      pinyin: "nǐ hǎo",
      mongolian: "Сайн байна уу",
      examples: [
        { label: "A", chinese: "你好！", pinyin: "Nǐ hǎo!", mongolian: "Сайн байна уу!" },
        { label: "B", chinese: "你好！", pinyin: "Nǐ hǎo!", mongolian: "Сайн байна уу!" },
      ],
      imageId: "dialogue-1",
      mediaSection: "dialogue",
      items: [],
    }),

    step({
      id: "v13-step-3-phrase-breakdown",
      type: "phrase-breakdown",
      sourceType: "phrase_breakdown",
      titleMn: "你 + 好 = 你好",
      teacherSpeechMn:
        "Хятад хэлний олон хэллэг жижиг утгатай хэсгүүдээс бүрддэг. 你 болон 好-г ойлговол дараагийн хичээлүүд илүү хялбар болно.",
      bulletsMn: [
        "你 = чи / та",
        "好 = сайн",
        "你好 = Сайн байна уу",
        "Хятад хэлний хэллэг ихэнхдээ жижиг утгатай хэсгүүдээс бүрддэг.",
      ],
      chinese: "你好",
      pinyin: "nǐ hǎo",
      mongolian: "Сайн байна уу",
      examples: [
        { chinese: "你", pinyin: "nǐ", mongolian: "чи / та", label: "你" },
        { chinese: "好", pinyin: "hǎo", mongolian: "сайн", label: "好" },
        { chinese: "你好", pinyin: "nǐ hǎo", mongolian: "Сайн байна уу", label: "你好" },
      ],
      imageId: "",
      mediaSection: "hero",
      items: [],
    }),

    step({
      id: "v13-step-4-pinyin",
      type: "pinyin",
      sourceType: "pinyin_intro",
      titleMn: "Пиньинь гэж юу вэ?",
      teacherSpeechMn:
        "Пиньинь бол ханзны дуудлагыг латин үсгээр тэмдэглэсэн систем. Энэ нь Монгол үсгээр бичих арга биш.",
      bulletsMn: [
        "Пиньинь бол ханзны дуудлагыг латин үсгээр тэмдэглэсэн систем.",
        "Ханз уншихад тусалдаг — Монгол үсгээр бичих арга биш.",
        "Хятад хэлний үе = эхний авиа + сүүл авиа + хөг (жишээ: mā = m + a + 1-р хөг).",
        "你好 → nǐ hǎo гэж уншина.",
        "«Ни хао» гэж цээжлэхээс илүү pinyin + хөгийг хамтад нь сана.",
        "Хөгийн тэмдэг (ˉ ˊ ˇ ˋ) заавал анхаарах хэрэгтэй.",
      ],
      chinese: "你好",
      pinyin: "nǐ hǎo",
      mongolian: "",
      examples: [
        { chinese: "你好", pinyin: "nǐ hǎo", mongolian: "Сайн байна уу" },
        { chinese: "эхний авиа", pinyin: "n", mongolian: "声母 — эхний авиа" },
        { chinese: "сүүл авиа", pinyin: "ǐ", mongolian: "韵母 — сүүл авиа" },
      ],
      imageId: "pinyin-chart",
      mediaSection: "pinyin",
      items: [],
    }),

    step({
      id: "v13-step-5-tones",
      type: "tones",
      sourceType: "tones_overview",
      titleMn: "Хөг гэж юу вэ?",
      teacherSpeechMn:
        "Хөг бол дууны дээш доош хөдөлгөөн. Хөг өөр бол утга өөр болно — тиймээс хөгийг заавал ялгаж сонс.",
      bulletsMn: [
        "Хөг бол дууны дээш доош хөдөлгөөн.",
        "Хөг өөр бол утга өөр болно.",
        "mā, má, mǎ, mà — ижил үсэг, өөр хөг, өөр утга.",
      ],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      imageId: "tones-chart",
      mediaSection: "tone",
      items: [
        {
          nameMn: "1-р хөг",
          example: "mā",
          explanationMn: "өндөр, тэгш",
          motionSymbol: "→",
          toneNumber: 1,
        },
        {
          nameMn: "2-р хөг",
          example: "má",
          explanationMn: "дээшлэх",
          motionSymbol: "↗",
          toneNumber: 2,
        },
        {
          nameMn: "3-р хөг",
          example: "mǎ",
          explanationMn: "доошлоод дээшлэх",
          motionSymbol: "∨",
          toneNumber: 3,
        },
        {
          nameMn: "4-р хөг",
          example: "mà",
          explanationMn: "огцом буух",
          motionSymbol: "↘",
          toneNumber: 4,
        },
      ],
      toneLayout: "standard",
    }),

    step({
      id: "v13-step-6-tone-production",
      type: "tones",
      sourceType: "tone_production",
      titleMn: "4 хөгийг яаж гаргаж хэлэх вэ?",
      teacherSpeechMn: "Одоо гараар дагаж, дуугаар давтаж үзье.",
      bulletsMn: [
        "Сонсож ялга",
        "Гараар дагаж хэл",
        "Өөрийн дуу бичих — удахгүй",
      ],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      imageId: "",
      mediaSection: "tone",
      items: [
        {
          nameMn: "1-р хөг",
          example: "mā",
          motionSymbol: "→",
          motionMn: "→",
          howToSayMn: "Дуугаа өндөр түвшинд аваад, нэг шугам дээр тогтвортой барина.",
          repeatMn: "mā — mā — mā",
          learnerHintMn: "Дуугаа хэт урт татахгүй, тогтвортой барина.",
          toneNumber: 1,
        },
        {
          nameMn: "2-р хөг",
          example: "má",
          motionSymbol: "↗",
          motionMn: "↗",
          howToSayMn: "Доороос дээш асууж байгаа юм шиг өсгөнө.",
          repeatMn: "má — má — má",
          learnerHintMn: "Асуулт асууж байгаа мэт сонсогдох хэрэгтэй.",
          toneNumber: 2,
        },
        {
          nameMn: "3-р хөг",
          example: "mǎ",
          motionSymbol: "∨",
          motionMn: "∨",
          howToSayMn: "Эхлээд доошоо намсаад, дараа нь дээшээ буцаж өснө.",
          repeatMn: "mǎ — mǎ — mǎ",
          learnerHintMn: "Доошлоод дахин дээшлэх хоёр алхамтай.",
          toneNumber: 3,
        },
        {
          nameMn: "4-р хөг",
          example: "mà",
          motionSymbol: "↘",
          motionMn: "↘",
          howToSayMn: "Дуугаа богино, тод, огцом доош буулгана.",
          repeatMn: "mà — mà — mà",
          learnerHintMn: "Тод, хурдан доош буух хөдөлгөөн.",
          toneNumber: 4,
        },
      ],
      toneLayout: "production",
    }),

    step({
      id: "v13-step-7-tone-sandhi",
      type: "tone-sandhi",
      sourceType: "tone_sandhi",
      titleMn: "nǐ hǎo-г зөв хэлж үзье",
      teacherSpeechMn:
        "Бичихдээ nǐ hǎo хэвээр — хоёр 3-р хөг. Харин хэлэх үед эхний 3-р хөг ихэвчлэн 2-р хөг шиг сонсогддог.",
      bulletsMn: [
        "你好 бичигдэхдээ nǐ hǎo — хоёулаа 3-р хөг.",
        "Хоёр 3-р хөг дараалан ирэхэд эхнийх нь ихэвчлэн 2-р хөг шиг сонсогдоно.",
        "Бичихдээ nǐ hǎo хэвээр үлдэнэ — зөвхөн хэлэх үед í hǎo мэт мэдрэмж.",
        "Энэ нь tone sandhi — эхний алхамд зөвхөн мэдрэмжээр ойлгоход хангалттай.",
      ],
      chinese: "你好",
      pinyin: "nǐ hǎo",
      mongolian: "Сайн байна уу",
      examples: [
        { label: "Бичиг", pinyin: "nǐ hǎo", mongolian: "Хоёр 3-р хөг" },
        { label: "Хэлэх мэдрэмж", pinyin: "ní hǎo", mongolian: "Эхнийх 2-р хөг шиг" },
      ],
      imageId: "",
      mediaSection: "tone",
      items: [],
    }),

    step({
      id: "v13-step-8-characters",
      type: "characters",
      sourceType: "characters_strokes",
      titleMn: "Ханз ба зураас",
      teacherSpeechMn:
        "Ханз бол зураг биш — зураасны дараалалтай. Энэ хичээлийн ханзнууд нэг бүрдэлтэй, энгийн ханзнууд.",
      bulletsMn: [
        "Ханз бол зураг биш.",
        "Ханз зураасны дараалалтай.",
        "Энэ хичээлийн ханзнууд нэг бүрдэлтэй (single-component).",
      ],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [
        { chinese: "一", pinyin: "yī", mongolian: "нэг", label: "1 зураас" },
        { chinese: "二", pinyin: "èr", mongolian: "хоёр", label: "2 зураас" },
        { chinese: "三", pinyin: "sān", mongolian: "гурав", label: "3 зураас" },
        { chinese: "十", pinyin: "shí", mongolian: "арав", label: "2 зураас" },
        { chinese: "八", pinyin: "bā", mongolian: "найм", label: "2 зураас" },
        { chinese: "六", pinyin: "liù", mongolian: "зургаа", label: "4 зураас" },
      ],
      imageId: "",
      mediaSection: "characters",
      items: [],
    }),

    step({
      id: "v13-step-9-practice",
      type: "practice-menu",
      sourceType: "practice_menu",
      titleMn: "Бататгах",
      teacherSpeechMn: "Одоо сурсан зүйлээ бататгаж болно.",
      bulletsMn: [],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      imageId: "",
      mediaSection: "practice",
      items: [],
    }),
  ];
}

/** Extra source dialogues preserved for admin / detail views. */
export const HSK1_L01_V13_DIALOGUES = [
  {
    title: "Яриа 1",
    lines: [
      { speaker: "A", chinese: "你好！", pinyin: "Nǐ hǎo!", mongolian: "Сайн байна уу!" },
      { speaker: "B", chinese: "你好！", pinyin: "Nǐ hǎo!", mongolian: "Сайн байна уу!" },
    ],
  },
  {
    title: "Яриа 2",
    lines: [
      { speaker: "A", chinese: "您好！", pinyin: "Nín hǎo!", mongolian: "Сайн байна уу! (хүндэтгэсэн)" },
      { speaker: "B", chinese: "你们好！", pinyin: "Nǐmen hǎo!", mongolian: "Сайн байна уу! (олон хүн)" },
    ],
  },
  {
    title: "Яриа 3",
    lines: [
      { speaker: "A", chinese: "对不起！", pinyin: "Duìbuqǐ!", mongolian: "Уучлаарай!" },
      { speaker: "B", chinese: "没关系！", pinyin: "Méi guānxi!", mongolian: "Зүгээр ээ!" },
    ],
  },
];

/** Optional classroom expressions — mini-section, not main flow. */
export const HSK1_L01_CLASSROOM_EXPRESSIONS = [
  { chinese: "上课", pinyin: "shàngkè", mongolian: "Хичээл эхэллээ" },
  { chinese: "下课", pinyin: "xiàkè", mongolian: "Хичээл дууслаа" },
  { chinese: "现在休息", pinyin: "xiànzài xiūxi", mongolian: "Одоо амарна" },
  { chinese: "看黑板", pinyin: "kàn hēibǎn", mongolian: "Хар самbar хар" },
  { chinese: "跟我读", pinyin: "gēn wǒ dú", mongolian: "Намайг дагаж унш" },
];

/** Teaching goals from Teacher's Book — internal structure, not raw dump. */
export const HSK1_L01_TEACHING_GOALS = {
  pronunciation: [
    "Пиньинь, эхний авиа, сүүл авиаг ойлгох",
    "4 хөгийг ялгаж сонсох, давтах",
    "nǐ hǎo-г зөв унших",
  ],
  characters: [
    "Ханз, зураас, зураасны дараалал гэсэн ойлголт",
    "一, 二, 三, 十, 八, 六 ханз таних",
  ],
  functional: [
    "你好, 您好, 你们好 мэндчилгээ",
    "对不起, 没关系 хэллэг",
  ],
  sequence: [
    "Мэндчилгээ → пиньинь → хөг → ханз → дасгал",
  ],
};
