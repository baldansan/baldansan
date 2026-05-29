# Korean Book 1 — PreLesson import index

**First import today:** `prelesson-01-vowels-basic.json` → `k-pre-01`  
**Level tag:** `KR-Beginner` on all vocabulary rows

---

## Import order (required sequence)

| # | File | Lesson ID | Title | orderIndex | Vocab | Quiz | Subs | Publish priority |
|---|------|-----------|-------|------------|-------|------|------|------------------|
| 1 | `prelesson-01-vowels-basic.json` | `k-pre-01` | PreLesson 01 — Үндсэн эгшиг | 0 | 12 | 10 | 5 | **P0 — tomorrow** |
| 2 | `prelesson-02-vowels-y-compound.json` | `k-pre-02` | PreLesson 02 — Нэмэлт эгшиг | 1 | 14 | 10 | 5 | P1 — week 1 |
| 3 | `prelesson-03-consonants-basic.json` | `k-pre-03` | PreLesson 03 — Үндсэн гийгүүлэгч | 2 | 16 | 10 | 5 | **P0 — tomorrow** |
| 4 | `prelesson-04-consonants-strong-aspirated.json` | `k-pre-04` | PreLesson 04 — Хүчтэй ба амьсгалтай | 3 | 13 | 10 | 5 | P1 — draft until QA |
| 5 | `prelesson-05-syllable-building.json` | `k-pre-05` | PreLesson 05 — Үе бүтээх | 4 | 15 | 12 | 5 | **P0 — tomorrow** |
| 6 | `prelesson-06-batchim.json` | `k-pre-06` | PreLesson 06 — 받침 | 5 | 12 | 12 | 5 | P2 — draft until QA |
| 7 | `prelesson-07-reading-practice.json` | `k-pre-07` | PreLesson 07 — Унших дасгал | 6 | 15 | 12 | 5 | P2 — draft until QA |
| 8 | `prelesson-08-final-test.json` | `k-pre-08` | PreLesson 08 — 한글 Final Test | 7 | 2 | 20 | 3 | P3 — draft until QA |

**Totals (8-lesson track):** 99 vocabulary rows, 96 quiz questions, 38 subtitle lines.

---

## Tomorrow publish recommendation (minimum)

Publish after QA:

1. `k-pre-01` — Үндсэн эгшиг  
2. `k-pre-03` — Үндсэн гийгүүлэгч  
3. `k-pre-05` — Үе бүтээх  

Keep `k-pre-02`, `k-pre-04`, `k-pre-06`–`08` as **draft** until reviewed.

Do **not** use combined `k-hangul` for tomorrow if the 8-lesson track is imported.

---

## Lesson shell fields (create in admin before import)

For each lesson ID above:

| Field | Value |
|-------|-------|
| `course_id` | `korean-1` |
| `id` | `k-pre-01` … `k-pre-08` (exact IDs) |
| `order_index` | 0–7 |
| `status` | `draft` until QA pass |
| `media_status` | `missing` |
| `source_note` | `Korean Book 1 · lessonType=prelesson` |

---

## After import routes

| Page | URL |
|------|-----|
| Course | `/courses/korean-1` |
| Lesson | `/lessons/k-pre-01` (replace ID) |
| Vocabulary | `/lessons/k-pre-01/vocabulary` |
| Quiz | `/lessons/k-pre-01/quiz` |
| Textbook watch | `/lessons/k-pre-01/watch` |
| Games | `/games/match?lessonId=k-pre-01` |

If Supabase uses numeric lesson IDs instead of string IDs, use the **actual inserted ID** from admin after creating the shell.

---

## Related

- [KOREAN_PRELESSON_IMPORT_STEPS.md](../../KOREAN_PRELESSON_IMPORT_STEPS.md)
- [KOREAN_PRELESSON_PUBLISH_QA.md](../../KOREAN_PRELESSON_PUBLISH_QA.md)
- [create-korean-course.sql](./create-korean-course.sql)
- [verify-korean-prelesson.sql](./verify-korean-prelesson.sql)
