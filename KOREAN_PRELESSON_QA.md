# Korean PreLesson Hangul — QA checklist

Run this checklist **per lesson** after bulk import and before publish.

---

## Content completeness

- [ ] No empty Korean text in `chinese` / subtitle lines / quiz stems
- [ ] Romanization present in `pinyin` for vocabulary and subtitles (warnings OK if missing on one line; fix before publish)
- [ ] Mongolian explanation clear and grammatically correct
- [ ] `hskLevel` = `KR1` on vocabulary rows
- [ ] No fake `audioUrl` / `videoUrl` fields added

---

## Quiz integrity

- [ ] Every `correctAnswer` exactly matches one option string
- [ ] At least 2 options per question
- [ ] Question counts met:

| Lesson | Min vocab | Min quiz |
|--------|-----------|----------|
| k-pre-01 | 12 | 10 |
| k-pre-02 | 12 | 10 |
| k-pre-03 | 15 | 10 |
| k-pre-04 | 12 | 10 |
| k-pre-05 | 15 | 12 |
| k-pre-06 | 12 | 12 |
| k-pre-07 | 15 | 12 |
| k-pre-08 | review only | 20 |

- [ ] PreLesson 01–07: includes recognition, reading, combining, meaning mix
- [ ] Import QA badge on admin edit page: **Ready to publish** (or fix **Needs review** items)

---

## Admin import QA

On `/admin/lessons/{id}/edit`:

- [ ] **Validate JSON** — zero errors
- [ ] **Import QA summary** — subtitles > 0, vocabulary ≥ minimum, quiz ≥ minimum
- [ ] **Preview** `?preview=admin` — subtitles and vocab render
- [ ] Quiz preview — all questions display; selected answer marks correct

---

## Learner-facing

- [ ] Lesson appears under course `korean-1` at correct order
- [ ] Vocabulary / hanzi (character) page shows Hangul rows
- [ ] Practice games can pull vocab (Match, Translate) — spot-check 3 items
- [ ] Chinese / HSK routes unchanged (`/courses/hsk*`, HSK lessons still load)
- [ ] No regression on admin bulk import for existing Chinese lessons

---

## Media

- [ ] `media_status` = `missing` or `pending` (not `ready` without files)
- [ ] No broken media player from empty URLs
- [ ] Read-aloud tasks use subtitle text only (teacher-led until audio upload)

---

## Source audit (when HTML arrives)

- [ ] Compare vocabulary order to `Солонгос_Ном_PreLesson_Hangul_*.html`
- [ ] Update `_meta.needsSourceAudit` → `false` after sign-off
- [ ] Re-run quiz answer review against textbook answer key

---

## Sign-off log

| Lesson ID | Import date | QA by | Publish date | Notes |
|-----------|-------------|-------|--------------|-------|
| k-pre-01 | | | | |
| k-pre-02 | | | | |
| k-pre-03 | | | | |
| k-pre-04 | | | | |
| k-pre-05 | | | | |
| k-pre-06 | | | | |
| k-pre-07 | | | | |
| k-pre-08 | | | | |

---

## Quick smoke test (5 min)

1. Open `k-pre-01` as learner.
2. Complete 3 quiz questions — verify scoring.
3. Open vocabulary tab — ㅏ row shows Mongolian + romanization.
4. Open `/games/match` — Korean rows appear if course vocab is in pool.
5. Open any HSK lesson — confirm no Korean regression.
