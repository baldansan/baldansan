/**
 * data/dictionary/drafts/hsk<level>.json → Supabase (dictionary_entries / senses / examples).
 *
 * .env.local:  SUPABASE_URL=…  SUPABASE_SERVICE_ROLE_KEY=…   (хэзээ ч commit хийхгүй)
 * Migration эхлээд: supabase/migrations/116_dictionary_senses.sql
 *
 * Run:  node --env-file=.env.local scripts/dictionary/load_drafts.mjs --level 1
 *       node --env-file=.env.local scripts/dictionary/load_drafts.mjs --file data/dictionary/seed/hsk1-sample.json
 * Approved болсон үгийг ДАРЖ БИЧИХГҮЙ (багшийн засвар хадгалагдана); --force өгвөл дарна.
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const level = opt("--level");
const file = opt("--file") ?? (level ? `data/dictionary/drafts/hsk${level}.json` : null);
const force = args.includes("--force");
if (!file) {
  console.error("--level N эсвэл --file path өг.");
  process.exit(1);
}
const path = join(ROOT, file);
if (!existsSync(path)) {
  console.error("Файл олдсонгүй:", path);
  process.exit(1);
}

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name} (.env.local)`);
  return v;
}
const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

const rows = JSON.parse(readFileSync(path, "utf8"));
console.log(`${file}: ${rows.length} үг`);

// simplified(+level) → hsk_words.id
const simplifieds = [...new Set(rows.map((r) => r.simplified))];
const idMap = new Map();
for (let i = 0; i < simplifieds.length; i += 500) {
  const { data, error } = await supabase
    .from("hsk_words")
    .select("id, simplified, hsk_level")
    .in("simplified", simplifieds.slice(i, i + 500));
  if (error) throw error;
  for (const w of data) {
    const key = `${w.simplified}|${w.hsk_level}`;
    if (!idMap.has(key)) idMap.set(key, w.id);
    if (!idMap.has(w.simplified)) idMap.set(w.simplified, w.id);
  }
}

// Approved-ийг хамгаал
const wordIds = rows
  .map((r) => idMap.get(`${r.simplified}|${r.hsk_level ?? level}`) ?? idMap.get(r.simplified))
  .filter(Boolean);
const approved = new Set();
if (!force) {
  for (let i = 0; i < wordIds.length; i += 500) {
    const { data } = await supabase
      .from("dictionary_entries")
      .select("word_id, status")
      .in("word_id", wordIds.slice(i, i + 500))
      .in("status", ["approved", "reviewed"]);
    for (const e of data ?? []) approved.add(e.word_id);
  }
}

let ok = 0, skipped = 0, missing = 0;
for (const r of rows) {
  const wordId = idMap.get(`${r.simplified}|${r.hsk_level ?? level}`) ?? idMap.get(r.simplified);
  if (!wordId) { missing++; console.warn("  hsk_words-д байхгүй:", r.simplified); continue; }
  if (approved.has(wordId)) { skipped++; continue; }

  const { error: e1 } = await supabase.from("dictionary_entries").upsert({
    word_id: wordId,
    status: "draft",
    usage_note_mn: r.usage_note_mn || null,
    measure_words: r.measure_words?.length ? r.measure_words : null,
    collocations: r.collocations?.length ? r.collocations : null,
    confusable_with: r.confusable_with?.length ? r.confusable_with : null,
    register: r.register || null,
    source: r.source || "ai",
  });
  if (e1) { console.error("  entry:", r.simplified, e1.message); continue; }

  // Хуучин утгуудыг арилгаад шинээр (draft л учраас)
  await supabase.from("dictionary_senses").delete().eq("word_id", wordId);
  const senses = (r.senses ?? []).map((s, i) => ({
    word_id: wordId,
    sense_no: i + 1,
    pos: s.pos || null,
    gloss_zh: s.gloss_zh || null,
    meaning_mn: s.meaning_mn || "—",
    synonyms_mn: s.synonyms_mn?.length ? s.synonyms_mn : null,
    meaning_en: s.meaning_en || null,
    note_mn: s.note_mn || null,
    status: "draft",
  }));
  const { data: inserted, error: e2 } = await supabase
    .from("dictionary_senses").insert(senses).select("id, sense_no");
  if (e2) { console.error("  senses:", r.simplified, e2.message); continue; }
  const examples = [];
  for (const s of inserted) {
    const src = r.senses[s.sense_no - 1]?.examples ?? [];
    src.forEach((ex, j) => {
      if (ex?.zh && ex?.mn) examples.push({ sense_id: s.id, example_no: j + 1, zh: ex.zh, pinyin: ex.pinyin || null, mn: ex.mn, source: r.source || "ai" });
    });
  }
  if (examples.length) {
    const { error: e3 } = await supabase.from("dictionary_examples").insert(examples);
    if (e3) console.error("  examples:", r.simplified, e3.message);
  }
  ok++;
}
console.log(`Дууслаа: ${ok} оруулсан, ${skipped} алгассан (approved/reviewed), ${missing} олдоогүй`);
