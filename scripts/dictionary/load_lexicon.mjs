/**
 * data/dictionary/lexicon.json → Supabase public.dictionary_lexicon (1000-ийн багцаар, дахин ажиллуулж болно).
 * Migration эхлээд: 118_dictionary_lexicon.sql.  Дараа нь hsk_words-тэй холбоно (ижил ханз+пиньинь).
 * Run: node --env-file=.env.local scripts/dictionary/load_lexicon.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const need = (n) => { const v = process.env[n]?.trim(); if (!v) throw new Error(`Missing ${n} (.env.local)`); return v; };
const sb = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const rows = JSON.parse(readFileSync(join(ROOT, "data/dictionary/lexicon.json"), "utf8"));
console.log(rows.length, "бичилт");
const BATCH = 1000;
let done = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = rows.slice(i, i + BATCH);
  const { error } = await sb.from("dictionary_lexicon").upsert(chunk, {
    onConflict: "simplified,pinyin_num,english", ignoreDuplicates: true,
  });
  if (error) { console.error(`batch ${i}:`, error.message); process.exit(1); }
  done += chunk.length;
  if ((i / BATCH) % 10 === 0) console.log(`  ${done}/${rows.length}`);
}
console.log("Дууслаа:", done);
