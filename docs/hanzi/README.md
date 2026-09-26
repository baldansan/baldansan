# Ханзны задаргааны сан

`public/data/char_breakdown_full.json` — `scripts/hanzi/build-char-breakdown.py`-аар makemeahanzi `dictionary.txt`
(https://github.com/skishore/makemeahanzi, IDS задаргаа, 部首, 象形/会意/形声 төрөл, 形旁/声旁) дээрээс үүсгэнэ.
Монгол/хятад нэр: `component-names.json` (1000 бүрдэл хэсэг), гарлын тайлбар: `etymology-hints-*.json` (928 会意/象形 ханз) — агентаар орчуулсан, багш шалгаж болно.
Дахин үүсгэх: dictionary.txt + эдгээр файлуудыг нэг хавтаст (`batches/parts.out.json`, `batches/hints*.out.json`) хийгээд скриптийг ажиллуулна.
Эх сурвалжийн лиценз: Unihan / CC-CEDICT / Wiktionary — CC BY-SA (аппын тусламж хуудсанд иш татсан).
