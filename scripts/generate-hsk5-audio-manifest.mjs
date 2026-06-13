/**
 * One-off: probe public Supabase hsk-audio bucket and write data/hsk5-audio-manifest.json
 * node scripts/generate-hsk5-audio-manifest.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE =
  "https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio";

const books = [
  { book: "5A", type: "textbook", folder: "hsk5Atextbookaudios" },
  { book: "5A", type: "workbook", folder: "hsk5Aworkbookaudios" },
  { book: "5B", type: "textbook", folder: "hsk5Btextbookaudios" },
  { book: "5B", type: "workbook", folder: "hsk5Bworkbookaudios" },
];

async function exists(url) {
  const r = await fetch(url, { method: "HEAD" });
  return r.status === 200;
}

const entries = [];

for (const b of books) {
  for (let lesson = 1; lesson <= 40; lesson++) {
    const LL = String(lesson).padStart(2, "0");

    if (b.book === "5B" && b.type === "workbook" && lesson === 37) {
      const fn = "hsk5B-workbook-37.mp3";
      const sp = `${b.folder}/lesson-${LL}/${fn}`;
      const url = `${BASE}/${sp}`;
      if (await exists(url)) {
        entries.push({
          book: b.book,
          lesson,
          type: b.type,
          filename: fn,
          storage_path: sp,
          public_url: url,
        });
      }
      continue;
    }

    const maxIdx =
      b.book === "5A" && b.type === "textbook" && lesson === 7 ? 4 : 2;

    for (let idx = 1; idx <= maxIdx; idx++) {
      const NN = String(idx).padStart(2, "0");
      const fn = `hsk${b.book}-${b.type}-${LL}${NN}.mp3`;
      const sp = `${b.folder}/lesson-${LL}/${fn}`;
      const url = `${BASE}/${sp}`;
      if (await exists(url)) {
        entries.push({
          book: b.book,
          lesson,
          type: b.type,
          filename: fn,
          storage_path: sp,
          public_url: url,
        });
      } else if (idx === 1) {
        break;
      }
    }
  }
}

const outPath = join(__dirname, "..", "data", "hsk5-audio-manifest.json");
writeFileSync(outPath, JSON.stringify(entries, null, 2) + "\n");
console.log(`Wrote ${entries.length} entries to ${outPath}`);
