/**
 * Хадмалын үгийг «толь шиг» бүтнээр нь харуулах: Intl.Segmenter-ийн задалсан
 * хэсгүүдийг (ихэвчлэн ганц ханз, эсвэл 图书|馆 шиг тасархай) толь бичигт байгаа
 * 2–4 ханзтай үг болгон нийлүүлнэ. Цэвэр функц — DB-гүй, тест хийхэд хялбар.
 */

const CJK_ONLY = /^[一-鿿]+$/;
/** Нийлсэн үгийн хамгийн их урт (хэлц үг 4 ханз). */
export const MERGE_MAX_CHARS = 4;
/** Нэг үгэнд нийлэх хэсгийн хамгийн их тоо. */
const MERGE_MAX_PARTS = 4;
/** Туслах үгээр эхэлж/төгссөн нийлмэлийг зөвхөн HSK-ийн үг бол л зөвшөөрнө (的人, 了吗 гэх мэтээс сэргийлнэ). */
const PARTICLES = new Set(["的", "了", "吗", "呢", "吧", "啊", "着", "过", "得", "地", "呀", "嘛", "哦"]);

export type KnownWordKind = "hsk" | "lexicon";

/** Мөрийн хэсгүүдээс нийлж болзошгүй бүх хослол (DB-ээс шалгуулах нэр дэвшигчид). */
export function mergeCandidates(tokens: string[]): string[] {
  const out = new Set<string>();
  for (let i = 0; i < tokens.length; i += 1) {
    if (!CJK_ONLY.test(tokens[i])) continue;
    let joined = tokens[i];
    for (let n = 1; n < MERGE_MAX_PARTS && i + n < tokens.length; n += 1) {
      const next = tokens[i + n];
      if (!CJK_ONLY.test(next)) break;
      joined += next;
      if ([...joined].length > MERGE_MAX_CHARS) break;
      out.add(joined);
    }
  }
  return [...out];
}

/** Зүүнээс баруун тийш хамгийн урт таарах нийлмэлийг сонгоно. */
export function mergeTokens(tokens: string[], known: Map<string, KnownWordKind>): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    let picked = 1;
    if (CJK_ONLY.test(tokens[i])) {
      for (let n = Math.min(MERGE_MAX_PARTS, tokens.length - i); n >= 2; n -= 1) {
        const parts = tokens.slice(i, i + n);
        if (!parts.every((p) => CJK_ONLY.test(p))) continue;
        const joined = parts.join("");
        const chars = [...joined];
        if (chars.length > MERGE_MAX_CHARS) continue;
        const kind = known.get(joined);
        if (!kind) continue;
        const edgeParticle = PARTICLES.has(chars[0]) || PARTICLES.has(chars[chars.length - 1]);
        if (edgeParticle && kind !== "hsk") continue;
        picked = n;
        break;
      }
    }
    out.push(tokens.slice(i, i + picked).join(""));
    i += picked;
  }
  return out;
}

/**
 * Segmenter-ийн «想去», «我有», «一起去» зэрэг толинд байхгүй наалдмал хэсгийг
 * ханз ханзаар нь буцааж салгана — дараа нь mergeTokens толины үгээр дахин нийлүүлнэ.
 */
export function splitUnknown(tokens: string[], isKnown: (w: string) => boolean): string[] {
  const out: string[] = [];
  for (const t of tokens) {
    if (CJK_ONLY.test(t) && [...t].length >= 2 && !isKnown(t)) out.push(...t);
    else out.push(t);
  }
  return out;
}
