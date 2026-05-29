# Korean Book 1 — Import content pack

**Course ID:** `korean-1`  
**Source textbook:** 몽골인을 위한 종합 한국어 / Монгол хүнд зориулсан Солонгос хэлний цогц сурах бичиг 1

## Source file status

| Expected source | In repo? | Notes |
|-----------------|----------|-------|
| `Солонгос_Ном_PreLesson_Hangul_한글_Premium_Package.html` | **No** | `needs_source_upload` — draft from standard Hangul curriculum |
| `Солонгос_Ном_Lesson01_소개_Premium_Package.html` | **No** | Draft JSON from known lesson outline |
| `Солонгос_Ном_Lesson02_학교_Premium_Package.html` | **No** | Draft JSON from beginner textbook patterns |
| Textbook PDF | **No** | Re-upload for vocabulary/quiz verification |

Content in this folder is **import-ready draft** content. Fields named `chinese` / `pinyin` store **Korean Hangul** and **romanization** per app convention.

## PreLesson Hangul track (8 lessons)

| File | Lesson ID | order_index | Focus |
|------|-----------|-------------|-------|
| `prelesson-01-vowels-basic.json` | `k-pre-01` | 0 | ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ |
| `prelesson-02-vowels-y-compound.json` | `k-pre-02` | 1 | ㅑ ㅕ ㅛ ㅠ ㅐ ㅔ ㅒ ㅖ |
| `prelesson-03-consonants-basic.json` | `k-pre-03` | 2 | ㄱ–ㅎ basic |
| `prelesson-04-consonants-strong-aspirated.json` | `k-pre-04` | 3 | ㅋ ㅌ ㅍ ㅊ ㄲ ㄸ ㅃ ㅆ ㅉ |
| `prelesson-05-syllable-building.json` | `k-pre-05` | 4 | CV syllables |
| `prelesson-06-batchim.json` | `k-pre-06` | 5 | 받침 |
| `prelesson-07-reading-practice.json` | `k-pre-07` | 6 | Reading drills |
| `prelesson-08-final-test.json` | `k-pre-08` | 7 | 20-question review |

## Main lessons

| File | Lesson ID | order_index |
|------|-----------|-------------|
| `lesson-01-sogae.json` | `k-01` | 8 |
| `lesson-02-hakgyo.json` | `k-02` | 9 |

## Other files

| File | Purpose |
|------|---------|
| `course-metadata.json` | Course + lesson reference |
| `course-setup.sql` | Optional course row INSERT |
| `check-korean-course.sql` | Verification queries |
| `prelesson-hangul.json` | **Legacy** combined Hangul lesson (`k-hangul`) — use 8-file track instead |
| `scripts/generate-prelessons.mjs` | Regenerate prelesson JSON (dev only) |

## Field mapping (Korean → app schema)

| Korean content | JSON / DB field |
|----------------|-----------------|
| Hangul (한글, 소개, …) | `chinese`, `exampleChinese`, subtitle `chinese` |
| Romanization (annyeonghaseyo) | `pinyin` |
| Mongolian meaning / grammar note | `mongolian`, `exampleMongolian`, subtitle `mongolian` |
| Level tag | `hskLevel`: use `KR1` (Beginner) |

## Media

- **No audio or video URLs** are included (do not fake media).
- Set `media_status` to **`missing`** or **`pending`** until real files are uploaded.
- `sourceNote` in lesson metadata: `Korean Book 1 draft import — audio pending`.

## Quick start

1. Read [KOREAN_PRELESSON_IMPORT_PLAN.md](../../KOREAN_PRELESSON_IMPORT_PLAN.md)
2. Create course `korean-1` in admin (or run `course-setup.sql`)
3. Create lessons `k-pre-01` … `k-pre-08`, then `k-01`, `k-02`
4. Bulk import each JSON on `/admin/lessons/{id}/edit` (**Replace** on first import)
5. Run [KOREAN_PRELESSON_QA.md](../../KOREAN_PRELESSON_QA.md) checklist

## Tomorrow’s learner path

1. **PreLesson 01 — Үндсэн эгшиг** (`k-pre-01`) — publish first  
2. PreLessons 02–08 — one per day or two per day as pace allows  
3. **Lesson 01 — 소개** after Hangul track complete

See [KOREAN_FIRST_MONTH_PLAN.md](../../KOREAN_FIRST_MONTH_PLAN.md) for the full month outline.
