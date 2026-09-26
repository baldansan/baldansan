/**
 * Prints the stroke/component game questions for a lesson, built from the
 * verified dataset (public/data/char_breakdown_full.json).
 *
 *   npx tsx scripts/hanzi/print-stroke-questions.ts [lessonId]   (default hsk1-l01)
 *
 * Prints every candidate question per character (no random sampling), then
 * asserts the 系 / 谢 expectations from REFACTOR-TASK.md.
 */
import { readFileSync } from "fs";
import path from "path";
import { buildHanziDataFromFullEntry } from "@/lib/games/hanzi-breakdown-catalog";
import { collectLessonCharacters } from "@/lib/games/hanzi-component-data";
import { buildHanziStrokeQuestionsByCharacter } from "@/lib/games/hanzi-stroke-game";
import type { HanziCharacterData } from "@/lib/games/hanzi-component-data";
import type { GameVocabItem } from "@/lib/games/game-types";
import type { FullBreakdownEntry, FullComponentMeaning } from "@/lib/hanzi/char-breakdown-full";
import type { HskCharacterNote } from "@/lib/lesson/hsk-lesson-content";
import { HSK1_L01_V13_VOCABULARY } from "@/lib/lesson/hsk1-l01-v13/vocabulary";

const lessonId = process.argv[2] ?? "hsk1-l01";
const base = path.join(process.cwd(), "public", "data");
const full = JSON.parse(
  readFileSync(path.join(base, "char_breakdown_full.json"), "utf8")
) as Record<string, FullBreakdownEntry>;
const meanings = JSON.parse(
  readFileSync(path.join(base, "component_meanings_mn.json"), "utf8")
) as Record<string, FullComponentMeaning>;

async function loadVocabulary(): Promise<{
  vocabulary: GameVocabItem[];
  notes: HskCharacterNote[];
  source: string;
}> {
  try {
    const { getLessonGameContext } = await import("@/lib/games/game-data");
    const ctx = await Promise.race([
      getLessonGameContext(lessonId),
      new Promise<null>((r) => setTimeout(() => r(null), 8000)),
    ]);
    if (ctx && ctx.vocabulary.length > 0) {
      return {
        vocabulary: ctx.vocabulary,
        notes: ctx.hskCharacterNotes ?? [],
        source: "getLessonGameContext",
      };
    }
  } catch (err) {
    console.warn("getLessonGameContext failed:", (err as Error).message);
  }
  if (lessonId !== "hsk1-l01") throw new Error("no vocabulary for " + lessonId);
  return {
    vocabulary: HSK1_L01_V13_VOCABULARY.map((w) => ({
      id: w.id,
      chinese: w.chinese,
      pinyin: w.pinyin,
      mongolian: w.mongolian,
      hskLevel: w.hskLevel,
      exampleChinese: w.exampleChinese,
      exampleMongolian: w.exampleMongolian,
    })) as GameVocabItem[],
    notes: [],
    source: "HSK1_L01_V13_VOCABULARY",
  };
}

async function main() {
  const { vocabulary, notes, source } = await loadVocabulary();
  const chars = collectLessonCharacters(vocabulary);
  console.log(`Lesson ${lessonId} (${source}) — words: ${vocabulary.map((w) => w.chinese).join(" ")}`);
  console.log(`Chars: ${chars.join(" ")}\n`);

  const catalog: Record<string, HanziCharacterData> = {};
  for (const ch of chars) {
    const entry = full[ch];
    if (!entry) continue;
    const data = buildHanziDataFromFullEntry(ch, entry, vocabulary, {
      getMn: (g) => meanings[g]?.mn?.trim() ?? "",
      getZh: (g) => meanings[g]?.zh?.trim() ?? "",
    });
    if (data) catalog[ch] = data;
  }

  const byChar = buildHanziStrokeQuestionsByCharacter(vocabulary, notes, catalog);
  for (const ch of chars) {
    const list = byChar.get(ch);
    if (!list) {
      const d = catalog[ch];
      console.log(
        `${ch}: (no question) — parts: ${d?.components.map((c) => `${c.component}[${c.kind}]`).join(" + ") || "—"}${d?.incomplete ? " inc" : ""}${d?.type ? " " + d.type : ""}\n`
      );
      continue;
    }
    for (const q of list) {
      const parts = q.parts
        ? q.parts
            .map((p) => `${p.glyph}${p.role ? `(${p.role === "sem" ? "утга заагч" : "дуудлага заагч"})` : ""}`)
            .join(" + ") + ` = ${q.chinese}`
        : q.formulaPrompt;
      console.log(`${q.chinese} [${q.mode}/${q.questionType ?? "-"}] ${q.charType ?? ""}`);
      console.log(`  question: ${parts}   — ${q.prompt}`);
      console.log(`  answer:   ${q.correctComponent}`);
      console.log(`  options:  ${q.options.join(" | ")}`);
      console.log(`  expl mn:  ${q.explanation ?? ""}`);
      if (q.explanationZh) console.log(`  expl zh:  ${q.explanationZh}`);
      if (q.formula) console.log(`  formula:  ${q.formula}`);
      if (q.structure) console.log(`  structure: ${q.structure} / ${q.structureZh ?? ""}`);
      console.log("");
    }
  }

  // Checks from REFACTOR-TASK.md
  const errors: string[] = [];
  for (const [ch, list] of byChar) {
    for (const q of list) {
      if (q.questionType !== "completion" && q.questionType !== "reverse") continue;
      const data = catalog[ch];
      const missing = data?.components.find((c) => c.component === q.correctComponent);
      if (missing?.kind === "stroke") errors.push(`${ch}: missing part is a stroke`);
      const own = new Set(data?.components.map((c) => c.component));
      for (const o of q.options) {
        if (o !== q.correctComponent && own.has(o)) errors.push(`${ch}: distractor ${o} is a part of the same char`);
      }
      if (new Set(q.options).size !== q.options.length) errors.push(`${ch}: duplicate options`);
    }
  }
  const xi = byChar.get("系")?.find((q) => q.questionType === "completion");
  if (byChar.has("系")) {
    if (!xi || xi.correctComponent !== "糸" || !xi.parts || xi.parts[0]!.glyph !== "丿") {
      errors.push("系 should be 丿 + ? = 系 with answer 糸");
    } else console.log("OK 系 → 丿 + ? = 系, answer 糸");
  }
  const xie = byChar.get("谢");
  if (xie) {
    const q = xie.find((x) => x.questionType === "completion");
    if (!q || q.correctComponent !== "射") errors.push("谢 should be 讠 + ? = 谢 with answer 射");
    else console.log("OK 谢 → 讠 + ? = 谢, answer 射");
  }
  if (errors.length) {
    console.error("FAIL:\n" + errors.join("\n"));
    process.exit(1);
  }
  console.log("All checks passed.");
  process.exit(0);
}

void main();
