import challengeData from "@/data/radical_challenge_data.json";
import { shuffleArray } from "@/lib/games/game-data-core";
import type { RadicalGameEntry } from "@/lib/games/radical-game-data";
import {
  buildDecompositionParts,
  componentDisplayIcon,
  componentDisplayLabel,
  getCharBreakdownEntry,
  getCharBreakdownView,
  type CharBreakdownView,
} from "@/lib/hanzi/char-breakdown-data";
import {
  ensureServerBreakdownFullLoaded,
  getServerFullBreakdownEntry,
  getServerFullComponentMn,
} from "@/lib/hanzi/char-breakdown-full-server";
import {
  getSingleCharWordsByGlyphs,
  isSingleHanziWordText,
  type HskWord,
} from "@/lib/hsk";

const HANZI_RE = /[\u4e00-\u9fff]/;

function hanziGlyphs(text: string): string[] {
  return [...text.trim()].filter((ch) => HANZI_RE.test(ch));
}

type CharDisplayMeta = { pinyin: string; meaningMn: string };

function pinyinSyllableFromMultiCharWord(
  word: HskWord,
  charIndex: number
): string | null {
  const zh = word.simplified?.trim();
  const py = word.pinyin?.trim();
  if (!zh || !py) return null;
  const glyphs = hanziGlyphs(zh);
  if (glyphs.length <= 1) return null;
  const syllables = py.split(/\s+/).filter(Boolean);
  if (syllables.length !== glyphs.length) return null;
  return syllables[charIndex]?.trim() || null;
}

/** Per-glyph pinyin/meaning — never the parent multi-char word's full gloss. */
function resolveCharDisplayMeta(
  char: string,
  word: HskWord,
  charIndex: number,
  singleCharMap: Map<string, HskWord>
): CharDisplayMeta {
  const catalogChar = singleCharMap.get(char);
  if (catalogChar) {
    return {
      pinyin: catalogChar.pinyin?.trim() || "—",
      meaningMn: catalogChar.meaning_mn?.trim() || char,
    };
  }

  if (
    isSingleHanziWordText(word.simplified) &&
    word.simplified!.trim() === char
  ) {
    return {
      pinyin: word.pinyin?.trim() || "—",
      meaningMn: word.meaning_mn?.trim() || char,
    };
  }

  const componentLabel = componentDisplayLabel(char);
  const etymology = getCharBreakdownEntry(char)?.etymology_mn?.trim();
  const syllable = pinyinSyllableFromMultiCharWord(word, charIndex);

  return {
    pinyin: syllable || "—",
    meaningMn: componentLabel || etymology || char,
  };
}
const DISTRACTOR_POOL = challengeData.distractors as string[];

function pickDistractorGlyphs(
  answer: string[],
  count: number,
  extraPool: string[] = []
): string[] {
  const exclude = new Set(answer);
  const pool = [...new Set([...DISTRACTOR_POOL, ...extraPool])].filter(
    (g) => g && !exclude.has(g)
  );
  return shuffleArray(pool).slice(0, count);
}

function buildViewFromServerFull(char: string): CharBreakdownView | null {
  const entry = getServerFullBreakdownEntry(char);
  if (!entry?.c?.length) return null;

  const parts = entry.c
    .filter((comp) => comp.ch?.trim())
    .map((comp) => {
      const glyph = comp.ch.trim();
      const name =
        comp.mn?.trim() ||
        getServerFullComponentMn(glyph) ||
        componentDisplayLabel(glyph) ||
        "";
      return {
        c: glyph,
        name: name || "—",
        icon: componentDisplayIcon(glyph),
      };
    });

  if (parts.length < 2) return null;

  const radicalGlyph = entry.r?.trim();
  return {
    char,
    parts,
    structure: entry.s?.trim() || null,
    etymology_mn: entry.e?.trim() || null,
    radicalLine: radicalGlyph
      ? {
          glyph: radicalGlyph,
          labelMn:
            entry.rmn?.trim() ||
            getServerFullComponentMn(radicalGlyph) ||
            componentDisplayLabel(radicalGlyph) ||
            null,
        }
      : null,
  };
}

async function resolvePlayableCharView(
  char: string,
  wordRadical: string | null
): Promise<CharBreakdownView | null> {
  const hand = getCharBreakdownView(char);
  if (hand && hand.parts.length >= 2) return hand;

  const loaded = await ensureServerBreakdownFullLoaded();
  if (loaded) {
    const fromFull = buildViewFromServerFull(char);
    if (fromFull) return fromFull;
  }

  if (wordRadical?.trim() && hand?.parts.length) return hand;
  return null;
}

function entryFromView(
  view: CharBreakdownView,
  pinyin: string,
  meaningMn: string
): RadicalGameEntry | null {
  if (view.parts.length < 2) return null;

  const answer = view.parts.map((p) => p.c);
  const distractors = pickDistractorGlyphs(answer, Math.max(2, 6 - answer.length));
  const allGlyphs = shuffleArray([...answer, ...distractors]);
  const components = allGlyphs.map((glyph) => ({
    c: glyph,
    name: componentDisplayLabel(glyph) || glyph,
    icon: componentDisplayIcon(glyph),
  }));

  return {
    char: view.char,
    pinyin,
    meaning_mn: meaningMn,
    answer,
    structure: view.structure || "⿰",
    etymology_mn:
      view.etymology_mn?.trim() ||
      `${view.char} — ${meaningMn || view.char}`,
    options: allGlyphs,
    components,
    breakdown: buildDecompositionParts(answer),
  };
}

function expandEntryList(
  entries: RadicalGameEntry[],
  minSize: number,
  maxSize: number
): RadicalGameEntry[] {
  if (entries.length === 0) return [];
  const target = Math.min(maxSize, Math.max(minSize, entries.length));
  const out: RadicalGameEntry[] = [];
  let round = 0;
  while (out.length < target) {
    for (const entry of shuffleArray(entries)) {
      if (out.length >= target) break;
      out.push(entry);
    }
    round += 1;
    if (round > 12) break;
  }
  return out.slice(0, target);
}

/** Weak memorize words → radical decompose rounds (6–8 when possible). */
export async function buildRadicalEntriesFromWords(
  words: HskWord[],
  minSize = 6,
  maxSize = 8
): Promise<RadicalGameEntry[]> {
  const base: RadicalGameEntry[] = [];
  const seenChars = new Set<string>();
  const candidateByChar = new Map<
    string,
    { char: string; word: HskWord; charIndex: number }
  >();

  for (const word of words) {
    const zh = word.simplified?.trim();
    if (!zh) continue;
    const chars = hanziGlyphs(zh);
    const fromSingleCharWord = chars.length === 1;

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i]!;
      const existing = candidateByChar.get(char);
      if (
        !existing ||
        (fromSingleCharWord && !isSingleHanziWordText(existing.word.simplified))
      ) {
        candidateByChar.set(char, { char, word, charIndex: i });
      }
    }
  }

  const singleCharMap = await getSingleCharWordsByGlyphs([
    ...candidateByChar.keys(),
  ]);

  for (const { char, word, charIndex } of candidateByChar.values()) {
    if (seenChars.has(char)) continue;
    const view = await resolvePlayableCharView(char, word.radical);
    if (!view) continue;
    const meta = resolveCharDisplayMeta(char, word, charIndex, singleCharMap);
    const entry = entryFromView(view, meta.pinyin, meta.meaningMn);
    if (!entry) continue;
    seenChars.add(char);
    base.push(entry);
  }

  return expandEntryList(base, minSize, maxSize);
}
