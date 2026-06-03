# HSK1 Master Source Index

Generated: 2026-06-02T05:49:33.792Z

## Principle

Source content from HSK Standard Course 1 (textbook, teacher's book, workbook, answers, audio) is **mandatory**.
App enrichment is optional and must not replace, omit, or contradict source.

## Source files (expected upload set)

- **textbook**: `HSK-1-Textbook (1).pdf`
- **teacherBook**: `HSK_Standard_Course_1_Teacher_39_s_Book.pdf`
- **workbook**: `HSK-1-Workbook (1).pdf`
- **workbookAnswers**: `hsk1-workbook-answers (1).pdf`
- **textbookAudioZip**: `hsk1textbookaudios.zip`
- **workbookAudioZip**: `hsk1workbookaudios.zip`

**On disk in repo:** `not_in_repo` — PDF/ZIP extraction pending.

## Invalid legacy packages (do not reuse)

- Lesson 2: `你好吗` → must be `谢谢你` — Wrong topic for HSK1 Lesson 2
- Lesson 4: `你是哪国人` → must be `她是我的汉语老师` — Wrong topic for HSK1 Lesson 4

## Acceptance gate

| Criterion | Status |
|-----------|--------|
| textbookCoverage | 2% |
| teacherBookCoverage | 0% |
| workbookCoverage | 2% |
| workbookAnswerCoverage | 0% |
| audioCoverage | 0% |
| vocabularyCoverage | 2% |
| characterCoverage | 2% |
| learnerFlowReviewed | false |
| gameLogicReviewed | true |
| buildPasses | true |

**BLOCKED: missing source coverage — PDF page extraction, audio inventory, and workbook item-level extraction not complete for all 15 lessons.**

## Lesson order (canonical)

| # | lessonId | 中文 | English | Status |
|---|----------|------|---------|--------|
| 1 | `hsk1-l01-nihao` | 你好 | Hello | partial |
| 2 | `hsk1-l02-xiexie` | 谢谢你 | Thank you | pending |
| 3 | `hsk1-l03-name` | 你叫什么名字 | What's your name | pending |
| 4 | `hsk1-l04-teacher` | 她是我的汉语老师 | She is my Chinese teacher | pending |
| 5 | `hsk1-l05-age` | 她女儿今年二十岁 | Her daughter is twenty years old this year | pending |
| 6 | `hsk1-l06-speak-chinese` | 我会说汉语 | I can speak Chinese | pending |
| 7 | `hsk1-l07-date` | 今天几号 | What's the date today | pending |
| 8 | `hsk1-l08-tea` | 我想喝茶 | I'd like some tea | pending |
| 9 | `hsk1-l09-workplace` | 你儿子在哪儿工作 | Where does your son work | pending |
| 10 | `hsk1-l10-sit-here` | 我能坐这儿吗 | Can I sit here | pending |
| 11 | `hsk1-l11-time` | 现在几点 | What's the time now | pending |
| 12 | `hsk1-l12-weather` | 明天天气怎么样 | What will the weather be like tomorrow | pending |
| 13 | `hsk1-l13-cooking` | 他在学做中国菜呢 | He is learning to cook Chinese food | pending |
| 14 | `hsk1-l14-clothes` | 她买了不少衣服 | She has bought quite a few clothes | pending |
| 15 | `hsk1-l15-travel` | 我是坐飞机来的 | I came here by air | pending |

## Next steps

1. Place source PDFs/ZIPs in a controlled import folder (not committed if large).
2. Run page-range confirmation pass — update `needs_manual_confirmation` fields.
3. Extract audio inventories from both ZIP files.
4. Mark coverage matrix rows PASS only after verified extraction.
5. Re-run `npm run hsk1:audit:validate` until packaging gate opens.
6. Then create V13 packages lesson-by-lesson starting with Lesson 1.
