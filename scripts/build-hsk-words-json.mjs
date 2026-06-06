/**
 * Build data/reference/hsk_words.json from drkameleon complete.min.json
 * Run: node scripts/build-hsk-words-json.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "data", "reference");
const OUT_FILE = join(OUT_DIR, "hsk_words.json");
const SOURCE_URL =
  "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.min.json";

function splitLevels(levels = []) {
  const hskOld = [];
  const hskNew = [];
  const hskNewest = [];
  for (const raw of levels) {
    const level = String(raw ?? "").trim().toLowerCase();
    if (!level) continue;
    if (/^old-/i.test(level) || /^o\d+$/i.test(level) || /^t\d+$/i.test(level)) {
      hskOld.push(level);
    } else if (/^new-/i.test(level) || /^n\d+$/i.test(level)) {
      hskNew.push(level);
    } else {
      hskNewest.push(level);
    }
  }
  return { hskOld, hskNew, hskNewest };
}

function resolvePrimaryHskLevel(levels = []) {
  const parsed = [];
  for (const raw of levels) {
    const tag = String(raw ?? "").trim().toLowerCase();
    const long = tag.match(/^(?:old-|new-)(\d+)$/);
    if (long) parsed.push(Number(long[1]));
    const short = tag.match(/^[ont](\d+)$/);
    if (short) parsed.push(Number(short[1]));
  }
  if (parsed.length === 0) return null;
  return Math.min(...parsed);
}

function joinMeanings(meanings = []) {
  return meanings
    .map((m) => String(m ?? "").trim())
    .filter(Boolean)
    .join("; ");
}

function toRow(entry) {
  const forms = Array.isArray(entry.f) ? entry.f : [];
  const rows = [];
  const levelTags = Array.isArray(entry.l) ? entry.l : [];
  const { hskOld, hskNew, hskNewest } = splitLevels(levelTags);
  const hskLevel = resolvePrimaryHskLevel(levelTags);

  for (const form of forms) {
    const pinyin = form?.i?.y?.trim() || null;
    const meanings = Array.isArray(form?.m) ? form.m : [];
    const meaningsEn = meanings.map((m) => String(m ?? "").trim()).filter(Boolean);

    rows.push({
      simplified: String(entry.s ?? "").trim(),
      traditional: form?.t?.trim() || null,
      pinyin,
      pinyin_numeric: form?.i?.n?.trim() || null,
      bopomofo: form?.i?.b?.trim() || null,
      pos: Array.isArray(entry.p) ? entry.p.map(String) : [],
      radical: entry.r?.trim() || null,
      frequency: typeof entry.q === "number" ? entry.q : null,
      hsk_level: hskLevel,
      hsk_old: hskOld,
      hsk_new: hskNew,
      hsk_newest: hskNewest,
      classifiers: Array.isArray(form?.c) ? form.c.map(String) : [],
      meanings_en: meaningsEn,
      meaning_en: joinMeanings(meaningsEn) || null,
      cedict_key: null,
      meaning_mn: null,
      meaning_mn_status: null,
      example_zh: null,
      example_pinyin: null,
      example_mn: null,
    });
  }

  if (rows.length === 0 && entry.s) {
    rows.push({
      simplified: String(entry.s).trim(),
      traditional: null,
      pinyin: null,
      pinyin_numeric: null,
      bopomofo: null,
      pos: Array.isArray(entry.p) ? entry.p.map(String) : [],
      radical: entry.r?.trim() || null,
      frequency: typeof entry.q === "number" ? entry.q : null,
      hsk_level: hskLevel,
      hsk_old: hskOld,
      hsk_new: hskNew,
      hsk_newest: hskNewest,
      classifiers: [],
      meanings_en: [],
      meaning_en: null,
      cedict_key: null,
      meaning_mn: null,
      meaning_mn_status: null,
      example_zh: null,
      example_pinyin: null,
      example_mn: null,
    });
  }

  return rows.filter((row) => row.simplified);
}

async function main() {
  console.log("Fetching", SOURCE_URL);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const source = await res.json();
  if (!Array.isArray(source)) throw new Error("Expected array in complete.min.json");

  const rows = source.flatMap(toRow);
  const deduped = new Map();
  for (const row of rows) {
    const key = `${row.simplified}\u0000${row.pinyin ?? ""}`;
    if (!deduped.has(key)) deduped.set(key, row);
  }
  const out = [...deduped.values()].sort((a, b) => {
    const fa = a.frequency ?? Number.MAX_SAFE_INTEGER;
    const fb = b.frequency ?? Number.MAX_SAFE_INTEGER;
    if (fa !== fb) return fa - fb;
    return a.simplified.localeCompare(b.simplified, "zh");
  });

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(out));
  console.log(`Wrote ${out.length} rows → ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
