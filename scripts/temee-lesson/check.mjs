#!/usr/bin/env node
/**
 * «Тэмээ багшийн хичээл»-ийн шалгагч — `npm run temee:check`.
 * Гол дүрэм: дасгал, сорилд гарах БҮХ зүйл өмнө нь заагдсан байх.
 *  1. Асуулт бүр `taught`-тай, заасан дэлгэц нь үнэхээр байгаа.
 *  2. Асуулт, сонголтод гарсан ханз бүр ямар нэг дэлгэцэд гарсан.
 *  3. Сонсох асуултын үе (syl:) ямар нэг дэлгэцэд сонсгогдсон авиатай (эхлэх авиа/төгсгөл) холбоотой байх нь хүний шалгалт —
 *     энд зөвхөн файл байгаа эсэхийг шалгана.
 *  4. Зөв хариулт сонголтод байгаа; индекс хүрээндээ.
 *  5. Дуу, зургийн файл бүр байгаа.
 *  6. lib/temee-lesson/meta.ts, load.ts-д бүртгэгдсэн.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DIR = join(ROOT, "content/temee-lessons");
const HANZI = /[一-鿿]/g;
const errors = [];
const warn = [];
const metaSrc = readFileSync(join(ROOT, "lib/temee-lesson/meta.ts"), "utf8");
const loadSrc = readFileSync(join(ROOT, "lib/temee-lesson/load.ts"), "utf8");

function audioPath(ref, lessonId) {
  if (ref.startsWith("syl:")) return join(ROOT, "public/open/audio-cmn/syllables", `cmn-${ref.slice(4)}.mp3`);
  if (ref.startsWith("file:")) return join(ROOT, "public/temee-lesson", lessonId, ref.slice(5));
  return null; // word: → CDN, энд шалгахгүй
}

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  const L = JSON.parse(readFileSync(join(DIR, file), "utf8"));
  const id = L.lessonId;
  const err = (m) => errors.push(`${file}: ${m}`);
  if (`${id}.json` !== file) err(`lessonId (${id}) файлын нэртэй таарахгүй`);
  if (!metaSrc.includes(`"${id}"`)) err("lib/temee-lesson/meta.ts-д бүртгэгдээгүй");
  if (!loadSrc.includes(`"${id}"`)) err("lib/temee-lesson/load.ts-д бүртгэгдээгүй");

  const screens = new Map();
  const sections = [L.teach, L.sounds].filter(Boolean);
  for (const sec of sections) {
    for (const part of sec.parts) {
      for (const s of part.screens) {
        if (screens.has(s.id)) err(`дэлгэцийн id давхардсан: ${s.id}`);
        screens.set(s.id, s);
        if (!s.say?.length) err(`${s.id}: Балдангийн үг алга`);
        if (s.say?.length > 4) err(`${s.id}: Балдангийн үг 4-өөс олон (нэг дэлгэцэд нэг санаа)`);
        for (const line of s.say ?? []) {
          if (line.length > 110) warn.push(`${file} ${s.id}: урт өгүүлбэр (${line.length}): ${line.slice(0, 40)}…`);
          if (/!!|Гайхалтай|Мундаг/.test(line)) err(`${s.id}: Балдангийн өнгөнд тохирохгүй үг: ${line}`);
        }
        const checks = s.checks ?? (s.check ? [s.check] : []);
        for (const c of checks) {
          if (!(c.answer >= 0 && c.answer < c.options.length)) err(`${s.id}: шалгалтын зөв хариултын индекс буруу`);
          if (new Set(c.options).size !== c.options.length) err(`${s.id}: сонголт давхардсан`);
        }
      }
    }
  }

  const taughtText = JSON.stringify(sections);
  const taughtHanzi = new Set(taughtText.match(HANZI) ?? []);
  const refs = new Set();
  JSON.stringify(L, (k, v) => {
    if (typeof v === "string" && /^(syl|file|word):/.test(v)) refs.add(v);
    return v;
  });
  for (const ref of refs) {
    const p = audioPath(ref, id);
    if (p && !existsSync(p)) err(`дууны файл алга: ${ref}`);
  }
  JSON.stringify(L, (k, v) => {
    if ((k === "image" || (k === "src" && typeof v === "string")) && typeof v === "string" && v.startsWith("/")) {
      if (!existsSync(join(ROOT, "public", v))) err(`зураг алга: ${v}`);
    }
    return v;
  });

  const checkTaught = (kind, item, text) => {
    if (!item.taught?.length) err(`${kind} ${item.id}: «taught» алга — хаана заасныг бич`);
    for (const t of item.taught ?? []) if (!screens.has(t)) err(`${kind} ${item.id}: «${t}» гэсэн дэлгэц байхгүй`);
    for (const ch of text.match(HANZI) ?? []) {
      if (!taughtHanzi.has(ch)) err(`${kind} ${item.id}: «${ch}» ханз аль ч дэлгэцэд заагдаагүй`);
    }
  };
  for (const p of L.practice ?? []) {
    checkTaught("дасгал", p, [p.q, ...p.options, p.scene ?? ""].join(" "));
    if (!(p.answer >= 0 && p.answer < p.options.length)) err(`дасгал ${p.id}: зөв хариултын индекс буруу`);
  }
  for (const q of L.quiz ?? []) {
    checkTaught("сорил", q, [q.question, ...q.options].join(" "));
    if (!q.options.includes(q.answer)) err(`сорил ${q.id}: зөв хариулт сонголтод алга`);
    if (new Set(q.options).size !== q.options.length) err(`сорил ${q.id}: сонголт давхардсан`);
  }
  const vocabHanzi = new Set((L.vocabKeep ?? []).join("").match(HANZI) ?? []);
  for (const ch of vocabHanzi) if (!taughtHanzi.has(ch)) warn.push(`${file}: үгийн картын «${ch}» Тэмээ багшийн хичээлд гараагүй`);

  const n = [...screens.keys()].length;
  console.log(`✓ ${id}: ${n} дэлгэц, ${L.practice?.length ?? 0} дасгал, ${L.quiz?.length ?? 0} сорил, ${refs.size} дуу`);
  const m = metaSrc.match(new RegExp(`"${id}":\\s*\\{([^}]*)\\}`));
  if (m) {
    const num = (key) => Number((m[1].match(new RegExp(`${key}:\\s*(\\d+)`)) ?? [])[1]);
    if (L.vocabKeep && num("vocabCount") !== L.vocabKeep.length) err(`meta.ts vocabCount ≠ ${L.vocabKeep.length}`);
    if (L.quiz && num("quizCount") !== L.quiz.length) err(`meta.ts quizCount ≠ ${L.quiz.length}`);
  }
}
for (const w of warn) console.log(`  ⚠ ${w}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} алдаа:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("Бүгд зөв.");
