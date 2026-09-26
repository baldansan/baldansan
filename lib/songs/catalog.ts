/**
 * Дуу — «Дуу ба бичлэг» хэсгийн дууны сан.
 * Жил бүрийн хит дуу (2000–2026) болон хүүхдийн дуу (儿歌).
 * АНХААР: зохиогчийн эрхтэй дууны үгийг бүтнээр хадгалахгүй — албан ёсны видео холбоос,
 * шинэ үг, утгын тайлбар л оруулна. Уламжлалт 儿歌 (эрх чөлөөтэй) үгтэй байж болно.
 */
export type SongKind = "hit" | "kids";

export type SongVocab = { zh: string; pinyin: string; mn: string; zhGloss?: string };

export type Song = {
  id: string;
  titleZh: string;
  titlePinyin?: string;
  artistZh?: string;
  year: number;
  kind: SongKind;
  /** Албан ёсны видео (YouTube / Bilibili) */
  videoUrl?: string;
  /** HSK түвшин (ойролцоо) */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Уламжлалт/эрх чөлөөтэй дууны үг (мөрөөр) */
  lyrics?: Array<{ zh: string; pinyin?: string; mn?: string }>;
  vocab?: SongVocab[];
  noteZh?: string;
  noteMn?: string;
};

export const SONG_YEAR_MIN = 2000;
export const SONG_YEAR_MAX = 2026;

/** Эхний сан — дараа нь admin/JSON-оос нэмэгдэнэ. */
export const SONGS: Song[] = [
  {
    id: "liang-zhi-laohu",
    titleZh: "两只老虎",
    titlePinyin: "Liǎng zhī lǎohǔ",
    year: 2000,
    kind: "kids",
    level: 1,
    noteZh: "传统儿歌（旋律来自法国童谣）。",
    noteMn: "Уламжлалт хүүхдийн дуу (аялгуу нь Францын хүүхдийн дуунаас).",
    vocab: [
      { zh: "老虎", pinyin: "lǎohǔ", mn: "бар" },
      { zh: "跑", pinyin: "pǎo", mn: "гүйх" },
      { zh: "快", pinyin: "kuài", mn: "хурдан" },
      { zh: "眼睛", pinyin: "yǎnjing", mn: "нүд" },
      { zh: "尾巴", pinyin: "wěiba", mn: "сүүл" },
      { zh: "奇怪", pinyin: "qíguài", mn: "хачин" },
    ],
  },
  {
    id: "xiao-xingxing",
    titleZh: "小星星",
    titlePinyin: "Xiǎo xīngxing",
    year: 2000,
    kind: "kids",
    level: 1,
    noteZh: "传统儿歌（Twinkle, Twinkle, Little Star 中文版）。",
    noteMn: "Уламжлалт хүүхдийн дуу (Twinkle, Twinkle, Little Star хятад хувилбар).",
    vocab: [
      { zh: "星星", pinyin: "xīngxing", mn: "од" },
      { zh: "天空", pinyin: "tiānkōng", mn: "тэнгэр" },
      { zh: "亮", pinyin: "liàng", mn: "гэрэлтэх" },
      { zh: "眼睛", pinyin: "yǎnjing", mn: "нүд" },
    ],
  },
  {
    id: "shu-yazi",
    titleZh: "数鸭子",
    titlePinyin: "Shǔ yāzi",
    year: 2000,
    kind: "kids",
    level: 1,
    noteZh: "传统儿歌，练习数数。",
    noteMn: "Уламжлалт хүүхдийн дуу, тоо тоолох дасгал.",
    vocab: [
      { zh: "鸭子", pinyin: "yāzi", mn: "нугас" },
      { zh: "数", pinyin: "shǔ", mn: "тоолох" },
      { zh: "门前", pinyin: "ménqián", mn: "хаалганы өмнө" },
      { zh: "大桥", pinyin: "dàqiáo", mn: "том гүүр" },
    ],
  },
  {
    id: "zhao-pengyou",
    titleZh: "找朋友",
    titlePinyin: "Zhǎo péngyou",
    year: 2000,
    kind: "kids",
    level: 1,
    noteZh: "传统儿歌，课堂互动游戏常用。",
    noteMn: "Уламжлалт хүүхдийн дуу, ангийн тоглоомд өргөн хэрэглэдэг.",
    vocab: [
      { zh: "朋友", pinyin: "péngyou", mn: "найз" },
      { zh: "找", pinyin: "zhǎo", mn: "хайх" },
      { zh: "敬礼", pinyin: "jìnglǐ", mn: "ёсолох" },
      { zh: "握手", pinyin: "wòshǒu", mn: "гар барих" },
      { zh: "再见", pinyin: "zàijiàn", mn: "баяртай" },
    ],
  },
  {
    id: "xin-nian-hao",
    titleZh: "新年好",
    titlePinyin: "Xīnnián hǎo",
    year: 2000,
    kind: "kids",
    level: 1,
    noteZh: "传统新年儿歌。",
    noteMn: "Уламжлалт шинэ жилийн хүүхдийн дуу.",
    vocab: [
      { zh: "新年", pinyin: "xīnnián", mn: "шинэ жил" },
      { zh: "祝贺", pinyin: "zhùhè", mn: "баяр хүргэх" },
      { zh: "大家", pinyin: "dàjiā", mn: "бүгд" },
      { zh: "唱歌", pinyin: "chànggē", mn: "дуулах" },
      { zh: "跳舞", pinyin: "tiàowǔ", mn: "бүжиглэх" },
    ],
  },
];

export function songsByYear(year: number): Song[] {
  return SONGS.filter((s) => s.year === year);
}
