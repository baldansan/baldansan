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
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.status === 200;
  } catch {
    return false;
  }
}

async function probeOne(b, lesson, idx) {
  const LL = String(lesson).padStart(2, "0");

  if (b.book === "5B" && b.type === "workbook" && lesson === 37) {
    const fn = "hsk5B-workbook-37.mp3";
    const sp = `${b.folder}/lesson-${LL}/${fn}`;
    const url = `${BASE}/${sp}`;
    if (await exists(url)) {
      return { book: b.book, lesson, type: b.type, filename: fn, storage_path: sp, public_url: url };
    }
    return null;
  }

  const NN = String(idx).padStart(2, "0");
      const fn = `hsk${b.book}-${b.type}-${LL}${NN}.mp3`;
  const sp = `${b.folder}/lesson-${LL}/${fn}`;
  const url = `${BASE}/${sp}`;
  if (await exists(url)) {
    return { book: b.book, lesson, type: b.type, filename: fn, storage_path: sp, public_url: url };
  }
  return null;
}

const tasks = [];
for (const b of books) {
  for (let lesson = 1; lesson <= 40; lesson++) {
    if (b.book === "5B" && b.type === "workbook" && lesson === 37) {
      tasks.push(() => probeOne(b, lesson, 1));
      continue;
    }
    const maxIdx =
      b.book === "5A" && b.type === "textbook" && lesson === 7 ? 4 : 2;
    for (let idx = 1; idx <= maxIdx; idx++) {
      tasks.push(() => probeOne(b, lesson, idx));
    }
  }
}

const entries = [];
const BATCH = 20;
for (let i = 0; i < tasks.length; i += BATCH) {
  const batch = tasks.slice(i, i + BATCH);
  const results = await Promise.all(batch.map((fn) => fn()));
  for (const r of results) {
    if (r) entries.push(r);
  }
  process.stdout.write(`\r${Math.min(i + BATCH, tasks.length)}/${tasks.length}`);
}

entries.sort((a, b) => {
  if (a.book !== b.book) return a.book.localeCompare(b.book);
  if (a.type !== b.type) return a.type.localeCompare(b.type);
  if (a.lesson !== b.lesson) return a.lesson - b.lesson;
  return a.filename.localeCompare(b.filename);
});

const outPath = join(__dirname, "..", "src", "data", "hsk5-audio-manifest.json");
writeFileSync(outPath, JSON.stringify(entries, null, 2) + "\n");
console.log(`\nWrote ${entries.length} entries`);
