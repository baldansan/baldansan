# HSK1 Source Master Audit

Canonical source coverage system for **HSK Standard Course 1** (15 lessons).

## Rule

**Source is mandatory. Enrichment is optional.**

No lesson ZIP may be created until the acceptance gate passes.

## Files

| Path | Purpose |
|------|---------|
| `content/hsk1/source-audit/hsk1-master-source-index.json` | Master registry (15 lessons, page refs, audio slots) |
| `content/hsk1/source-audit/hsk1-master-source-index.md` | Human-readable index + gate status |
| `content/hsk1/source-audit/lesson-NN-coverage-matrix.json` | Per-lesson PASS/FAIL/NEEDS_REVIEW rows |
| `content/hsk1/lesson-profiles/lesson-NN-profile.json` | Pedagogy, games, practice flow |
| `content/hsk1/source-audit/source-extraction-report.md` | PDF/audio extraction status |
| `content/hsk1/source-audit/missing-blocked-items-report.md` | Packaging gate blockers |

## Commands

```bash
npm run hsk1:audit:generate   # Regenerate all audit artifacts
npm run hsk1:audit:validate   # Exit 1 if packaging blocked
```

## Canonical lesson order

1. 你好 · 2. 谢谢你 · 3. 你叫什么名字 · 4. 她是我的汉语老师 · 5. 她女儿今年二十岁 · 6. 我会说汉语 · 7. 今天几号 · 8. 我想喝茶 · 9. 你儿子在哪儿工作 · 10. 我能坐这儿吗 · 11. 现在几点 · 12. 明天天气怎么样 · 13. 他在学做中国菜呢 · 14. 她买了不少衣服 · 15. 我是坐飞机来的

**Invalid legacy topics:** Lesson 2 = 你好吗, Lesson 4 = 你是哪国人

## Current status

- Source PDFs/ZIPs: **not in repo** — page ranges = `needs_manual_confirmation`
- Lesson 1: **partial** (V13 runtime overlay; PDF verification pending)
- Packaging: **BLOCKED** until extraction completes

## Next step after audit

Only when all required matrix rows are **PASS**:

Create **HSK1 Lesson N — V13 Source Complete Teacher-Led** packages one lesson at a time.
