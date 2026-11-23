/**
 * data/dictionary/lexicon_mn.jsonl → Supabase (dictionary_lexicon_apply_mn RPC; хянасан/батлагдсан мөрийг дарахгүй).
 * Run: node --env-file=.env.local scripts/dictionary/load_lexicon_mn.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const need = (n) => { const v = process.env[n]?.trim(); if (!v) throw new Error(`Missing ${n} (.env.local)`); return v; };
const sb = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const rows = readFileSync(join(ROOT, "data/dictionary/lexicon_mn.jsonl"), "utf8")
  .split("\n").filter(Boolean).map((l) => JSON.parse(l))
  .map(({ simplified, pinyin_num, english, meaning_mn }) => ({ simplified, pinyin_num, english, meaning_mn }));
console.log(rows.length, "орчуулга");
let total = 0;
for (let i = 0; i < rows.length; i += 500) {
  const { data, error } = await sb.rpc("dictionary_lexicon_apply_mn", { p_rows: rows.slice(i, i + 500) });
  if (error) { console.error(`batch ${i}:`, error.message); process.exit(1); }
  total += data ?? 0;
}
console.log("Шинэчилсэн:", total);
