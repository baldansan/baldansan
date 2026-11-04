/**
 * Хүүхдийн «Дуудлагын суурь» зам — YCT-ийн өмнө/хамт сурах пиньинь суурь.
 * Аудио: public/data/pinyin_chart.json (үе → 4 аялгууны mp3), ярианы шалгалт: PronunciationCheck.
 * Ханз = тухайн үеийг төлөөлөх хятадын бага сургуулийн сонгодог «玻坡摸佛» ханзууд
 * (шалгалтад speech recognition ханз таньдаг тул заавал ханзтай).
 */

export type PinyinDrillItem = {
  /** Дэлгэцэнд харуулах пиньинь (аялгуутай) */
  py: string;
  /** chart cell (аялгуугүй үе): ma, bo, yi… */
  cell: string;
  tone: 1 | 2 | 3 | 4;
  /** Ярианы шалгалтын зорилтот ханз */
  zh: string;
  /** Хүүхдэд зориулсан богино зөвлөгөө (амны хэлбэр/хөдөлгөөн) */
  tip?: string;
  /** Утга (байвал) */
  mn?: string;
};

export type PinyinStage = {
  id: string;
  emoji: string;
  title: string;
  intro: string;
  kind: "vowels" | "initials" | "tones" | "chant" | "quiz";
  groups: { label: string; items: PinyinDrillItem[] }[];
};

const T = (py: string, cell: string, tone: 1 | 2 | 3 | 4, zh: string, tip?: string, mn?: string): PinyinDrillItem => ({ py, cell, tone, zh, tip, mn });

export const PINYIN_STAGES: PinyinStage[] = [
  {
    id: "vowels",
    emoji: "🅰️",
    title: "6 эгшиг",
    intro: "Хятад хэлний 6 эгшиг. Амаа том нээгээд, аудиог сонсоод, дагаж хэл!",
    kind: "vowels",
    groups: [
      {
        label: "a o e i u ü",
        items: [
          T("ā", "a", 1, "啊", "Амаа ТОМ нээ — эмч шиг «аа»"),
          T("ō", "o", 1, "喔", "Уруулаа дугуйл — «оо»"),
          T("ē", "e", 1, "鹅", "Инээмсэглээд «ээ» — хоолойноос", "галуу"),
          T("yī", "yi", 1, "衣", "Уруулаа татаад «ии»", "хувцас"),
          T("wū", "wu", 1, "屋", "Уруулаа жижиг дугуй — «уу»", "байшин"),
          T("yū", "yu", 1, "迂", "«ии» гэж байгаад уруулаа дугуйл — «үү»"),
        ],
      },
    ],
  },
  {
    id: "initials",
    emoji: "🅱️",
    title: "Гийгүүлэгч",
    intro: "Хятад хүүхдүүд ингэж цээжилдэг: bo po mo fo! Нэг багц — нэг ам хөдөлгөөн.",
    kind: "initials",
    groups: [
      { label: "b p m f — уруул", items: [T("bō", "bo", 1, "玻", "Уруулаа нийлүүлээд салга"), T("pō", "po", 1, "坡", "Яг адил, гэхдээ хийтэй — «пх»"), T("mō", "mo", 1, "摸", "Уруулаа нийлүүлээд хамраар «мм»"), T("fō", "fo", 1, "佛", "Дээд шүд доод уруул дээр — «ф»")] },
      { label: "d t n l — хэлний үзүүр", items: [T("dē", "de", 1, "得"), T("tē", "te", 1, "特", "Хийтэй — «тх»"), T("nē", "ne", 1, "讷"), T("lē", "le", 1, "勒")] },
      { label: "g k h — хоолой", items: [T("gē", "ge", 1, "哥", undefined, "ах"), T("kē", "ke", 1, "科", "Хийтэй — «кх»"), T("hē", "he", 1, "喝", "Хөнгөн «х»", "уух")] },
      { label: "j q x — инээмсэглэ", items: [T("jī", "ji", 1, "基", "Инээмсэглээд «жи»"), T("qī", "qi", 1, "欺", "«чи» хийтэй"), T("xī", "xi", 1, "希", "«си» зөөлөн")] },
      { label: "zh ch sh r — хэлээ ар руу", items: [T("zhī", "zhi", 1, "知", "Хэлний үзүүрээ дээш нугал"), T("chī", "chi", 1, "吃", undefined, "идэх"), T("shī", "shi", 1, "诗"), T("rì", "ri", 4, "日", "Зөөлөн «ж/р»", "нар, өдөр")] },
      { label: "z c s — шүдний завсраар", items: [T("zī", "zi", 1, "资"), T("cī", "ci", 1, "雌"), T("sī", "si", 1, "思")] },
    ],
  },
  {
    id: "tones",
    emoji: "🎵",
    title: "4 аялгуу",
    intro: "Нэг үг, дөрвөн аялгуу — дөрвөн өөр утга! Гараараа зураасыг дагаж хэл.",
    kind: "tones",
    groups: [
      {
        label: "ma — ээж, олс, морь, загнах",
        items: [
          T("mā", "ma", 1, "妈", "1: тэгш, өндөр — гараа тэгш", "ээж"),
          T("má", "ma", 2, "麻", "2: доороос дээш — асууж байгаа юм шиг", "олсны ургамал"),
          T("mǎ", "ma", 3, "马", "3: доош ороод дээш — гараа ⌣", "морь"),
          T("mà", "ma", 4, "骂", "4: дээрээс доош огцом — «Хөөе!»", "загнах"),
        ],
      },
      {
        label: "ba — найм, сугалах, барих, аав",
        items: [T("bā", "ba", 1, "八", undefined, "найм"), T("bá", "ba", 2, "拔", undefined, "сугалах"), T("bǎ", "ba", 3, "把", undefined, "барих"), T("bà", "ba", 4, "爸", undefined, "аав")],
      },
    ],
  },
  {
    id: "chant",
    emoji: "🎤",
    title: "Дуулъя: bo po mo fo",
    intro: "Бүх гийгүүлэгчийг нэг дуу болгоё. Эхлээд сонс, дараа нь мөр бүрийг чи хэл!",
    kind: "chant",
    groups: [
      { label: "bo po mo fo", items: [T("bō", "bo", 1, "玻"), T("pō", "po", 1, "坡"), T("mō", "mo", 1, "摸"), T("fō", "fo", 1, "佛")] },
      { label: "de te ne le", items: [T("dē", "de", 1, "得"), T("tē", "te", 1, "特"), T("nē", "ne", 1, "讷"), T("lē", "le", 1, "勒")] },
      { label: "ge ke he", items: [T("gē", "ge", 1, "哥"), T("kē", "ke", 1, "科"), T("hē", "he", 1, "喝")] },
      { label: "ji qi xi", items: [T("jī", "ji", 1, "基"), T("qī", "qi", 1, "欺"), T("xī", "xi", 1, "希")] },
      { label: "zhi chi shi ri", items: [T("zhī", "zhi", 1, "知"), T("chī", "chi", 1, "吃"), T("shī", "shi", 1, "诗"), T("rì", "ri", 4, "日")] },
      { label: "zi ci si", items: [T("zī", "zi", 1, "资"), T("cī", "ci", 1, "雌"), T("sī", "si", 1, "思")] },
    ],
  },
  {
    id: "quiz",
    emoji: "🏁",
    title: "Сонсоод ол",
    intro: "Сонс → аль нь вэ? Аялгуу, гийгүүлэгчээ ялгаж сурсан эсэхээ шалгая.",
    kind: "quiz",
    groups: [
      {
        label: "Аялгуу",
        items: [T("mā", "ma", 1, "妈"), T("má", "ma", 2, "麻"), T("mǎ", "ma", 3, "马"), T("mà", "ma", 4, "骂"), T("bā", "ba", 1, "八"), T("bá", "ba", 2, "拔"), T("bǎ", "ba", 3, "把"), T("bà", "ba", 4, "爸")],
      },
      {
        label: "Гийгүүлэгч",
        items: [T("bō", "bo", 1, "玻"), T("pō", "po", 1, "坡"), T("mō", "mo", 1, "摸"), T("fō", "fo", 1, "佛"), T("dē", "de", 1, "得"), T("tē", "te", 1, "特"), T("gē", "ge", 1, "哥"), T("kē", "ke", 1, "科"), T("jī", "ji", 1, "基"), T("qī", "qi", 1, "欺"), T("xī", "xi", 1, "希"), T("zhī", "zhi", 1, "知"), T("chī", "chi", 1, "吃"), T("shī", "shi", 1, "诗"), T("zī", "zi", 1, "资"), T("sī", "si", 1, "思")],
      },
    ],
  },
];

/** Бүх шатанд хэрэгтэй cell-үүд (аудио map бүрдүүлэхэд) */
export function pinyinPathCells(): string[] {
  const s = new Set<string>();
  for (const st of PINYIN_STAGES) for (const g of st.groups) for (const it of g.items) s.add(it.cell);
  return [...s];
}

export type PinyinAudioMap = Record<string, Partial<Record<"1" | "2" | "3" | "4" | "5", string>>>;
