/**
 * Хөгөөс болж утга нь өөрчлөгддөг хос үгс — үсэг (үе) нь ижил, хөг нь өөр.
 * «Хөг ялгах» тоглоомд: нэг үгийг асуухад нөгөөгийнх нь пиньинь заавал буруу
 * сонголтод орж, хариулсны дараа «тэгж хэлбэл … гэсэн үг» гэж тайлбарлана.
 */
import type { LearnWord } from "@/lib/games/learn-session";

type Side = [zh: string, pinyin: string, mn: string];

const PAIRS: [Side, Side][] = [
  [["熊猫", "xióngmāo", "панда баавгай"], ["胸毛", "xiōngmáo", "цээжний үс"]],
  [["实际", "shíjì", "бодит, жинхэнэ"], ["世纪", "shìjì", "зуун жил"]],
  [["睡觉", "shuìjiào", "унтах"], ["水饺", "shuǐjiǎo", "чанасан банш"]],
  [["眼睛", "yǎnjing", "нүд"], ["眼镜", "yǎnjìng", "нүдний шил"]],
  [["买", "mǎi", "худалдаж авах"], ["卖", "mài", "зарах"]],
  [["问", "wèn", "асуух"], ["吻", "wěn", "үнсэх"]],
  [["汤", "tāng", "шөл"], ["糖", "táng", "чихэр"]],
  [["杯子", "bēizi", "аяга"], ["被子", "bèizi", "хөнжил"]],
  [["老师", "lǎoshī", "багш"], ["老实", "lǎoshi", "номхон, шударга"]],
  [["教室", "jiàoshì", "анги танхим"], ["教师", "jiàoshī", "багш"]],
  [["北京", "běijīng", "Бээжин"], ["背景", "bèijǐng", "ар дэвсгэр"]],
  [["上海", "shànghǎi", "Шанхай"], ["伤害", "shānghài", "гэмтээх, хохироох"]],
  [["大衣", "dàyī", "пальто"], ["大意", "dàyì", "гол санаа"]],
  [["生气", "shēngqì", "уурлах"], ["升旗", "shēngqí", "туг мандуулах"]],
  [["通知", "tōngzhī", "мэдэгдэл"], ["同志", "tóngzhì", "нөхөр"]],
  [["联系", "liánxì", "холбоо барих"], ["练习", "liànxí", "дасгал хийх"]],
  [["经理", "jīnglǐ", "менежер"], ["经历", "jīnglì", "туулсан зүйл"]],
  [["时间", "shíjiān", "цаг хугацаа"], ["事件", "shìjiàn", "үйл явдал"]],
  [["语言", "yǔyán", "хэл"], ["预言", "yùyán", "зөгнөл"]],
  [["年级", "niánjí", "анги (хэддүгээр анги)"], ["年纪", "niánjì", "нас"]],
  [["知道", "zhīdào", "мэдэх"], ["指导", "zhǐdǎo", "зааж чиглүүлэх"]],
  [["鲜花", "xiānhuā", "шинэхэн цэцэг"], ["闲话", "xiánhuà", "хов жив"]],
  [["花费", "huāfèi", "зарцуулах"], ["化肥", "huàféi", "бордоо"]],
  [["题材", "tícái", "сэдэв"], ["体裁", "tǐcái", "төрөл зүйл"]],
];

/** Хос бүрийн хоёр талыг тус тусад нь асуух үг болгоно (id нь сөрөг — DB-д байхгүй). */
export function tonePairWords(): LearnWord[] {
  const out: LearnWord[] = [];
  PAIRS.forEach(([a, b], i) => {
    const make = (self: Side, other: Side, id: number): LearnWord =>
      ({
        id,
        simplified: self[0],
        pinyin: self[1],
        meaning_mn: self[2],
        confusable: { zh: other[0], pinyin: other[1], meaning: other[2] },
      }) as LearnWord;
    out.push(make(a, b, -(i * 2 + 1)), make(b, a, -(i * 2 + 2)));
  });
  return out;
}

/** Нэг тоглолтод: хос бүрээс нэг талыг нь санамсаргүй авна. */
export function pickTonePairSession(size = 10, firstWords?: string | null): LearnWord[] {
  const all = tonePairWords();
  // ?words=熊猫,睡觉 — эдгээр үгээр эхлүүлнэ (хуваалцах холбоос, танилцуулгад).
  const wanted = (firstWords ?? "").split(/[,，\s]+/).filter(Boolean);
  const head = wanted
    .map((zh) => all.find((w) => w.simplified === zh))
    .filter((w): w is LearnWord => Boolean(w));
  if (head.length > 0) {
    const used = new Set(head.map((w) => Math.ceil(-w.id / 2)));
    const rest = all.filter((w, i) => i % 2 === 0 && !used.has(Math.ceil(-w.id / 2)));
    return [...head, ...rest].slice(0, Math.max(size, head.length));
  }
  const picked: LearnWord[] = [];
  for (let i = 0; i < all.length; i += 2) picked.push(all[i + (Math.random() < 0.5 ? 0 : 1)]);
  for (let i = picked.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked.slice(0, size);
}
