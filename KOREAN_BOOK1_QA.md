# Korean Book 1 — QA checklist

Use before marking lessons **available** for tomorrow’s learner session.

---

## Course `korean-1`

- [ ] Course row exists in Supabase `courses`
- [ ] Title and Mongolian-friendly description set
- [ ] Level = Beginner
- [ ] Status appropriate (`draft` → `available` after sign-off)

---

## Per lesson (`k-hangul`, `k-01`, `k-02`)

### Metadata

- [ ] `title`, `chinese_title` (Korean), `subtitle`, `description` filled
- [ ] `order_index` correct (0, 1, 2)
- [ ] `media_status` = `missing` or `pending` (not `ready` without real files)
- [ ] No fake `audio_url` / `video_url`

### Content counts

| Lesson | Min vocab | Min quiz | Target subtitles |
|--------|-----------|----------|------------------|
| k-hangul | 15 | 8 | 6+ |
| k-01 | 15 | 8 | 10 |
| k-02 | 15 | 8 | 10 |

- [ ] Counts match after **Refresh counts** on edit page

### Vocabulary quality

- [ ] Every row has Korean in `chinese` field
- [ ] Romanization in `pinyin` (where applicable)
- [ ] Mongolian meaning in `mongolian`
- [ ] Example sentences present for key items
- [ ] `hskLevel` = `KR1` (or consistent tag)

### Quiz quality

- [ ] Types are only `multiple_choice` or `cloze` (app-supported)
- [ ] Every `correctAnswer` **exactly** matches one `options` entry
- [ ] No empty Korean in questions/options
- [ ] Mongolian explanations readable
- [ ] No duplicate question IDs

### Learner routes

- [ ] `/lessons/{id}` loads
- [ ] `/lessons/{id}/vocabulary` shows words
- [ ] `/lessons/{id}/quiz` runs full quiz
- [ ] Subtitle/watch section shows lines (video placeholder OK)

### Media honesty

- [ ] No placeholder URLs pretending to be real media
- [ ] `sourceNote` mentions audio pending if applicable

---

## Source audit (when HTML/PDF available)

- [ ] Compared against `Солонгос_Ном_PreLesson_Hangul_*.html`
- [ ] Compared against `Солонгос_Ном_Lesson01_소개_*.html`
- [ ] Compared against `Солонгос_Ном_Lesson02_학교_*.html`
- [ ] Compared against textbook PDF vocabulary lists
- [ ] `_meta.needsSourceAudit` cleared in JSON after verification

---

## Tomorrow-ready sign-off

Minimum for **Day 1 session**:

- [ ] **k-hangul** — QA pass, available
- [ ] **k-01** — QA pass, available
- [ ] Learner can complete vocab + quiz on both without errors
- [ ] Import plan steps documented for admin operator

Optional same day:

- [ ] **k-02** imported and QA pass

**Signed off by:** _______________ **Date:** _______________
