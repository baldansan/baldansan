#!/usr/bin/env node
/** Validate Korean Book 1 PreLesson JSON files. Run: node content/korean-book-1/scripts/validate-prelessons.mjs */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..");

const IMPORT_ORDER = [
  "prelesson-01-vowels-basic.json",
  "prelesson-02-vowels-y-compound.json",
  "prelesson-03-consonants-basic.json",
  "prelesson-04-consonants-strong-aspirated.json",
  "prelesson-05-syllable-building.json",
  "prelesson-06-batchim.json",
  "prelesson-07-reading-practice.json",
  "prelesson-08-final-test.json",
];

const MIN = {
  "k-pre-01": { vocab: 12, quiz: 10 },
  "k-pre-02": { vocab: 12, quiz: 10 },
  "k-pre-03": { vocab: 15, quiz: 10 },
  "k-pre-04": { vocab: 12, quiz: 10 },
  "k-pre-05": { vocab: 15, quiz: 12 },
  "k-pre-06": { vocab: 12, quiz: 12 },
  "k-pre-07": { vocab: 15, quiz: 12 },
  "k-pre-08": { vocab: 0, quiz: 20 },
};

const issues = [];
const stats = [];

for (const file of IMPORT_ORDER) {
  const fp = path.join(dir, file);
  if (!fs.existsSync(fp)) {
    issues.push(`${file}: MISSING`);
    continue;
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(fp, "utf8"));
  } catch (e) {
    issues.push(`${file}: INVALID JSON — ${e.message}`);
    continue;
  }

  const lesson = data.lesson ?? {};
  const vocab = data.vocabulary ?? [];
  const quiz = data.quizQuestions ?? data.quiz ?? [];

  stats.push({
    file,
    lessonId: lesson.id,
    orderIndex: lesson.orderIndex,
    vocab: vocab.length,
    quiz: quiz.length,
    subs: (data.subtitles ?? []).length,
  });

  if (lesson.courseId !== "korean-1") issues.push(`${file}: courseId must be korean-1`);
  if (!lesson.sourceNote?.includes("lessonType=prelesson")) {
    issues.push(`${file}: sourceNote should include lessonType=prelesson`);
  }
  if (lesson.videoUrl || lesson.audioUrl) issues.push(`${file}: fake media URL on lesson`);

  const min = MIN[lesson.id];
  if (min) {
    if (vocab.length < min.vocab) issues.push(`${file}: vocab ${vocab.length} < ${min.vocab}`);
    if (quiz.length < min.quiz) issues.push(`${file}: quiz ${quiz.length} < ${min.quiz}`);
  }

  vocab.forEach((w, i) => {
    if (!w.chinese?.trim()) issues.push(`${file}: vocab[${i}] missing chinese`);
    if (!w.mongolian?.trim()) issues.push(`${file}: vocab[${i}] missing mongolian`);
    if (!w.pinyin?.trim()) issues.push(`${file}: vocab[${i}] missing pinyin/romanization`);
    if (w.hskLevel !== "KR-Beginner") {
      issues.push(`${file}: vocab[${i}] hskLevel should be KR-Beginner (got ${w.hskLevel})`);
    }
    if (w.audioUrl || w.videoUrl) issues.push(`${file}: vocab[${i}] fake media URL`);
  });

  quiz.forEach((q, i) => {
    const type = q.type;
    const opts = q.options ?? [];
    const ans = q.correctAnswer ?? q.answer;
    if (!q.question?.trim()) issues.push(`${file}: quiz[${i}] missing question`);
    if (!q.explanation?.trim()) issues.push(`${file}: quiz[${i}] missing explanation`);
    if (!["multiple_choice", "cloze"].includes(type)) {
      issues.push(`${file}: quiz[${i}] invalid type ${type}`);
    }
    if (type === "multiple_choice" && ans && !opts.includes(ans)) {
      issues.push(`${file}: quiz[${i}] correctAnswer not in options`);
    }
  });
}

console.log("Korean PreLesson validation\n");
console.table(stats);
if (issues.length) {
  console.error(`\n${issues.length} issue(s):\n`);
  issues.forEach((msg) => console.error(" -", msg));
  process.exit(1);
}
console.log("\nAll PreLesson JSON files passed validation.");
