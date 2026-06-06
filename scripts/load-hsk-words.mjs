/**
 * Truncate hsk_words and reload from data/reference/hsk_words.json
 *
 * Requires (local ETL only — never in Vercel client env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run schema first: supabase/reference/schema.sql
 * Build JSON:       node scripts/build-hsk-words-json.mjs
 * Load:             node scripts/load-hsk-words.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, "..", "data", "reference", "hsk_words.json");
const BATCH_SIZE = 500;

function loadEnvFile() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

async function main() {
  loadEnvFile();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  const rows = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  if (!Array.isArray(rows)) throw new Error("hsk_words.json must be an array");

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("Clearing public.hsk_words …");
  const { error: deleteError } = await supabase.from("hsk_words").delete().gte("id", 1);
  if (deleteError) {
    console.error(
      "Could not clear hsk_words. Apply supabase/reference/schema.sql, then TRUNCATE in SQL Editor if needed.",
      deleteError.message
    );
    process.exit(1);
  }

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("hsk_words").insert(batch);
    if (error) {
      console.error(`Insert failed at batch ${i / BATCH_SIZE + 1}:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${rows.length}`);
  }

  const { count, error: countError } = await supabase
    .from("hsk_words")
    .select("*", { count: "exact", head: true });
  if (countError) {
    console.error("Count check failed:", countError.message);
    process.exit(1);
  }

  console.log(`Done. hsk_words row count: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
