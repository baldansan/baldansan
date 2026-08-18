// public/data/hsk_word_themes.json файлын бүтцийн шалгалт.
// Ажиллуулах: node scripts/check_word_themes.mjs
import { readFileSync } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "public", "data", "hsk_word_themes.json");
const LEVELS = ["1", "2", "3", "4", "5", "6", "7-9"];
const BASE_IDS = [
  "people", "body", "food", "home", "study", "work", "money", "travel",
  "place", "nature", "animal", "time", "number", "feeling", "talk",
  "culture", "society", "tech", "action", "quality", "grammar", "other",
];
// data/hsk_words.json дахь түвшин тус бүрийн үгийн тоо (эх датагаас)
const EXPECTED_COUNTS = {
  "1": 294, "2": 197, "3": 487, "4": 972, "5": 1547, "6": 1684, "7-9": 4876,
};
const MAX_GROUP_SIZE = 30;

let failures = 0;
function check(cond, msg) {
  if (!cond) {
    failures += 1;
    console.error("  ✗ " + msg);
  }
}

const data = JSON.parse(readFileSync(FILE, "utf8"));

for (const level of LEVELS) {
  const groups = data[level];
  console.log(`Түвшин ${level}:`);
  check(Array.isArray(groups) && groups.length > 0, `түвшин ${level} хоосон`);
  if (!Array.isArray(groups)) continue;

  const seenIds = new Set();
  const seenWords = new Set();
  let total = 0;

  for (const g of groups) {
    const base = g.id.replace(/-\d+$/, "");
    check(BASE_IDS.includes(base), `${level}/${g.id}: үл мэдэх сэдвийн id`);
    check(!seenIds.has(g.id), `${level}/${g.id}: давхардсан бүлгийн id`);
    seenIds.add(g.id);
    check(typeof g.icon === "string" && g.icon.length > 0, `${level}/${g.id}: icon алга`);
    check(typeof g.title === "string" && g.title.length > 0, `${level}/${g.id}: title алга`);
    check(Array.isArray(g.words) && g.words.length > 0, `${level}/${g.id}: үг алга`);
    check(g.words.length <= MAX_GROUP_SIZE, `${level}/${g.id}: ${g.words.length} үг (>30)`);
    for (const w of g.words) {
      check(!seenWords.has(w), `${level}/${g.id}: "${w}" давхардсан`);
      seenWords.add(w);
      total += 1;
    }
  }

  check(
    total === EXPECTED_COUNTS[level],
    `${level}: нийт ${total} үг (хүлээгдэж буй ${EXPECTED_COUNTS[level]})`
  );
  console.log(`  ${groups.length} бүлэг, ${total} үг ✓`);
}

if (failures > 0) {
  console.error(`\n${failures} алдаа олдлоо.`);
  process.exit(1);
}
console.log("\nБүх шалгалт амжилттай ✅");
