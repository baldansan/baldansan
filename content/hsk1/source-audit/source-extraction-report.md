# HSK1 Source Extraction Report

Generated as part of master audit bootstrap.

## Status: NOT STARTED (source PDFs/ZIPs not in repository)

### Required extraction pipeline

1. **Textbook PDF** (`HSK-1-Textbook (1).pdf`)
   - Per lesson: title, dialogues, English text, new words, pinyin, notes, characters, stroke order, culture
   - Record exact page numbers in master index

2. **Teacher's Book PDF** (`HSK_Standard_Course_1_Teacher_39_s_Book.pdf`)
   - Teaching goals, steps, pronunciation/character points, review, activities
   - Use internally for guided flow — never raw dump in learner UI

3. **Workbook PDF** (`HSK-1-Workbook (1).pdf`)
   - Sections 一–八 per lesson with full item lists
   - Page images as fallback when structured UI not ready

4. **Workbook answers PDF** (`hsk1-workbook-answers (1).pdf`)
   - Map answers to workbook sections 三–七 (and others where present)
   - Admin/review only

5. **Textbook audio ZIP** (`hsk1textbookaudios.zip`)
   - Full file inventory
   - Map to dialogues and pronunciation drills
   - `startSec`/`endSec` null unless verified

6. **Workbook audio ZIP** (`hsk1workbookaudios.zip`)
   - Map to listening exercises (typically sections 四–六)
   - Whole-exercise audio label when timestamps unknown

## Lesson 1 partial runtime overlay

The app already applies `applyHsk1L01V13GoldStandard` for `hsk1-l01-nihao`.
This is **enrichment**, not a substitute for PDF-backed source extraction.

Coverage matrix marks some L1 rows PASS with note: verify against PDF pages.

## Tooling

- Generate audit: `npm run hsk1:audit:generate`
- Validate gate: `npm run hsk1:audit:validate`
