import type {
  HskPackageTextSentence,
  HskPackageTextToken,
} from "@/types/hsk-lesson-package";

function isHanziChar(ch: string): boolean {
  return /[\u4e00-\u9fff]/.test(ch);
}

function tokensLookWordSized(tokens: HskPackageTextToken[]): boolean {
  return tokens.some((t) => /[\u4e00-\u9fff]{2,}/.test(t.zh));
}

function charPinyinAt(
  zh: string,
  start: number,
  length: number,
  sourceTokens: HskPackageTextToken[]
): string {
  const hanziPys: string[] = [];
  let tokIdx = 0;

  for (let i = 0; i < zh.length; i++) {
    const ch = zh[i]!;
    if (!isHanziChar(ch)) continue;
    const tok = sourceTokens[tokIdx];
    hanziPys.push(tok?.py || "");
    tokIdx += 1;
  }

  let hanziStart = 0;
  for (let i = 0; i < start && i < zh.length; i++) {
    if (isHanziChar(zh[i]!)) hanziStart += 1;
  }

  let hanziLen = 0;
  for (let i = start; i < start + length && i < zh.length; i++) {
    if (isHanziChar(zh[i]!)) hanziLen += 1;
  }

  return hanziPys.slice(hanziStart, hanziStart + hanziLen).join("");
}

/**
 * Merge per-hanzi tokens into vocabulary-sized words (e.g. 故+事 → 故事).
 * Author tokens with multi-hanzi units are kept as-is.
 */
export function coalesceSentenceTokens(
  sentence: HskPackageTextSentence,
  vocabWords: string[]
): HskPackageTextToken[] {
  const source = sentence.tokens ?? [];
  const zh = sentence.zh || source.map((t) => t.zh).join("");
  if (!zh) return source;
  if (source.length > 0 && tokensLookWordSized(source)) return source;

  const vocabList = [...new Set(vocabWords.map((w) => w.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length
  );

  const out: HskPackageTextToken[] = [];
  let i = 0;

  while (i < zh.length) {
    const ch = zh[i]!;
    if (!isHanziChar(ch)) {
      i += 1;
      continue;
    }

    let vocabHit: string | null = null;
    for (const word of vocabList) {
      if (zh.startsWith(word, i)) {
        vocabHit = word;
        break;
      }
    }

    if (vocabHit) {
      const py = charPinyinAt(zh, i, vocabHit.length, source);
      out.push({ zh: vocabHit, py });
      i += vocabHit.length;
      continue;
    }

    let j = i + 1;
    while (j < zh.length) {
      const next = zh[j]!;
      if (!isHanziChar(next)) break;
      if (vocabList.some((word) => zh.startsWith(word, j))) break;
      j += 1;
    }

    const slice = zh.slice(i, j);
    const py = charPinyinAt(zh, i, slice.length, source);
    out.push({ zh: slice, py });
    i = j;
  }

  return out.length > 0 ? out : source;
}
