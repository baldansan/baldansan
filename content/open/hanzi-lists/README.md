# Official character lists — 识字写字基本字表 300, 常用字表 3500, 通用规范汉字表 8105

| file | list | count |
|---|---|---|
| `grade1-300.json` | 识字、写字教学基本字表 — 《义务教育语文课程标准（2022年版）》**附录4** (first characters Chinese Grade-1 pupils learn to read **and** write) | 300 |
| `changyong.json` | 义务教育语文课程常用字表 — same standard, **附录5**: 字表一 2,500 + 字表二 1,000 | 3,500 |
| `tongyong-8105.json` | 《通用规范汉字表》(State Council, 2013): 一级 3,500 / 二级 3,000 / 三级 1,605, official 字序 | 8,105 |

## Sources & licenses

- **Official documents** (not subject to copyright — Copyright Law of the PRC, Art. 5):
  - 《义务教育语文课程标准（2022年版）》, Ministry of Education, PDF: http://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582344386456.pdf
  - 《通用规范汉字表》, 2013-06: http://www.moe.gov.cn/jyb_sjzl/ziliao/A19/201306/t20130601_186002.html
- **8105 data + readings:** https://github.com/jaywcjlove/table-of-general-standard-chinese-characters (commit `ea539bf`), **MIT License** © 小弟调调 (jaywcjlove). Its pinyin readings were taken by that project from zh.wiktionary "Appendix:通用规范汉字表" (character readings are facts; noted for transparency).
- **2022 curriculum tables (300 / 2500 / 1000):** the machine-readable transcription in https://github.com/zispace/hanzi-chars (commit `01748ef`) was used as input. That repo has **no license file**, so it is used only as a transcription of the official (non-copyrightable) list, and every list was **verified against the official MOE PDF** (a scanned image PDF):
  - 300 chars: pages 66–69 of the standard OCR'd (tesseract chi_sim); 287/300 matched by OCR, the remaining 13 (千太古旦禾向冰关忠爸饿煮晴) checked visually on the page images → 300/300 confirmed, stroke groups and order as printed.
  - 3500: 字表一 ∪ 字表二 is **exactly** the 通用规范汉字表 一级字 set from the MIT dataset (0 differences); the split was checked by OCR of the numbered tables (≈80 % of numbered entries readable, all disagreements inspected were OCR misreads such as 薯→暮).
  - Correction to the zispace header note ("all 300 are in 字表一"): **禾 is in 字表二 (#270)** in the official PDF — `changyong_table` records this.
- **Attribution line:** 义务教育语文课程标准（2022年版）附录4/附录5, 中华人民共和国教育部; 通用规范汉字表 (2013); 8105 data from jaywcjlove/table-of-general-standard-chinese-characters (MIT).
- **Fetched:** 2026-09-26 · **Script:** `scripts/open/hanzi-lists.py` (raw clones + PDF in `/home/claude/open-raw/`)

## Schema

```
grade1-300.json     items: {id "g1-001", zh, strokes (stroke-count group as printed), component_form? (部首变体, 13 chars e.g. 人→亻),
                            changyong_table (1|2), pinyin, readings[], level, tongyong_index}
changyong.json      items: {id "cy1-0001"/"cy2-0001", zh, table (1 = 字表一 2500, 2 = 字表二 1000), table_index (音序), pinyin, readings[], level, tongyong_index}
tongyong-8105.json  items: {id "ty-0001", zh, tier (1/2/3 = 一级/二级/三级), pinyin, readings[], level, tongyong_index (official 字序)}
```

- `pinyin`: pypinyin's default (most common) reading; if that reading is not among the table's readings, the table's first toned reading is used (+ override 卜 bǔ). Particles keep neutral tone (了 le, 的 de, 吗 ma). `readings`: all readings from the jaywcjlove data.
- `level`: lowest HSK 3.0 level (1–7, 7 = HSK 7–9) of any `data/hsk_words.json` word containing the character; `null` if none. grade1-300: 146 are HSK 1, 41 HSK 2, 55 HSK 3, 30 HSK 4, 17 HSK 5, 7 HSK 6, 4 HSK 7–9.
