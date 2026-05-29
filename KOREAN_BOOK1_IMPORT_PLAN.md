# Korean Book 1 — Import plan

**Goal:** Make Korean lessons usable tomorrow for a learner preparing for work in South Korea (1 month timeline).

**Course ID:** `korean-1`

---

## Prerequisites

- Admin access to `/admin`
- Supabase configured (or local admin workflow)
- Source JSON in `content/korean-book-1/`
- **Re-upload HTML/PDF sources** when available for audit (not in repo today)

---

## Step 1 — Create course

### Option A: Admin UI

1. Open `/admin/lessons` or course management
2. Create course:
   - **ID:** `korean-1`
   - **Title:** Korean Book 1
   - **Description:** Монгол хүнд зориулсан Солонгос хэлний суурь хичээлүүд. Солонгост ажиллах, амьдрахад хэрэгтэй үг, өгүүлбэр, богино харилцан яриа, quiz-ээр суралцана.
   - **Level:** Beginner
   - **Status:** `draft` until QA passes

### Option B: SQL (optional)

Run `content/korean-book-1/course-setup.sql` in Supabase SQL editor (admin), then verify with `check-korean-course.sql`.

---

## Step 2 — Create lesson shells

Create three lessons **before** bulk import:

| order_index | Suggested ID | Title | chinese_title |
|-------------|--------------|-------|---------------|
| 0 | `k-hangul` | PreLesson — 한글 | 한글 |
| 1 | `k-01` | Lesson 01 — 소개 | 소개 |
| 2 | `k-02` | Lesson 02 — 학교 | 학교 |

For each lesson in admin edit:

- **status:** `draft`
- **media_status:** `missing` (no fake audio/video)
- **sourceNote:** `Korean Book 1 draft import — audio pending`
- **duration:** see JSON `lesson.duration`

---

## Step 3 — Bulk import (order matters)

Import in this order:

### 0. PreLesson Hangul

- File: `content/korean-book-1/prelesson-hangul.json`
- Page: `/admin/lessons/k-hangul/edit`
- Section: **Bulk import content**
- Mode: **Replace** (first import) — check confirmation box
- Paste full JSON (or only `subtitles`, `vocabulary`, `quizQuestions` arrays)
- Click import → **Refresh counts**

### 1. Lesson 01 소개

- File: `lesson-01-sogae.json`
- Lesson ID: `k-01`

### 2. Lesson 02 학교

- File: `lesson-02-hakgyo.json`
- Lesson ID: `k-02`

See [LESSON_IMPORT_FORMAT.md](../LESSON_IMPORT_FORMAT.md) for field rules.

---

## Step 4 — Preview each lesson

For each lesson:

1. **Admin preview:** `/lessons/{id}?preview=admin` (if enabled)
2. **Learner preview (draft):** publish to `available` only after QA, or use admin preview
3. Check:
   - Watch/subtitle lines show Korean + Mongolian
   - Vocabulary page lists all words
   - Quiz loads all questions; correct answers work

---

## Step 5 — Publish for tomorrow’s session

Minimum for day 1 learner:

1. ✅ `k-hangul` — available (Hangul foundation)
2. ✅ `k-01` — available (self-introduction)
3. ⏳ `k-02` — available if time permits

Publish checklist:

- [ ] metadata complete
- [ ] vocabulary ≥ 15 per lesson
- [ ] quiz ≥ 8 per lesson
- [ ] media_status = missing (honest, no fake URLs)
- [ ] QA doc signed off

---

## Step 6 — What to test tomorrow

| Test | Route |
|------|-------|
| Course visible | `/courses/korean-1` (after course wired in catalog) |
| Hangul lesson | `/lessons/k-hangul` |
| Vocabulary | `/lessons/k-hangul/vocabulary` |
| Quiz | `/lessons/k-hangul/quiz` |
| Lesson 01 flow | `/lessons/k-01` → vocab → quiz |
| Games (optional) | `/games/match?lessonId=k-01` if vocab imported |

**Note:** `/courses/korean-1` learner route requires course to exist in Supabase and appear in catalog. Until then, use direct lesson URLs after publish.

---

## Known missing assets

| Asset | Status |
|-------|--------|
| Audio (native pronunciation) | **Not included** — upload later; keep `media_status: missing` |
| Video lessons | **Not included** |
| Original HTML packages | **Not in repo** — re-upload for source audit |
| Textbook PDF | **Not in repo** — verify vocabulary against PDF |

---

## After source files are re-uploaded

1. Diff HTML vocabulary/quiz against JSON drafts
2. Update JSON in `content/korean-book-1/`
3. Re-import with **Replace** mode per lesson
4. Update `_meta.needsSourceAudit` to `false` when verified

---

## Does not change (this sprint)

- No new app features
- No UI redesign
- No database schema changes
- HSK5 / Chinese routes unchanged
