/**
 * Load data/hsk_words.json into Supabase public.hsk_words (500-row batches).
 *
 * Requires in .env.local (never commit):
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Apply migrations first: 024_hsk_words_catalog.sql, 032_hsk_words_pinyin_sort.sql
 * Run: npm run load:hsk
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, "..", "data", "hsk_words.json");
const BATCH_SIZE = 500;

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local (see Supabase Settings → API).`
    );
  }
  return value;
}

/** Normalize JSON row → DB insert shape */
function mapRow(raw, index) {
  const hskLevel = normalizeHskLevel(raw.hsk_level);
  if (!hskLevel) {
    throw new Error(
      `Row ${index}: invalid hsk_level ${JSON.stringify(raw.hsk_level)} for ${raw.simplified}`
    );
  }

  return {
    simplified: String(raw.simplified ?? "").trim(),
    traditional: nullableText(raw.traditional),
    pinyin: nullableText(raw.pinyin),
    pos: normalizePos(raw.pos),
    radical: nullableText(raw.radical),
    frequency: normalizeInt(raw.frequency),
    hsk_level: hskLevel,
    hsk_old: normalizeHskOld(raw.hsk_old),
    meaning_en: nullableText(raw.meaning_en ?? raw.meanings_en?.[0]),
    meaning_mn: nullableText(raw.meaning_mn),
    example_zh: nullableText(raw.example_zh),
    example_pinyin: nullableText(raw.example_pinyin),
    example_mn: nullableText(raw.example_mn),
  };
}

function nullableText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeInt(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function normalizePos(pos) {
  if (pos == null) return [];
  if (Array.isArray(pos)) return pos.map((p) => String(p).trim()).filter(Boolean);
  const text = String(pos).trim();
  return text ? [text] : [];
}

function normalizeHskLevel(level) {
  if (level == null || level === "") return null;
  if (typeof level === "number" && level >= 1 && level <= 6) {
    return String(level);
  }
  if (typeof level === "number" && level >= 7) {
    return "7-9";
  }
  const text = String(level).trim();
  if (/^[1-6]$/.test(text)) return text;
  if (text === "7-9" || text === "7" || text === "8" || text === "9") {
    return "7-9";
  }
  return null;
}

function normalizeHskOld(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "number" && Number.isFinite(item)) return Math.trunc(item);
      const match = String(item).match(/\d+/);
      return match ? Number(match[0]) : null;
    })
    .filter((n) => n != null);
}

async function truncateTable(supabase) {
  const { error } = await supabase.rpc("truncate_hsk_words");
  if (!error) return;

  // Fallback when RPC is not defined: delete all rows (slower but works)
  const { error: deleteError } = await supabase
    .from("hsk_words")
    .delete()
    .gte("id", 0);
  if (deleteError) {
    throw new Error(
      `Could not clear hsk_words. Apply migration 024_hsk_words_catalog.sql first. ${deleteError.message}`
    );
  }
}

async function main() {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url) {
    throw new Error(
      "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) in .env.local"
    );
  }

  if (!existsSync(JSON_PATH)) {
    throw new Error(
      `File not found: ${JSON_PATH}\nPlace your hsk_words.json (10,057 rows) at data/hsk_words.json`
    );
  }

  const raw = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  if (!Array.isArray(raw)) {
    throw new Error("data/hsk_words.json must be a JSON array");
  }

  const rows = raw.map((row, index) => mapRow(row, index));
  const emptySimplified = rows.filter((r) => !r.simplified);
  if (emptySimplified.length > 0) {
    throw new Error(`${emptySimplified.length} rows missing simplified`);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Clearing public.hsk_words …`);
  await truncateTable(supabase);

  console.log(`Inserting ${rows.length} rows in batches of ${BATCH_SIZE} …`);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("hsk_words").insert(batch);
    if (error) {
      throw new Error(
        `Insert failed at batch ${i / BATCH_SIZE + 1}: ${error.message}`
      );
    }
    console.log(`  ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`);
  }

  const { count, error: countError } = await supabase
    .from("hsk_words")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Count failed: ${countError.message}`);
  }

  console.log(`Done. hsk_words row count: ${count}`);
  if (count !== rows.length) {
    console.warn(
      `Warning: expected ${rows.length} rows but database reports ${count}`
    );
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
