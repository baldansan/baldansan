/**
 * «Пиньинь суурь» (拼音基础) — хятадын 1-р ангийн пиньинь хичээл, нэгж нэгжээр.
 * 6 дан эгшиг → гийгүүлэгч бүлгээр (bo po mo fo) → давхар эгшиг → хамрын эгшиг →
 * бүхэл үе → дүрэм. Аудио: public/data/pinyin_chart.json → cells[syl].tones.
 *
 * Тайлбарууд монголоор, монгол авиатай харьцуулж бичсэн. Хятад хэрэглэгчид
 * (locale === "zh") пиньиний тайлбар хэрэггүй тул tipZh ихэвчлэн байхгүй —
 * тэр үед монгол тайлбар харагдана.
 */

export type CourseItem = {
  letter: string;
  /** Самбарын түлхүүр (аудиотой), ж: "bo" */
  syl: string;
  exampleHanzi: string;
  examplePinyin: string;
  exampleMn: string;
  /** Монгол дуудлагын тайлбар */
  tip: string;
  tipZh?: string;
};

export type CourseRule = {
  title: string;
  titleZh: string;
  body: string;
  bodyZh?: string;
  /** Жишээ: `syl` + `tone` өгвөл самбарын аудио тоглоно */
  examples: Array<{ text: string; pinyin: string; mn?: string; syl?: string; tone?: number }>;
};

export type CourseUnit = {
  id: string;
  order: number;
  title: string;
  titleZh: string;
  emoji: string;
  intro: string;
  introZh?: string;
  items: CourseItem[];
  /** 拼读 — энэ үед боломжтой хослолууд */
  blend?: { initials: string[]; finals: string[] };
  /** Сонсоод сонгох хамгийн бага хосууд — самбарын түлхүүр */
  pairs?: [string, string][];
  /** Дүрмийн нэгж (аудиогүй) */
  rules?: CourseRule[];
};

export const PINYIN_COURSE_STORAGE_KEY = "buunduu-pinyin-course-v1";

export type UnitProgress = { listened: string[]; testScore?: number; done: boolean };
export type CourseProgress = Record<string, UnitProgress | undefined>;

/** Шалгалт тэнцэх доод оноо (8-аас) */
export const PASS_SCORE = 6;
export const TEST_QUESTIONS = 8;
export const EXERCISE_ROUNDS = 6;

/* --------------------------------------------------------------------------
 * Гийгүүлэгч + эгшиг → самбарын түлхүүр (拼读 дүрэм)
 * ----------------------------------------------------------------------- */

/**
 * "b"+"a" → "ba"; "j"+"ü" → "ju" (цэг унана); "y"+"i" → "yi"; "w"+"u" → "wu";
 * "y"+"ü" → "yu". Самбарт байгаа эсэхийг дуудагч өөрөө шалгана.
 */
export function blendKey(initial: string, final: string): string {
  if (initial === "y") {
    if (final === "i") return "yi";
    if (final === "ü") return "yu";
    if (final.startsWith("i")) return "y" + final.slice(1);
    if (final.startsWith("ü")) return "yu" + final.slice(1);
    return "y" + final;
  }
  if (initial === "w") {
    if (final === "u") return "wu";
    if (final.startsWith("u")) return "w" + final.slice(1);
    return "w" + final;
  }
  if ((initial === "j" || initial === "q" || initial === "x") && final.startsWith("ü")) {
    return initial + "u" + final.slice(1);
  }
  return initial + final;
}

/** Нэгжид хэрэгтэй бүх самбарын түлхүүр (аудио ачаалахад) */
export function unitSyllableKeys(unit: CourseUnit): string[] {
  const keys = new Set<string>();
  for (const it of unit.items) keys.add(it.syl);
  for (const [a, b] of unit.pairs ?? []) {
    keys.add(a);
    keys.add(b);
  }
  if (unit.blend) {
    for (const i of unit.blend.initials) for (const f of unit.blend.finals) keys.add(blendKey(i, f));
  }
  for (const r of unit.rules ?? []) for (const ex of r.examples) if (ex.syl) keys.add(ex.syl);
  return [...keys];
}

/** Амны хэлбэр — эгшгийн эхний үсгээр (гийгүүлэгч бол түүний үеийн эгшгээр: b → bo → дугуй) */
export type MouthShapeKind = "round" | "spread" | "open" | "neutral";

export function mouthShapeFor(letter: string, syl?: string): MouthShapeKind {
  const strip = (s: string) => s.replace(/^(zh|ch|sh|[bpmfdtnlgkhjqxzcsr])/, "").replace(/^[yw]/, "");
  // zhi chi shi ri zi ci si — i нь «ы» шиг, уруул татахгүй
  if (/^(zh|ch|sh|r|z|c|s)i$/.test(syl ?? letter)) return "neutral";
  let l = strip(letter);
  if (!l && syl) l = strip(syl);
  if (l.startsWith("a")) return "open";
  if (l.startsWith("o") || l.startsWith("u") || l.startsWith("ü")) return "round";
  if (l.startsWith("i")) return "spread";
  return "neutral";
}

/* --------------------------------------------------------------------------
 * Нэгжүүд
 * ----------------------------------------------------------------------- */

export const PINYIN_COURSE: CourseUnit[] = [
  {
    id: "dan-egshig",
    order: 1,
    title: "Дан эгшиг",
    titleZh: "单韵母",
    emoji: "🅰️",
    intro: "Пиньинь 6 дан эгшгээс эхэлнэ: a o e i u ü. Эхлээд сонс, дараа нь ам, уруулаа хараад дага.",
    introZh: "拼音从 6 个单韵母开始：a o e i u ü。先听，再看口型跟读。",
    items: [
      { letter: "a", syl: "a", exampleHanzi: "啊", examplePinyin: "ā", exampleMn: "аа — гайхах", tip: "Монгол «а»-аас ам илүү том нээгдэнэ, доод эрүү доош бууна. Эмч шүд үзэхэд «аа» гэдэг шиг." },
      { letter: "o", syl: "o", exampleHanzi: "喔", examplePinyin: "ō", exampleMn: "оо — дуудах", tip: "«О» — уруул дугуй. Бага зэрэг «уо» шиг сонсогдоно: уруулаа дугуйлаад «о» гэж хэл." },
      { letter: "e", syl: "e", exampleHanzi: "鹅", examplePinyin: "é", exampleMn: "галуу", tip: "Монгол «э» биш — «ө» ба «э»-ийн дунд. Уруулаа инээмсэглэсэн хэвээр (дугуйлахгүй) байлгаад хэлээ арагш татаж «э» гэж хэл." },
      { letter: "i", syl: "yi", exampleHanzi: "衣", examplePinyin: "yī", exampleMn: "хувцас", tip: "«И» — уруулаа хажуу тийш татсан, инээмсэглэсэн шиг. Шүд бараг нийлнэ." },
      { letter: "u", syl: "wu", exampleHanzi: "乌", examplePinyin: "wū", exampleMn: "хэрээ", tip: "«У» — уруул хамгийн дугуй, урагш түрсэн. Исгэрэх гэж байгаа юм шиг." },
      { letter: "ü", syl: "yu", exampleHanzi: "鱼", examplePinyin: "yú", exampleMn: "загас", tip: "Монгол «ү»-тэй яг адил — монголчуудын давуу тал! Уруул дугуй, хэл «и» хэлэх байрлалд." },
    ],
    pairs: [
      ["o", "e"],
      ["wu", "yu"],
      ["yi", "yu"],
    ],
  },
  {
    id: "b-p-m-f",
    order: 2,
    title: "b p m f",
    titleZh: "b p m f",
    emoji: "👄",
    intro: "Уруулын гийгүүлэгч: bo po mo fo. Хятад хүүхдүүд гийгүүлэгчийг үеэр нь цээжилдэг — «бо по мо фо».",
    introZh: "唇音：bo po mo fo。声母要带着韵母读——「波坡摸佛」。",
    items: [
      { letter: "b", syl: "bo", exampleHanzi: "播", examplePinyin: "bō", exampleMn: "цацах, тарих", tip: "Агааргүй «б». Гараа амны өмнө барихад салхи гарахгүй. Уруул нийлээд зөөлөн нээгдэнэ." },
      { letter: "p", syl: "po", exampleHanzi: "泼", examplePinyin: "pō", exampleMn: "ус цацах", tip: "«П» + хүчтэй агаар. Цаас амны өмнө барихад цаас хөдөлнө. b-ээс ганц ялгаа нь — агаар." },
      { letter: "m", syl: "mo", exampleHanzi: "摸", examplePinyin: "mō", exampleMn: "тэмтрэх", tip: "Монгол «м»-тэй адил. Уруул нийлж, дуу хамраар гарна." },
      { letter: "f", syl: "fo", exampleHanzi: "佛", examplePinyin: "fó", exampleMn: "Бурхан (Будда)", tip: "Дээд шүдээ доод уруул дээр тавиад «ф». Монголд байхгүй авиа — «п» гэж бүү хэл! Шүд уруулд хүрч байх ёстой." },
    ],
    blend: { initials: ["b", "p", "m", "f"], finals: ["a", "o", "i", "u"] },
    pairs: [
      ["bo", "po"],
      ["ba", "pa"],
      ["bi", "pi"],
      ["mo", "fo"],
    ],
  },
  {
    id: "d-t-n-l",
    order: 3,
    title: "d t n l",
    titleZh: "d t n l",
    emoji: "👅",
    intro: "Хэлний үзүүрийн гийгүүлэгч: de te ne le. Хэлний үзүүр дээд шүдний ард, буйланд хүрнэ.",
    introZh: "舌尖音：de te ne le。舌尖抵住上齿龈。",
    items: [
      { letter: "d", syl: "de", exampleHanzi: "得", examplePinyin: "dé", exampleMn: "олох", tip: "Агааргүй «д». Хэлний үзүүр дээд буйланд хүрээд зөөлөн салнa, салхи гарахгүй." },
      { letter: "t", syl: "te", exampleHanzi: "特", examplePinyin: "tè", exampleMn: "онцгой", tip: "«Т» + агаар. d-тэй адил байрлал, гэхдээ хүчтэй агаар гарна (цаас хөдөлнө)." },
      { letter: "n", syl: "ne", exampleHanzi: "讷", examplePinyin: "nè", exampleMn: "үг цөөтэй", tip: "«Н» — дуу хамраар гарна. Хэлний үзүүр дээд буйланд." },
      { letter: "l", syl: "le", exampleHanzi: "乐", examplePinyin: "lè", exampleMn: "баяртай, хөгжилтэй", tip: "«Л» — хэлний үзүүр дээд буйланд хүрч, агаар хэлний хоёр хажуугаар гарна. n-тэй андуурч болохгүй: n хамраар, l амаар." },
    ],
    blend: { initials: ["d", "t", "n", "l"], finals: ["a", "e", "i", "u", "ü"] },
    pairs: [
      ["de", "te"],
      ["da", "ta"],
      ["ne", "le"],
      ["nu", "lu"],
      ["nü", "lü"],
    ],
  },
  {
    id: "g-k-h",
    order: 4,
    title: "g k h",
    titleZh: "g k h",
    emoji: "🗣️",
    intro: "Хэлний угийн гийгүүлэгч: ge ke he. Хэлний уг зөөлөн тагнайд хүрнэ.",
    introZh: "舌根音：ge ke he。舌根抵住软腭。",
    items: [
      { letter: "g", syl: "ge", exampleHanzi: "哥", examplePinyin: "gē", exampleMn: "ах", tip: "Агааргүй «г». Хоолойн гүнд биш — хэлний угаар, тагнайн ард. Салхи гарахгүй." },
      { letter: "k", syl: "ke", exampleHanzi: "科", examplePinyin: "kē", exampleMn: "шинжлэх ухааны салбар", tip: "«К» + агаар. g-тэй адил байрлал, хүчтэй агаар гарна." },
      { letter: "h", syl: "he", exampleHanzi: "喝", examplePinyin: "hē", exampleMn: "уух", tip: "Монгол «х»-ээс зөөлөн. Хоолойгоор бага зэрэг үрэлттэй, гэхдээ монгол «х» шиг хатуу биш." },
    ],
    blend: { initials: ["g", "k", "h"], finals: ["a", "e", "u"] },
    pairs: [
      ["ge", "ke"],
      ["ka", "ha"],
      ["gu", "ku"],
    ],
  },
  {
    id: "j-q-x",
    order: 5,
    title: "j q x",
    titleZh: "j q x",
    emoji: "😁",
    intro: "Хэлний нурууны гийгүүлэгч: ji qi xi. Хэлний нуруу тагнай руу, хэлний үзүүр ДООД шүдний ард. Дараа нь зөвхөн i, ü ирнэ.",
    introZh: "舌面音：ji qi xi。舌面贴硬腭，舌尖抵下齿背。后面只能跟 i、ü。",
    items: [
      { letter: "j", syl: "ji", exampleHanzi: "鸡", examplePinyin: "jī", exampleMn: "тахиа", tip: "Зөөлөн «дз/ж», агааргүй. Хэлний нуруу тагнай руу, хэлний үзүүр ДООД шүдний ард. Инээмсэглэсэн уруул." },
      { letter: "q", syl: "qi", exampleHanzi: "气", examplePinyin: "qì", exampleMn: "агаар, уур", tip: "Зөөлөн «ч» + агаар. j-тэй адил байрлал, хүчтэй агаар гарна." },
      { letter: "x", syl: "xi", exampleHanzi: "西", examplePinyin: "xī", exampleMn: "баруун", tip: "Зөөлөн «ш/с» — инээмсэглэсэн уруулаар. Хэлний үзүүр доод шүдний ард, хэл эргэхгүй." },
    ],
    blend: { initials: ["j", "q", "x"], finals: ["i", "ü"] },
    pairs: [
      ["ji", "qi"],
      ["qi", "xi"],
      ["ju", "qu"],
    ],
  },
  {
    id: "zh-ch-sh-r",
    order: 6,
    title: "zh ch sh r",
    titleZh: "zh ch sh r",
    emoji: "🌀",
    intro: "Хэл эргэсэн (卷舌) гийгүүлэгч: zhi chi shi ri. Хэлний үзүүрийг дээш, тагнайн урд хэсэг рүү эргүүл.",
    introZh: "翘舌音：zhi chi shi ri。舌尖翘起，抵住硬腭前部。",
    items: [
      { letter: "zh", syl: "zhi", exampleHanzi: "知", examplePinyin: "zhī", exampleMn: "мэдэх", tip: "«Дж», агааргүй. Хэл эргэсэн: хэлний үзүүр дээш, тагнайн урд хэсэг рүү. i энд «ы» шиг богино (zhi ≠ «жи»)." },
      { letter: "ch", syl: "chi", exampleHanzi: "吃", examplePinyin: "chī", exampleMn: "идэх", tip: "«Ч» + агаар, хэл эргэсэн. zh-тэй адил байрлал, хүчтэй агаар гарна." },
      { letter: "sh", syl: "shi", exampleHanzi: "狮", examplePinyin: "shī", exampleMn: "арслан", tip: "«Ш» — хэл эргэсэн, хэлний үзүүр дээш. i «ы» шиг богино." },
      { letter: "r", syl: "ri", exampleHanzi: "日", examplePinyin: "rì", exampleMn: "нар, өдөр", tip: "«Ж»-тэй төстэй, үрэлт бага, хоолойгоор. Монгол «р» шиг чичирдэггүй! Хэл эргэсэн хэвээр." },
    ],
    blend: { initials: ["zh", "ch", "sh", "r"], finals: ["i", "a", "e", "u"] },
    pairs: [
      ["zhi", "chi"],
      ["shi", "ri"],
      ["zha", "cha"],
      ["zhu", "shu"],
    ],
  },
  {
    id: "z-c-s",
    order: 7,
    title: "z c s",
    titleZh: "z c s",
    emoji: "🐝",
    intro: "Хэл тэгш (平舌) гийгүүлэгч: zi ci si. Хэл тэгш, үзүүр нь дээд шүдний ард. zh/ch/sh-тэй ялгах нь монголчуудад хамгийн хэцүү!",
    introZh: "平舌音：zi ci si。舌尖平放，抵住上齿背。和 zh/ch/sh 的区别是难点。",
    items: [
      { letter: "z", syl: "zi", exampleHanzi: "字", examplePinyin: "zì", exampleMn: "үсэг, ханз", tip: "«Дз», агааргүй. Хэл тэгш, үзүүр нь дээд шүдний ард. i энд бас «ы» шиг богино." },
      { letter: "c", syl: "ci", exampleHanzi: "刺", examplePinyin: "cì", exampleMn: "өргөс", tip: "«Ц» + хүчтэй агаар. z-тэй адил байрлал, агаар гарна." },
      { letter: "s", syl: "si", exampleHanzi: "丝", examplePinyin: "sī", exampleMn: "торго, утас", tip: "«С» — хэл тэгш, хэлний үзүүр дээд шүдний ард. Хэл эргэхгүй (sh-ээс ялгаа)." },
    ],
    blend: { initials: ["z", "c", "s"], finals: ["i", "a", "e", "u"] },
    pairs: [
      ["zi", "zhi"],
      ["ci", "chi"],
      ["si", "shi"],
      ["za", "zha"],
      ["ca", "cha"],
      ["sa", "sha"],
      ["zi", "ci"],
    ],
  },
  {
    id: "y-w",
    order: 8,
    title: "y w",
    titleZh: "y w",
    emoji: "🔁",
    intro: "i, u, ü үеийн эхэнд ирвэл y/w болж бичигдэнэ: yi wu yu. Энэ бол бичлэгийн дүрэм — дуу нь ижил.",
    introZh: "i、u、ü 在音节开头写作 y/w：yi wu yu。这是拼写规则，读音不变。",
    items: [
      { letter: "y", syl: "yi", exampleHanzi: "医", examplePinyin: "yī", exampleMn: "эмч", tip: "«Й» — i үеийн эхэнд ирвэл y болно (i → yi, ia → ya, ie → ye). ü эхэнд ирвэл yu (цэг унана)." },
      { letter: "w", syl: "wu", exampleHanzi: "屋", examplePinyin: "wū", exampleMn: "байшин, өрөө", tip: "«В/у» — уруул дугуй. u үеийн эхэнд ирвэл w болно (u → wu, ua → wa, uo → wo)." },
    ],
    blend: { initials: ["y", "w"], finals: ["i", "a", "e", "o", "u", "ü"] },
    pairs: [
      ["yi", "wu"],
      ["ya", "wa"],
      ["ye", "yue"],
      ["wo", "wu"],
    ],
  },
  {
    id: "davhar-egshig",
    order: 9,
    title: "Давхар эгшиг",
    titleZh: "复韵母",
    emoji: "🎶",
    intro: "9 давхар эгшиг: ai ei ui ao ou iu ie üe er. Хоёр эгшгийг нэг хөдөлгөөнөөр шилжүүлж хэлнэ — тусад нь биш.",
    introZh: "9 个复韵母：ai ei ui ao ou iu ie üe er。两个元音一气滑过去，不能分开读。",
    items: [
      { letter: "ai", syl: "ai", exampleHanzi: "爱", examplePinyin: "ài", exampleMn: "хайрлах", tip: "«Ай» биш — «а»-гаас «и» рүү зөөлөн шилжинэ. Хоёр эгшгийг нэг хөдөлгөөнөөр." },
      { letter: "ei", syl: "ei", exampleHanzi: "诶", examplePinyin: "éi", exampleMn: "ээ — дуудах", tip: "«Э»-ээс «и» рүү зөөлөн шилжинэ, «эй» шиг." },
      { letter: "ui", syl: "wei", exampleHanzi: "威", examplePinyin: "wēi", exampleMn: "сүр хүч", tip: "ui = uei. «Уй» биш, «уэй» — дунд нь нуугдсан «э» бий." },
      { letter: "ao", syl: "ao", exampleHanzi: "袄", examplePinyin: "ǎo", exampleMn: "хүрэм", tip: "«А»-гаас «о/у» рүү: ам томоос дугуй руу зөөлөн хаагдана." },
      { letter: "ou", syl: "ou", exampleHanzi: "欧", examplePinyin: "ōu", exampleMn: "Европ", tip: "«О»-гоос «у» рүү: уруул улам дугуйрна." },
      { letter: "iu", syl: "you", exampleHanzi: "优", examplePinyin: "yōu", exampleMn: "сайн, шилдэг", tip: "iu = iou. «Иу» биш, «иоу» — дунд нь нуугдсан «о» бий." },
      { letter: "ie", syl: "ye", exampleHanzi: "耶", examplePinyin: "yē", exampleMn: "ээ — баяр", tip: "«Иэ» — «и»-гээс «э» рүү. Энэ e нь энгийн «э» (ганц e шиг «ө» биш)." },
      { letter: "üe", syl: "yue", exampleHanzi: "月", examplePinyin: "yuè", exampleMn: "сар", tip: "«Үэ» — «ү»-гээс «э» рүү. j q x y-ийн дараа цэг нь унана (yue, jue, que, xue)." },
      { letter: "er", syl: "er", exampleHanzi: "耳", examplePinyin: "ěr", exampleMn: "чих", tip: "Хэл эргэсэн «ар» (儿). «Э/а» хэлээд хэлний үзүүрийг дээш эргүүлнэ. Гийгүүлэгчтэй нийлдэггүй." },
    ],
    blend: { initials: ["b", "p", "m", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x"], finals: ["ai", "ei", "ao", "ou", "ie", "üe"] },
    pairs: [
      ["ai", "ei"],
      ["ao", "ou"],
      ["you", "wei"],
      ["ye", "yue"],
    ],
  },
  {
    id: "urd-hamar",
    order: 10,
    title: "Урд хамрын эгшиг",
    titleZh: "前鼻韵母",
    emoji: "👃",
    intro: "5 урд хамрын эгшиг: an en in un ün. Төгсгөлд хэлний үзүүр дээд буйланд хүрч «н» — монгол «н» шиг.",
    introZh: "5 个前鼻韵母：an en in un ün。收音时舌尖抵住上齿龈，发 n。",
    items: [
      { letter: "an", syl: "an", exampleHanzi: "安", examplePinyin: "ān", exampleMn: "амар", tip: "«Ан» — төгсгөлд хэлний үзүүр дээд буйланд хүрч «н» (монгол «н» шиг). Ам томоос хаагдана." },
      { letter: "en", syl: "en", exampleHanzi: "嗯", examplePinyin: "ēn", exampleMn: "ммм — зөвшөөрөл", tip: "«Эн» — «ө/э»-ийн дунд эгшиг + «н». Хэлний үзүүр дээд буйланд." },
      { letter: "in", syl: "yin", exampleHanzi: "音", examplePinyin: "yīn", exampleMn: "дуу, авиа", tip: "«Ин» — инээмсэглэсэн уруул + «н». Хэлний үзүүр дээд буйланд." },
      { letter: "un", syl: "wen", exampleHanzi: "温", examplePinyin: "wēn", exampleMn: "бүлээн", tip: "un = uen. «Ун» биш, «уэн» — дунд нь нуугдсан «э» бий. Ганцаараа wen гэж бичнэ." },
      { letter: "ün", syl: "yun", exampleHanzi: "云", examplePinyin: "yún", exampleMn: "үүл", tip: "«Үн» — монгол «ү» + «н». Ганцаараа yun (цэг унана), j q x-ийн дараа ч цэггүй: jun qun xun." },
    ],
    blend: { initials: ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x"], finals: ["an", "en", "in", "un", "ün"] },
    pairs: [
      ["an", "en"],
      ["yin", "yun"],
      ["wen", "yun"],
      ["ban", "ben"],
      ["lin", "lun"],
    ],
  },
  {
    id: "hoid-hamar",
    order: 11,
    title: "Хойд хамрын эгшиг",
    titleZh: "后鼻韵母",
    emoji: "🔔",
    intro: "4 хойд хамрын эгшиг: ang eng ing ong. Төгсгөлд хэлний уг тагнайн ар руу — монгол «нг» (аң). Хэлний үзүүр хүрэхгүй! Монголчуудын гол ялгаа: an/ang, en/eng, in/ing.",
    introZh: "4 个后鼻韵母：ang eng ing ong。收音时舌根抵软腭，发 ng，舌尖不碰上腭。难点：an/ang、en/eng、in/ing。",
    items: [
      { letter: "ang", syl: "ang", exampleHanzi: "昂", examplePinyin: "áng", exampleMn: "өндийх", tip: "«Аң» — төгсгөлд хэлний уг тагнайн ар руу, монгол «нг» шиг. Хэлний үзүүр хүрэхгүй! (an = хэлний үзүүр, ang = хэлний уг)" },
      { letter: "eng", syl: "eng", exampleHanzi: "亨", examplePinyin: "hēng", exampleMn: "амжилттай (эгшиг нь 亨-д)", tip: "«Эң» — «ө/э»-ийн дунд эгшиг + «нг». Хэлний уг тагнайн ар руу. en/eng-ийг ялга!" },
      { letter: "ing", syl: "ying", exampleHanzi: "鹰", examplePinyin: "yīng", exampleMn: "бүргэд", tip: "«Иң» — инээмсэглэсэн уруул + «нг». in/ing — монголчуудын хамгийн их андуурдаг хос." },
      { letter: "ong", syl: "hong", exampleHanzi: "轰", examplePinyin: "hōng", exampleMn: "нижигнэх", tip: "«Уң» — уруул дугуй + «нг». Ганцаараа үе болдоггүй, үргэлж гийгүүлэгчтэй: hong, dong, zhong." },
    ],
    blend: { initials: ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h"], finals: ["ang", "eng", "ing", "ong"] },
    pairs: [
      ["an", "ang"],
      ["en", "eng"],
      ["yin", "ying"],
      ["ban", "bang"],
      ["fen", "feng"],
      ["lin", "ling"],
    ],
  },
  {
    id: "buhel-ue",
    order: 12,
    title: "Бүхэл үе",
    titleZh: "整体认读音节",
    emoji: "🧩",
    intro: "16 бүхэл үе: 拼读 хийхгүй, бүхлээр нь цээжилнэ. zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying.",
    introZh: "16 个整体认读音节：不拼读，整体记住。zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying。",
    items: [
      { letter: "zhi", syl: "zhi", exampleHanzi: "知", examplePinyin: "zhī", exampleMn: "мэдэх", tip: "Бүхлээр нь цээжил. zh + «ы» шиг богино i, хэл эргэсэн. 拼读 хийхгүй." },
      { letter: "chi", syl: "chi", exampleHanzi: "吃", examplePinyin: "chī", exampleMn: "идэх", tip: "Бүхлээр нь цээжил. ch + «ы» шиг богино i, хэл эргэсэн." },
      { letter: "shi", syl: "shi", exampleHanzi: "是", examplePinyin: "shì", exampleMn: "тийм, байх", tip: "Бүхлээр нь цээжил. sh + «ы» шиг богино i, хэл эргэсэн." },
      { letter: "ri", syl: "ri", exampleHanzi: "日", examplePinyin: "rì", exampleMn: "нар, өдөр", tip: "Бүхлээр нь цээжил. r + «ы» шиг богино i. Монгол «р» шиг чичрэхгүй." },
      { letter: "zi", syl: "zi", exampleHanzi: "字", examplePinyin: "zì", exampleMn: "үсэг, ханз", tip: "Бүхлээр нь цээжил. z + «ы» шиг богино i, хэл тэгш." },
      { letter: "ci", syl: "ci", exampleHanzi: "词", examplePinyin: "cí", exampleMn: "үг", tip: "Бүхлээр нь цээжил. c + «ы» шиг богино i, хэл тэгш." },
      { letter: "si", syl: "si", exampleHanzi: "四", examplePinyin: "sì", exampleMn: "дөрөв", tip: "Бүхлээр нь цээжил. s + «ы» шиг богино i, хэл тэгш." },
      { letter: "yi", syl: "yi", exampleHanzi: "一", examplePinyin: "yī", exampleMn: "нэг", tip: "Бүхлээр нь цээжил. Энэ бол i эгшиг өөрөө — «и»." },
      { letter: "wu", syl: "wu", exampleHanzi: "五", examplePinyin: "wǔ", exampleMn: "тав", tip: "Бүхлээр нь цээжил. Энэ бол u эгшиг өөрөө — «у»." },
      { letter: "yu", syl: "yu", exampleHanzi: "鱼", examplePinyin: "yú", exampleMn: "загас", tip: "Бүхлээр нь цээжил. Энэ бол ü эгшиг өөрөө — «ү» (цэг унасан)." },
      { letter: "ye", syl: "ye", exampleHanzi: "叶", examplePinyin: "yè", exampleMn: "навч", tip: "Бүхлээр нь цээжил. ie эгшиг — «иэ»." },
      { letter: "yue", syl: "yue", exampleHanzi: "月", examplePinyin: "yuè", exampleMn: "сар", tip: "Бүхлээр нь цээжил. üe эгшиг — «үэ»." },
      { letter: "yuan", syl: "yuan", exampleHanzi: "圆", examplePinyin: "yuán", exampleMn: "дугуй", tip: "Бүхлээр нь цээжил. üan эгшиг — «үэн» (а нь «э» шиг сонсогдоно)." },
      { letter: "yin", syl: "yin", exampleHanzi: "音", examplePinyin: "yīn", exampleMn: "дуу, авиа", tip: "Бүхлээр нь цээжил. in эгшиг — «ин»." },
      { letter: "yun", syl: "yun", exampleHanzi: "云", examplePinyin: "yún", exampleMn: "үүл", tip: "Бүхлээр нь цээжил. ün эгшиг — «үн»." },
      { letter: "ying", syl: "ying", exampleHanzi: "鹰", examplePinyin: "yīng", exampleMn: "бүргэд", tip: "Бүхлээр нь цээжил. ing эгшиг — «иң» (хэлний уг)." },
    ],
    pairs: [
      ["zhi", "zi"],
      ["chi", "ci"],
      ["shi", "si"],
      ["shi", "ri"],
      ["yi", "yu"],
      ["ye", "yue"],
      ["yin", "yun"],
      ["yin", "ying"],
      ["wu", "yu"],
    ],
  },
  {
    id: "durem",
    order: 13,
    title: "Дүрэм",
    titleZh: "拼写规则",
    emoji: "📏",
    intro: "Пиньинь бичих, унших 7 дүрэм. Карт бүрийг уншаад жишээг нь сонс.",
    introZh: "拼音的 7 条拼写规则。读卡片，听例子。",
    items: [],
    rules: [
      {
        title: "Аялгын тэмдэг хаана байх вэ?",
        titleZh: "声调标在哪里？",
        body: "a байвал a дээр. a байхгүй бол o эсвэл e дээр. iu / ui дээр — сүүлийнх нь дээр (iū, uī). Дараалал: a > o = e > i/u — аль сүүлд ирсэн нь.",
        bodyZh: "有 a 标 a；没 a 标 o 或 e；iu、ui 标在后面那个上。顺序：a > o = e > i/u。",
        examples: [
          { text: "好", pinyin: "hǎo", mn: "сайн", syl: "hao", tone: 3 },
          { text: "六", pinyin: "liù", mn: "зургаа", syl: "liu", tone: 4 },
          { text: "水", pinyin: "shuǐ", mn: "ус", syl: "shui", tone: 3 },
          { text: "写", pinyin: "xiě", mn: "бичих", syl: "xie", tone: 3 },
        ],
      },
      {
        title: "ü-ийн цэг унана",
        titleZh: "ü 上两点省略",
        body: "j q x y-ийн дараа ü-ийн цэг унана: ju qu xu yu (гэхдээ «ү» гэж уншина!). n l-ийн дараа цэг хэвээр: nü lü («у»-тай ялгахын тулд).",
        bodyZh: "j q x y 后面的 ü 省略两点：ju qu xu yu（仍读 ü）。n l 后面保留：nü lü。",
        examples: [
          { text: "去", pinyin: "qù", mn: "явах", syl: "qu", tone: 4 },
          { text: "鱼", pinyin: "yú", mn: "загас", syl: "yu", tone: 2 },
          { text: "女", pinyin: "nǚ", mn: "эмэгтэй", syl: "nü", tone: 3 },
          { text: "绿", pinyin: "lǜ", mn: "ногоон", syl: "lü", tone: 4 },
        ],
      },
      {
        title: "y / w бичих дүрэм",
        titleZh: "y / w 的拼写",
        body: "Гийгүүлэгчгүй үе i-ээр эхэлбэл y, u-гаар эхэлбэл w нэмнэ: i→yi, ia→ya, u→wu, uo→wo, ü→yu, üe→yue. Дуу нь өөрчлөгдөхгүй.",
        bodyZh: "零声母音节：i 开头加 y，u 开头加 w，ü 开头写 yu。读音不变。",
        examples: [
          { text: "衣", pinyin: "yī", mn: "хувцас", syl: "yi", tone: 1 },
          { text: "鸭", pinyin: "yā", mn: "нугас", syl: "ya", tone: 1 },
          { text: "我", pinyin: "wǒ", mn: "би", syl: "wo", tone: 3 },
          { text: "月", pinyin: "yuè", mn: "сар", syl: "yue", tone: 4 },
        ],
      },
      {
        title: "3-р аялгуу хоёр дараалбал",
        titleZh: "三声变调",
        body: "3 + 3 → эхнийх нь 2-р аялгуу болно: nǐ hǎo → ní hǎo. Бичихдээ ˇ хэвээр, зөвхөн уншихад өөрчлөгдөнө.",
        bodyZh: "两个三声相连，前一个读第二声：nǐ hǎo → ní hǎo。书写不变。",
        examples: [
          { text: "你好", pinyin: "nǐ hǎo", mn: "сайн уу (уншихдаа ní hǎo)" },
          { text: "很好", pinyin: "hěn hǎo", mn: "маш сайн (hén hǎo)" },
          { text: "你", pinyin: "nǐ", mn: "чи", syl: "ni", tone: 3 },
          { text: "好", pinyin: "hǎo", mn: "сайн", syl: "hao", tone: 3 },
        ],
      },
      {
        title: "一 ба 不 аялгуу солино",
        titleZh: "一、不 的变调",
        body: "一 yī: 4-р аялгуугийн өмнө yí (一个 yí ge), бусад аялгуугийн өмнө yì (一天 yì tiān). 不 bù: 4-р аялгуугийн өмнө bú (不是 bú shì).",
        bodyZh: "一：四声前读 yí，其他声前读 yì。不：四声前读 bú。",
        examples: [
          { text: "一", pinyin: "yī", mn: "нэг", syl: "yi", tone: 1 },
          { text: "一个", pinyin: "yí ge", mn: "нэг ширхэг" },
          { text: "不", pinyin: "bù", mn: "үгүй", syl: "bu", tone: 4 },
          { text: "不是", pinyin: "bú shì", mn: "биш" },
        ],
      },
      {
        title: "儿化 — сүүлд «r»",
        titleZh: "儿化",
        body: "Зарим үгийн төгсгөлд 儿 нэмэгдэж хэл эргэнэ: 花 huā → 花儿 huār, 玩 wán → 玩儿 wánr (n унана). Бээжингийн аялгад их.",
        bodyZh: "词尾加 儿，卷舌：花儿 huār、玩儿 wánr。北京话常见。",
        examples: [
          { text: "儿", pinyin: "ér", mn: "хүү", syl: "er", tone: 2 },
          { text: "花儿", pinyin: "huār", mn: "цэцэг" },
          { text: "玩儿", pinyin: "wánr", mn: "тоглох" },
          { text: "花", pinyin: "huā", mn: "цэцэг", syl: "hua", tone: 1 },
        ],
      },
      {
        title: "Тусгаарлах тэмдэг ’",
        titleZh: "隔音符号",
        body: "a o e-ээр эхэлсэн үе өмнөх үетэй нийлж хоёрдмол утгатай болбол ’ тавина: xī'ān (西安 — хот) ≠ xiān (先 — эхлээд).",
        bodyZh: "a o e 开头的音节接在其他音节后面，用 ’ 隔开：xī'ān ≠ xiān。",
        examples: [
          { text: "西安", pinyin: "xī'ān", mn: "Шиань хот" },
          { text: "先", pinyin: "xiān", mn: "эхлээд", syl: "xian", tone: 1 },
          { text: "西", pinyin: "xī", mn: "баруун", syl: "xi", tone: 1 },
          { text: "安", pinyin: "ān", mn: "амар", syl: "an", tone: 1 },
        ],
      },
    ],
  },
];

export function getCourseUnit(id: string): CourseUnit | undefined {
  return PINYIN_COURSE.find((u) => u.id === id);
}

export function nextCourseUnit(id: string): CourseUnit | undefined {
  const i = PINYIN_COURSE.findIndex((u) => u.id === id);
  return i >= 0 ? PINYIN_COURSE[i + 1] : undefined;
}

/** Дүрмийн нэгжийн шалгалтын асуултууд (аудиогүй — бичлэг сонгох) */
export type RuleQuestion = { q: string; qZh: string; options: string[]; answer: number };

export const RULE_QUESTIONS: RuleQuestion[] = [
  { q: "«хайрлах» 爱 — аль нь зөв?", qZh: "爱 — 哪个对？", options: ["ài", "aì"], answer: 0 },
  { q: "«зургаа» 六 — аль нь зөв?", qZh: "六 — 哪个对？", options: ["líu", "liú"], answer: 1 },
  { q: "«ус» 水 — аль нь зөв?", qZh: "水 — 哪个对？", options: ["shuǐ", "shǔi"], answer: 0 },
  { q: "«явах» 去 — аль нь зөв?", qZh: "去 — 哪个对？", options: ["qǜ", "qù"], answer: 1 },
  { q: "«эмэгтэй» 女 — аль нь зөв?", qZh: "女 — 哪个对？", options: ["nǚ", "nǔ"], answer: 0 },
  { q: "«хувцас» 衣 (i ганцаараа) — аль нь зөв?", qZh: "衣 — 哪个对？", options: ["ī", "yī"], answer: 1 },
  { q: "«би» 我 (uo ганцаараа) — аль нь зөв?", qZh: "我 — 哪个对？", options: ["wǒ", "uǒ"], answer: 0 },
  { q: "nǐ hǎo — уншихдаа?", qZh: "nǐ hǎo 怎么读？", options: ["nǐ hǎo", "ní hǎo"], answer: 1 },
  { q: "不是 — уншихдаа?", qZh: "不是 怎么读？", options: ["bú shì", "bù shì"], answer: 0 },
  { q: "一个 — уншихдаа?", qZh: "一个 怎么读？", options: ["yī ge", "yí ge"], answer: 1 },
  { q: "西安 (хот) — аль нь зөв?", qZh: "西安 — 哪个对？", options: ["xī'ān", "xiān"], answer: 0 },
  { q: "花儿 — аль нь зөв?", qZh: "花儿 — 哪个对？", options: ["huāér", "huār"], answer: 1 },
];
