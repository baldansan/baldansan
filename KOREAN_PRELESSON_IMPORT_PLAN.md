# Korean PreLesson Hangul — Import plan

Content pack: `content/korean-book-1/`  
Course ID: **`korean-1`**

---

## Source status

| Source | Status |
|--------|--------|
| `Солонгос_Ном_PreLesson_Hangul_한글_Premium_Package.html` | **Not in repo** — `needs_source_upload` |
| Textbook PDF | **Not in repo** |
| JSON content | **Draft** — standard Hangul curriculum, ready for admin import |

All JSON files set `_meta.sourceStatus: needs_source_upload`. Re-upload HTML/PDF for line-by-line audit when available.

---

## Step 1 — Create course

**Admin UI:** `/admin/courses` → New course

| Field | Value |
|-------|-------|
| ID | `korean-1` |
| Title | Korean Book 1 |
| Public title | Солонгост ажиллахад хэрэгтэй Солонгос хэл |
| Mongolian title | Монгол хүнд зориулсан Солонгос хэл 1 |
| Level | Beginner |
| Description | Солонгос үсэг, үндсэн үг, өгүүлбэр, ажил амьдралд хэрэгтэй хэллэгийг өдөр бүр богино хичээлээр сурах course. |
| Status | draft (publish when PreLesson 01 is QA-passed) |

**Or SQL:** run `content/korean-book-1/course-setup.sql` in Supabase SQL editor.

Verify with `content/korean-book-1/check-korean-course.sql`.

---

## Step 2 — Create lesson shells

Create each lesson under course `korean-1` before bulk import.

| order_index | Lesson ID | Title | Korean title |
|-------------|-----------|-------|--------------|
| 0 | `k-pre-01` | PreLesson 01 — Үндсэн эгшиг | 기본 모음 |
| 1 | `k-pre-02` | PreLesson 02 — Нэмэлт эгшиг | 이중 모음과 야/여/요/유 |
| 2 | `k-pre-03` | PreLesson 03 — Үндсэн гийгүүлэгч | 기본 자음 |
| 3 | `k-pre-04` | PreLesson 04 — Хүчтэй ба амьсгалтай гийгүүлэгч | 쌍자음과 격음 |
| 4 | `k-pre-05` | PreLesson 05 — Үе бүтээх | 음절 만들기 |
| 5 | `k-pre-06` | PreLesson 06 — 받침 | 받침 |
| 6 | `k-pre-07` | PreLesson 07 — Унших дасгал | 읽기 연습 |
| 7 | `k-pre-08` | PreLesson 08 — 한글 Final Test | 한글 종합 테스트 |
| 8 | `k-01` | Lesson 01 — 소개 | 소개 |
| 9 | `k-02` | Lesson 02 — 학교 | 학교 |

For each lesson:

- **media_status:** `missing`
- **source note:** `Korean Book 1 draft import — audio pending`
- **duration:** match JSON (`10–20 min` for prelessons)

---

## Step 3 — Import order

Import in this order via **`/admin/lessons/{id}/edit` → Bulk import content**:

1. `prelesson-01-vowels-basic.json` → `k-pre-01`
2. `prelesson-02-vowels-y-compound.json` → `k-pre-02`
3. `prelesson-03-consonants-basic.json` → `k-pre-03`
4. `prelesson-04-consonants-strong-aspirated.json` → `k-pre-04`
5. `prelesson-05-syllable-building.json` → `k-pre-05`
6. `prelesson-06-batchim.json` → `k-pre-06`
7. `prelesson-07-reading-practice.json` → `k-pre-07`
8. `prelesson-08-final-test.json` → `k-pre-08`
9. `lesson-01-sogae.json` → `k-01` (after Hangul track)
10. `lesson-02-hakgyo.json` → `k-02`

**First import per lesson:** mode **Replace** (checkbox confirmed).  
**Re-import after edits:** Export backup first, then Replace or Append as needed.

Paste full JSON file (including `lesson` block — metadata is ignored by content import).

---

## Step 4 — Publish priority

| Priority | Lesson | Why |
|----------|--------|-----|
| **P0 — tomorrow** | `k-pre-01` | First learner session: basic vowels |
| P1 — week 1 | `k-pre-02` … `k-pre-08` | Complete Hangul before 소개 |
| P2 — week 1 end | `k-01` | Self-introduction after Hangul test |
| P3 — week 2 | `k-02` | School / location phrases |

Publish only after [KOREAN_PRELESSON_QA.md](./KOREAN_PRELESSON_QA.md) passes for that lesson.

---

## Step 5 — Test with learner (tomorrow)

1. Ensure course `korean-1` is visible in catalog (draft preview or published).
2. Learner opens **PreLesson 01 — Үндсэн эгшиг**.
3. Walk through:
   - Subtitle lines (read Hangul + Mongolian)
   - Vocabulary / character grid (ㅏ–ㅣ)
   - Quiz (10 questions: recognition, reading, combining, meaning)
   - Optional: Match / Translate games if vocab is indexed
4. Teacher notes gaps → fix JSON → re-import → re-publish.
5. Homework: write ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ and read 아 어 오 우 으 이 aloud (no app audio yet).

---

## Exercise types (mapped to app schema)

App supports **`multiple_choice`** and **`cloze`** only.

| Design intent | Implementation |
|---------------|----------------|
| match | multiple_choice (Hangul ↔ romanization) |
| romanization_choice | multiple_choice |
| syllable_building | multiple_choice (combine letters) |
| batchim_identification | multiple_choice or cloze |
| read_aloud task | subtitle line text (no fake audio) |

Each PreLesson 01–07 includes per lesson: **3 recognition + 3 reading + 2 combining + 2 meaning** (+ extras where noted). PreLesson 08 has **20** mixed review questions.

---

## Known missing assets

| Asset | Status |
|-------|--------|
| Lesson audio | **missing** — set `media_status: missing` |
| Lesson video | **missing** |
| Source HTML/PDF | **needs_source_upload** |
| Course catalog wiring | Confirm `/courses/korean-1` route shows course after Supabase row exists |
| TTS / pronunciation | Not included — teacher-led or future upload |

Do **not** add placeholder audio URLs.

---

## Legacy file

`prelesson-hangul.json` (lesson ID `k-hangul`) is a **combined** single-lesson fallback from an earlier sprint. Prefer the **8-lesson track** (`k-pre-01` … `k-pre-08`) for daily teaching.

---

## Related docs

- [content/korean-book-1/README.md](./content/korean-book-1/README.md)
- [KOREAN_PRELESSON_QA.md](./KOREAN_PRELESSON_QA.md)
- [KOREAN_FIRST_MONTH_PLAN.md](./KOREAN_FIRST_MONTH_PLAN.md)
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md)
