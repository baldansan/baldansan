/**
 * One-off: convert flat texts[] in lesson JSON to shortTexts-style sentences + tokens.
 * Usage: node scripts/patch-lesson-texts-sentences.mjs data/lesson-01.json
 */
import fs from "fs";

const path = process.argv[2] || "data/lesson-01.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));

const vocab = (pkg.vocabulary ?? [])
  .map((v) => ({
    zh: String(v.zh ?? "").trim(),
    pinyin: String(v.pinyin ?? "").trim(),
    mn: String(v.mn ?? "").trim(),
  }))
  .filter((v) => v.zh)
  .sort((a, b) => b.zh.length - a.zh.length);

function tokenizeZh(zh) {
  const tokens = [];
  let i = 0;
  while (i < zh.length) {
    let hit = null;
    for (const v of vocab) {
      if (v.zh && zh.startsWith(v.zh, i)) {
        hit = v;
        break;
      }
    }
    if (hit) {
      tokens.push({ zh: hit.zh, py: hit.pinyin });
      i += hit.zh.length;
      continue;
    }
    const ch = zh[i];
    if (/[\u4e00-\u9fff]/.test(ch)) tokens.push({ zh: ch, py: "" });
    i += 1;
  }
  return tokens;
}

function toSentences(zh, pinyin, mn) {
  const parts = zh
    .split(/(?<=[。！？!?；;])/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return [{ zh, pinyin, mn, tokens: tokenizeZh(zh) }];
  }
  return parts.map((part) => ({
    zh: part,
    pinyin: "",
    mn: "",
    tokens: tokenizeZh(part),
  }));
}

if (Array.isArray(pkg.texts)) {
  pkg.texts = pkg.texts.map((t, index) => ({
    id: t.id ?? index + 1,
    audio: t.audio ?? t.audioFile,
    sentences: toSentences(t.zh ?? "", t.pinyin ?? "", t.mn ?? ""),
  }));
}

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log(`Patched texts in ${path}`);
