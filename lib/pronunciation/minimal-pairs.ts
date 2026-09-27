/**
 * «Ойрхон дуу (近音辨析)» — хамгийн бага хос (minimal pairs).
 * Бүлэг бүр үндсэн (тэмдэггүй) үеүдийн хосыг жагсаана; аялга нь ижил байна.
 * Аль үе, аль аялга нь pinyin_chart.json-д байгааг `resolvePairGroups` шалгаад
 * байхгүйг нь хаяна (build/runtime баталгаа).
 */
import { toneMark } from "./pinyin-mark";

export type PairItem = {
  /** 2 (эсвэл 3) үндсэн үе — ижил аялгаар */
  syllables: string[];
  /** Өгвөл үе бүрийн аялга тус тусдаа (2 vs 3-р аялгын бүлэгт); өгөхгүй бол ижил */
  tones?: number[];
};

export type PairGroup = {
  id: string;
  /** "z / zh" */
  label: string;
  mn: string;
  zh: string;
  items: PairItem[];
};

export const PAIR_GROUPS: PairGroup[] = [
  {
    id: "z-zh",
    label: "z / zh",
    mn: "Хэл шүдний ард · хэл эргэсэн",
    zh: "平舌 · 翘舌",
    items: [
      ["zi", "zhi"], ["za", "zha"], ["zao", "zhao"], ["zan", "zhan"], ["zang", "zhang"],
      ["zu", "zhu"], ["zuo", "zhuo"], ["zen", "zhen"], ["zeng", "zheng"], ["zong", "zhong"],
      ["zai", "zhai"], ["zou", "zhou"], ["zui", "zhui"], ["zun", "zhun"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "c-ch",
    label: "c / ch",
    mn: "Хэл шүдний ард · хэл эргэсэн",
    zh: "平舌 · 翘舌",
    items: [
      ["ci", "chi"], ["ca", "cha"], ["cao", "chao"], ["can", "chan"], ["cang", "chang"],
      ["cu", "chu"], ["cuo", "chuo"], ["cen", "chen"], ["ceng", "cheng"], ["cong", "chong"],
      ["cai", "chai"], ["cou", "chou"], ["cui", "chui"], ["cun", "chun"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "s-sh",
    label: "s / sh",
    mn: "Хэл шүдний ард · хэл эргэсэн",
    zh: "平舌 · 翘舌",
    items: [
      ["si", "shi"], ["sa", "sha"], ["sao", "shao"], ["san", "shan"], ["sang", "shang"],
      ["su", "shu"], ["suo", "shuo"], ["sen", "shen"], ["seng", "sheng"], ["sai", "shai"],
      ["sou", "shou"], ["sui", "shui"], ["sun", "shun"], ["suan", "shuan"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "n-l",
    label: "n / l",
    mn: "Хамрын n · хэлний l",
    zh: "鼻音 n · 边音 l",
    items: [
      ["na", "la"], ["ni", "li"], ["nu", "lu"], ["nü", "lü"], ["nan", "lan"], ["nang", "lang"],
      ["nao", "lao"], ["nei", "lei"], ["neng", "leng"], ["nian", "lian"], ["niang", "liang"],
      ["niao", "liao"], ["nin", "lin"], ["ning", "ling"], ["niu", "liu"], ["nong", "long"],
      ["nuo", "luo"], ["nai", "lai"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "j-q-x",
    label: "j / q / x",
    mn: "Хэлний нурууны j q x",
    zh: "舌面音 j q x",
    items: [
      ["ji", "qi", "xi"], ["jia", "qia", "xia"], ["jian", "qian", "xian"], ["jiang", "qiang", "xiang"],
      ["jiao", "qiao", "xiao"], ["jie", "qie", "xie"], ["jin", "qin", "xin"], ["jing", "qing", "xing"],
      ["jiu", "qiu", "xiu"], ["ju", "qu", "xu"], ["juan", "quan", "xuan"], ["jue", "que", "xue"],
      ["jun", "qun", "xun"], ["jiong", "qiong", "xiong"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "in-ing",
    label: "in / ing",
    mn: "Урд n · хойд ng",
    zh: "前鼻音 · 后鼻音",
    items: [
      ["bin", "bing"], ["pin", "ping"], ["min", "ming"], ["din", "ding"], ["lin", "ling"],
      ["jin", "jing"], ["qin", "qing"], ["xin", "xing"], ["yin", "ying"], ["nin", "ning"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "an-ang",
    label: "an / ang",
    mn: "Урд n · хойд ng",
    zh: "前鼻音 · 后鼻音",
    items: [
      ["ban", "bang"], ["pan", "pang"], ["man", "mang"], ["fan", "fang"], ["dan", "dang"],
      ["tan", "tang"], ["lan", "lang"], ["gan", "gang"], ["kan", "kang"], ["han", "hang"],
      ["zhan", "zhang"], ["chan", "chang"], ["shan", "shang"], ["ran", "rang"], ["zan", "zang"],
      ["san", "sang"], ["wan", "wang"], ["yan", "yang"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "en-eng",
    label: "en / eng",
    mn: "Урд n · хойд ng",
    zh: "前鼻音 · 后鼻音",
    items: [
      ["ben", "beng"], ["pen", "peng"], ["men", "meng"], ["fen", "feng"], ["gen", "geng"],
      ["ken", "keng"], ["hen", "heng"], ["zhen", "zheng"], ["chen", "cheng"], ["shen", "sheng"],
      ["ren", "reng"], ["zen", "zeng"], ["sen", "seng"], ["wen", "weng"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "u-v",
    label: "ü / u",
    mn: "Уруул дугуй ü · u",
    zh: "ü · u",
    items: [
      ["nü", "nu"], ["lü", "lu"], ["ju", "zhu"], ["qu", "chu"], ["xu", "shu"], ["yu", "wu"],
      ["jue", "zhuo"], ["que", "chuo"], ["xue", "shuo"], ["juan", "zhuan"], ["quan", "chuan"],
      ["xuan", "shuan"], ["jun", "zhun"], ["qun", "chun"], ["xun", "shun"], ["lüe", "luo"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "b-p",
    label: "b / p",
    mn: "Амьсгалгүй b · амьсгалтай p",
    zh: "不送气 b · 送气 p",
    items: [
      ["ba", "pa"], ["bo", "po"], ["bi", "pi"], ["bu", "pu"], ["bai", "pai"], ["bei", "pei"],
      ["bao", "pao"], ["ban", "pan"], ["ben", "pen"], ["bang", "pang"], ["beng", "peng"],
      ["bian", "pian"], ["biao", "piao"], ["bie", "pie"], ["bin", "pin"], ["bing", "ping"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "d-t",
    label: "d / t",
    mn: "Амьсгалгүй d · амьсгалтай t",
    zh: "不送气 d · 送气 t",
    items: [
      ["da", "ta"], ["de", "te"], ["di", "ti"], ["du", "tu"], ["dai", "tai"], ["dao", "tao"],
      ["dou", "tou"], ["dan", "tan"], ["dang", "tang"], ["deng", "teng"], ["dong", "tong"],
      ["dian", "tian"], ["diao", "tiao"], ["die", "tie"], ["ding", "ting"], ["duan", "tuan"],
      ["dui", "tui"], ["dun", "tun"], ["duo", "tuo"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "g-k",
    label: "g / k",
    mn: "Амьсгалгүй g · амьсгалтай k",
    zh: "不送气 g · 送气 k",
    items: [
      ["ga", "ka"], ["ge", "ke"], ["gu", "ku"], ["gai", "kai"], ["gao", "kao"], ["gou", "kou"],
      ["gan", "kan"], ["gen", "ken"], ["gang", "kang"], ["geng", "keng"], ["gong", "kong"],
      ["gua", "kua"], ["guai", "kuai"], ["guan", "kuan"], ["guang", "kuang"], ["gui", "kui"],
      ["gun", "kun"], ["guo", "kuo"],
    ].map((syllables) => ({ syllables })),
  },
  {
    id: "t2-t3",
    label: "ˊ / ˇ",
    mn: "2-р ба 3-р аялгуу",
    zh: "第二声 · 第三声",
    items: [
      "ma", "ba", "da", "ta", "na", "la", "ha", "ka", "ya", "wa",
      "mi", "ni", "li", "ji", "qi", "xi", "yi", "shi", "zhi", "chi",
      "hao", "mao", "lao", "zhao", "bai", "mai", "lai", "kai",
      "hu", "wu", "yu", "lu", "shu", "chu", "zhu", "bu",
      "men", "ren", "shen", "wen", "yan", "lian", "qian", "xian",
    ].map((s) => ({ syllables: [s, s], tones: [2, 3] })),
  },
];

/* ---------- runtime баталгаа ---------- */

export type ChartCell = {
  initial: string;
  final: string;
  tones: Record<string, string>;
};

export type PinyinChart = {
  initials: string[];
  finals: string[];
  cells: Record<string, ChartCell>;
};

export type ResolvedCandidate = {
  syllable: string;
  tone: number;
  /** аялгын тэмдэгтэй */
  display: string;
  file: string;
};

export type ResolvedItem = {
  candidates: ResolvedCandidate[];
};

export type ResolvedGroup = Omit<PairGroup, "items"> & {
  items: ResolvedItem[];
};

/**
 * Бүлэг бүрийн хосуудыг самбарт (pinyin_chart.json) шалгана: бүх үе нь ижил
 * аялгатайгаар mp3-тэй байвал үлдээнэ. Аялга өгөөгүй хос → байгаа аялга бүрийг
 * тусдаа даалгавар болгоно (ma1/la1, ma2/la2 …). Хоосон бүлгийг хаяна.
 */
export function resolvePairGroups(chart: PinyinChart, groups: PairGroup[] = PAIR_GROUPS): ResolvedGroup[] {
  const out: ResolvedGroup[] = [];
  for (const g of groups) {
    const items: ResolvedItem[] = [];
    for (const it of g.items) {
      if (it.tones) {
        const cands: ResolvedCandidate[] = [];
        for (let i = 0; i < it.syllables.length; i++) {
          const file = chart.cells[it.syllables[i]]?.tones[String(it.tones[i])];
          if (!file) break;
          cands.push({
            syllable: it.syllables[i],
            tone: it.tones[i],
            display: toneMark(it.syllables[i], it.tones[i]),
            file,
          });
        }
        if (cands.length === it.syllables.length) items.push({ candidates: cands });
        continue;
      }
      for (const tone of [1, 2, 3, 4]) {
        const cands: ResolvedCandidate[] = [];
        for (const s of it.syllables) {
          const file = chart.cells[s]?.tones[String(tone)];
          if (!file) break;
          cands.push({ syllable: s, tone, display: toneMark(s, tone), file });
        }
        if (cands.length === it.syllables.length) items.push({ candidates: cands });
      }
    }
    if (items.length > 0) out.push({ id: g.id, label: g.label, mn: g.mn, zh: g.zh, items });
  }
  return out;
}
