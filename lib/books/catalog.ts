/**
 * Номын каталог — «Хичээл» руу орохдоо эхлээд ном сонгоно.
 * Одоогоор зөвхөн HSK标准教程 нээлттэй; бусад нь түгжээтэй (удахгүй).
 */
export type BookStatus = "open" | "locked";

export type BookEntry = {
  id: string;
  /** Хятад нэр — UI-ийн үндсэн хэл */
  titleZh: string;
  /** Монгол нэр (МН горимд) */
  titleMn: string;
  publisherZh: string;
  descriptionZh: string;
  descriptionMn: string;
  status: BookStatus;
  href: string | null;
  /** Хамрах түвшин/дэвтэр */
  volumesZh: string;
  audience: "adult" | "kids" | "korean";
  emoji: string;
};

export const BOOKS: BookEntry[] = [
  {
    id: "hsk-standard-course",
    titleZh: "HSK标准教程",
    titleMn: "HSK Standard Course",
    publisherZh: "北京语言大学出版社 · 姜丽萍 主编",
    descriptionZh: "1–6级共146课：课本、教师用书、练习册（含答案与听力文本）、HSK 3.0 补充内容。",
    descriptionMn: "1–6 түвшин, 146 хичээл: сурах бичиг, багшийн ном, дасгалын ном (хариулт, сонсголын бичвэртэй), HSK 3.0 нэмэлт.",
    status: "open",
    href: "/books/hsk-standard-course",
    volumesZh: "1 · 2 · 3 · 4上 · 4下 · 5上 · 5下 · 6上 · 6下",
    audience: "adult",
    emoji: "📘",
  },
  {
    id: "yct-standard-course",
    titleZh: "YCT标准教程（少儿）",
    titleMn: "YCT Standard Course (хүүхэд)",
    publisherZh: "北京语言大学出版社",
    descriptionZh: "少儿汉语考试YCT配套教材，1–6级。",
    descriptionMn: "Хүүхдийн YCT шалгалтын албан ёсны ном, 1–6 түвшин.",
    status: "locked",
    href: null,
    volumesZh: "1 · 2 · 3 · 4 · 5 · 6",
    audience: "kids",
    emoji: "🧒",
  },
  {
    id: "kuaile-hanyu",
    titleZh: "快乐汉语",
    titleMn: "Kuaile Hanyu (хүүхэд)",
    publisherZh: "人民教育出版社",
    descriptionZh: "面向中小学生的汉语教材，1–3册。",
    descriptionMn: "Бага, дунд сургуулийн сурагчдад зориулсан хятад хэлний ном, 1–3 дэвтэр.",
    status: "locked",
    href: null,
    volumesZh: "第一册 · 第二册 · 第三册",
    audience: "kids",
    emoji: "🎈",
  },
  {
    id: "developing-chinese",
    titleZh: "发展汉语",
    titleMn: "Developing Chinese",
    publisherZh: "北京语言大学出版社",
    descriptionZh: "综合、听力、口语、阅读、写作分册，初级–高级。",
    descriptionMn: "Нэгдсэн, сонсгол, яриа, уншлага, бичлэгийн дэвтрүүд, анхан–ахисан.",
    status: "locked",
    href: null,
    volumesZh: "初级 · 中级 · 高级",
    audience: "adult",
    emoji: "📗",
  },
  {
    id: "boya-chinese",
    titleZh: "博雅汉语",
    titleMn: "Boya Chinese",
    publisherZh: "北京大学出版社",
    descriptionZh: "初级起步篇 → 高级飞翔篇。",
    descriptionMn: "Анхан «起步篇»-ээс ахисан «飞翔篇» хүртэл.",
    status: "locked",
    href: null,
    volumesZh: "起步篇 · 加速篇 · 冲刺篇 · 飞翔篇",
    audience: "adult",
    emoji: "📙",
  },
  {
    id: "new-practical-chinese-reader",
    titleZh: "新实用汉语课本",
    titleMn: "New Practical Chinese Reader",
    publisherZh: "北京语言大学出版社 · 刘珣 主编",
    descriptionZh: "1–6册，经典综合教材。",
    descriptionMn: "1–6 дэвтэр, сонгодог нэгдсэн сурах бичиг.",
    status: "locked",
    href: null,
    volumesZh: "1 · 2 · 3 · 4 · 5 · 6",
    audience: "adult",
    emoji: "📕",
  },
  {
    id: "korean",
    titleZh: "韩国语课程",
    titleMn: "Солонгос хэлний курс",
    publisherZh: "Бөөндөө Сурцгаая",
    descriptionZh: "韩文字母、基础词汇、工作生活用语。",
    descriptionMn: "Солонгос үсэг, үндсэн үг, ажил амьдралд хэрэгтэй хэллэг.",
    status: "open",
    href: "/courses/korean-1",
    volumesZh: "Book 1 · Survival",
    audience: "korean",
    emoji: "🇰🇷",
  },
];

export const HSK_LEVELS = ["hsk1", "hsk2", "hsk3", "hsk4", "hsk5", "hsk6"] as const;
export type HskLevelId = (typeof HSK_LEVELS)[number];

export const HSK_LEVEL_META: Record<HskLevelId, { titleZh: string; wordsZh: string; booksZh: string; lessons: number }> = {
  hsk1: { titleZh: "一级", wordsZh: "150词", booksZh: "HSK标准教程1", lessons: 15 },
  hsk2: { titleZh: "二级", wordsZh: "300词", booksZh: "HSK标准教程2", lessons: 15 },
  hsk3: { titleZh: "三级", wordsZh: "600词", booksZh: "HSK标准教程3", lessons: 20 },
  hsk4: { titleZh: "四级", wordsZh: "1200词", booksZh: "HSK标准教程4上 · 4下", lessons: 20 },
  hsk5: { titleZh: "五级", wordsZh: "2500词", booksZh: "HSK标准教程5上 · 5下", lessons: 36 },
  hsk6: { titleZh: "六级", wordsZh: "5000词", booksZh: "HSK标准教程6上 · 6下", lessons: 40 },
};

export function isHskLevelId(v: string): v is HskLevelId {
  return (HSK_LEVELS as readonly string[]).includes(v);
}
