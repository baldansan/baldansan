// Нүүрний «Уншлагын сан» урьдчилсан 8 ном → content/open/home-preview.json
// (lib/library/data.ts getStories()-ийн эрэмбэтэй ижил: дуутай GSB эхэнд, түвшин, богино нь эхэнд)
import fs from "node:fs";
const gsb = JSON.parse(fs.readFileSync("content/open/global-storybooks-zh/data.json", "utf8")).stories;
const sw = JSON.parse(fs.readFileSync("content/open/storyweaver-zh/data.json", "utf8")).stories
  .filter((s) => !(s.flags ?? []).includes("wordless"));
const pick = (p) => (s) => ({ p, level: s.level, cc: s.char_count, id: s.id, title: s.title, titlePinyin: s.title_pinyin, cover: s.cover });
const all = [...gsb.map(pick(0)), ...sw.map(pick(1))]
  .sort((x, y) => x.p - y.p || x.level - y.level || x.cc - y.cc)
  .slice(0, 8)
  .map(({ id, title, titlePinyin, cover, level }) => ({ id, title, titlePinyin, cover, level }));
fs.writeFileSync("content/open/home-preview.json", JSON.stringify(all, null, 2) + "\n");
console.log("content/open/home-preview.json:", all.length, "ном");
