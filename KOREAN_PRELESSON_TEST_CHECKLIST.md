# Korean PreLesson — Test checklist (today)

Run after bulk import, **before publish**. Use admin preview first, then learner routes after publish.

**First lesson under test:** `k-pre-01` (from `prelesson-01-vowels-basic.json`)

Replace `k-pre-01` with `k-pre-03` / `k-pre-05` when testing those imports.

---

## Pre-test

- [ ] `node content/korean-book-1/scripts/validate-prelessons.mjs` passes
- [ ] Course `korean-1` exists
- [ ] Lesson shell ID matches JSON (`k-pre-01`)
- [ ] Bulk import completed with **Replace**, no errors
- [ ] Lesson status still **draft** (not public yet)

---

## Admin preview (`?preview=admin`)

### Lesson detail

- [ ] `/lessons/k-pre-01?preview=admin` opens
- [ ] Title: **PreLesson 01 — Үндсэн эгшиг**
- [ ] Korean subtitle line visible (기본 모음 or MN subtitle)
- [ ] Links to vocabulary and quiz work
- [ ] Game practice links show **Korean labels** (Үсэг таних, not Холбох only)

### Vocabulary page

- [ ] `/lessons/k-pre-01/vocabulary?preview=admin` opens
- [ ] **Korean Hangul** displays in main script column (ㅏ, ㅓ, ㅗ, …)
- [ ] **Romanization** displays (a, eo, o, u, eu, i)
- [ ] **Mongolian** meaning/explanation displays clearly
- [ ] Level shows **KR-Beginner** (or filter includes it)
- [ ] TTS / speaker button renders without layout break
- [ ] No broken audio player (no fake URLs)

### Quiz page

- [ ] `/lessons/k-pre-01/quiz?preview=admin` opens
- [ ] 10 questions load
- [ ] Question text shows Hangul where expected
- [ ] Options are plausible (vowel romanizations, not random words)
- [ ] Selecting correct answer scores correctly
- [ ] Explanation shows after answer

### Watch / textbook page

- [ ] `/lessons/k-pre-01/watch?preview=admin` opens
- [ ] **Textbook UI** (title, vocab/quiz CTAs) — NOT “video not added” placeholder
- [ ] Subtitle / teacher lines readable (MN + KO)
- [ ] **mediaStatus missing** handled cleanly (no broken video element)

---

## Games (optional today)

- [ ] `/games/match?lessonId=k-pre-01` — pairs load (≥4)
- [ ] `/games/translate?lessonId=k-pre-01` — badge **Солонгос → Монгол**
- [ ] No **Хятад → Монгол** label on Korean lesson

---

## Draft vs public

- [ ] Without publish: lesson **not** visible to normal learners (draft)
- [ ] With `?preview=admin`: content visible to admin
- [ ] After publish + course available: `/lessons/k-pre-01` works without preview flag

---

## HSK regression (2 min)

- [ ] `/courses/hsk5` loads
- [ ] `/lessons/1/quiz` — Chinese lesson unchanged
- [ ] `/games/match?lessonId=1` — Chinese labels still OK

---

## Publish gate

Only check when all above pass:

- [ ] Publish `k-pre-01` in admin
- [ ] Set course `korean-1` to **available**
- [ ] Re-run vocabulary + quiz without preview flag
- [ ] Onboarding → select **Солонгос** → course shows PreLesson 01

---

## Sign-off

| Lesson ID | Tested by | Date | Pass? | Notes |
|-----------|-----------|------|-------|-------|
| k-pre-01 | | | | |
| k-pre-03 | | | | |
| k-pre-05 | | | | |

---

## Test URLs quick reference

| Page | URL |
|------|-----|
| Course | `/courses/korean-1` |
| Lesson | `/lessons/k-pre-01?preview=admin` |
| Vocabulary | `/lessons/k-pre-01/vocabulary?preview=admin` |
| Quiz | `/lessons/k-pre-01/quiz?preview=admin` |
| Watch | `/lessons/k-pre-01/watch?preview=admin` |
| Admin edit | `/admin/lessons/k-pre-01/edit` |
| Admin import area | `/admin/lessons/k-pre-01/edit` (bulk import section) |
