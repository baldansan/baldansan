/**
 * Хөгөөр л ялгардаг хос үгсийг аппын үгийн сангаас түүж public/data/tone-pairs.json үүсгэнэ.
 * Ашиглах: npx tsx scripts/tone-pairs/build.ts <pairs_raw.json>
 * pairs_raw.json = [[level, [zh, pinyin, mn], [zh, pinyin, mn]], ...] (hsk_words-оос, үсэг ижил хөг өөр).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { buildQuestion, type LearnWord } from "@/lib/games/learn-session";

type Side = [string, string, string];
const raw = JSON.parse(readFileSync(process.argv[2], "utf8")) as [number, Side, Side][];

const shortMeaning = (m: string) => {
  const first = m.split(/[;；]/)[0].trim();
  return first.length > 30 ? `${first.slice(0, 29)}…` : first;
};
const word = (s: Side, o: Side, id: number): LearnWord =>
  ({ id, simplified: s[0], pinyin: s[1], meaning_mn: s[2], confusable: { zh: o[0], pinyin: o[1], meaning: o[2] } }) as LearnWord;

const out: (string | number)[][] = [];
let dropped = 0;
for (const [lvl, a, b] of raw) {
  const A: Side = [a[0], a[1], shortMeaning(a[2])];
  const B: Side = [b[0], b[1], shortMeaning(b[2])];
  // Тайлбар нь хаалттай тэмдэглэгээ төдий (тоолох үг г.м.) бол ойлгомжгүй — хасна.
  if (!A[2] || !B[2] || A[2].startsWith("(") || B[2].startsWith("(")) { dropped += 1; continue; }
  const qa = buildQuestion("tone", word(A, B, -1), []);
  const qb = buildQuestion("tone", word(B, A, -2), []);
  const ok = (q: ReturnType<typeof buildQuestion>) =>
    q && q.type === "choice" && q.trap && q.options.includes(q.trap.option) && new Set(q.options).size === 4;
  if (!ok(qa) || !ok(qb)) { dropped += 1; continue; }
  out.push([lvl, ...A, ...B]);
}
out.sort((x, y) => (x[0] as number) - (y[0] as number));
writeFileSync("public/data/tone-pairs.json", JSON.stringify(out));
const byLevel: Record<string, number> = {};
for (const r of out) byLevel[String(r[0])] = (byLevel[String(r[0])] ?? 0) + 1;
console.log("kept", out.length, "dropped", dropped, byLevel);
