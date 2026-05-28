# Content workflow — lesson upload (planned)

Future workflow for admins publishing lessons through the Phase 5 admin UI. **Write/publish is not enabled yet** — use the QA dashboard before going live.

---

## Content QA before publish

Admins should use **`/admin/lessons`** (Lesson Management QA dashboard) to verify each lesson before publishing:

| Check | QA rule |
|-------|---------|
| Metadata | Title, Chinese title, description, duration present |
| Subtitles | At least one timed subtitle line |
| Vocabulary | At least one word; count matches metadata `vocabulary_count` |
| Quiz | At least one question; count matches metadata `quiz_count` |

QA badge **Complete** means all checks pass. **Needs review** lists warnings (e.g. “No subtitles”, “Count mismatch”). Preview public routes from the QA table before setting `available`.

---

See also: [ADMIN_PLAN.md](./ADMIN_PLAN.md), [CONTENT_AUTHORING_GUIDE.md](./CONTENT_AUTHORING_GUIDE.md) (developer/local authoring today).

---

## Overview

```mermaid
sequenceDiagram
  participant Admin
  participant AdminUI as Admin UI
  participant DB as Supabase Postgres
  participant App as Learner app

  Admin->>AdminUI: Create lesson draft
  AdminUI->>DB: INSERT lessons status=draft
  Admin->>AdminUI: Edit subtitles, vocab, quiz
  AdminUI->>DB: INSERT child rows
  Admin->>AdminUI: Preview
  AdminUI->>App: Preview route or admin embed
  Admin->>AdminUI: Publish
  AdminUI->>DB: UPDATE lessons status=available
  App->>DB: SELECT available lessons only
  App->>Admin: Verify /courses/hsk5 and /lessons/id
```

---

## Step-by-step workflow

### 1. Create lesson metadata

- Choose **course** (e.g. `hsk5`).
- Set **lesson id** (text, matches route: `'5'`, `'6'`, …).
- Fill **title**, **chinese_title**, **subtitle**, **description**, **duration**.
- Set **order_index** within the course.
- Initial **status:** `draft` (not visible to public learners once RLS + app filters ship).
- **vocabulary_count** / **quiz_count** — update after child rows are saved (or auto-computed in admin UI).

### 2. Add subtitle lines

For each timed line on the watch page:

| Field | Example |
|-------|---------|
| `start_time`, `end_time` | `00:00:05`, `00:00:12` |
| `chinese`, `pinyin`, `mongolian` | Line text |
| `order_index` | Playback order |

Validate: non-overlapping times (UI helper in Step 5), at least one line before publish.

### 3. Add vocabulary words

Per word:

| Field | Notes |
|-------|--------|
| `chinese`, `pinyin`, `mongolian` | Card content |
| `hsk_level` | `HSK3`–`HSK5` for filters |
| `example_chinese`, `example_mongolian` | Optional |
| `order_index` | List order |

These rows get a **`id` (bigserial)** used as `dbId` for `user_vocabulary_progress` when learners mark words learned.

### 4. Add quiz questions

Per question:

| Field | Notes |
|-------|--------|
| `type` | `multiple_choice` or `cloze` |
| `question`, `options` (JSON array), `correct_answer`, `explanation` | Match [lib/supabase/content.ts](./lib/supabase/content.ts) mapping |
| `order_index` | Question sequence |

### 5. Preview lesson

While **status = `draft`**:

- Admin UI shows learner-style preview (watch / vocabulary / quiz) **without** listing the lesson on public course page.
- Admins may use RLS policies that allow `SELECT` on draft lessons and children; learners cannot.

Fix content issues before publish.

### 6. Publish lesson

- Set **`lessons.status`** to **`available`**.
- Confirm **vocabulary_count** and **quiz_count** match child row counts.
- Optional: set course `status` to `available` if it was `coming_soon`.

**Publish** means the lesson appears on `/courses/hsk5` and `/lessons/{id}` for all users (Supabase-first; local fallback unchanged for lessons not in DB).

### 7. Verify in production paths

Checklist after publish:

- [ ] `/courses/hsk5` — lesson card visible, Start/Continue works
- [ ] `/lessons/{id}` — metadata and path card
- [ ] `/lessons/{id}/watch` — subtitles load in order
- [ ] `/lessons/{id}/vocabulary` — words and HSK filters
- [ ] `/lessons/{id}/quiz` — questions and scoring
- [ ] Signed-in user — progress writes still work (`user_*` tables)
- [ ] Guest — localStorage progress still works

### 8. Archive (optional)

When retiring a lesson:

- Set **`lessons.status`** to **`archived`**.
- Lesson hidden from public catalog; existing progress rows may remain for history (policy TBD in Step 8).

---

## Planned content statuses

| Status | Who sees it | Use case |
|--------|-------------|----------|
| **`draft`** | Admins only | Work in progress; preview in admin |
| **`available`** | Everyone (public read) | Published lesson; today’s seeds use this value |
| **`archived`** | Admins only (optional read for support) | Retired; not on course list |

**Today (migration 001):** `lessons.status` uses `available` | `locked` (learner “coming soon” on course card). Phase 5 Step 2 will align schema/docs: add `draft` and `archived`, map `locked` → preview or keep for “not yet published to catalog.”

**Courses** keep `available` | `coming_soon` for catalog-level gating.

---

## Data ownership

| Action | Target |
|--------|--------|
| Admin create/edit | Supabase tables only |
| Learner read | Supabase-first via [lib/content.ts](./lib/content.ts) |
| Fallback | Local `content/courses/hsk5/lessons/*.ts` when Supabase empty or env missing |

Admin workflow does **not** require editing local `.ts` files for new DB-only lessons. Local files remain for offline dev and fallback for Lessons 1–3.

---

## Comparison: today vs future

| Task | Today | After Phase 5 |
|------|--------|----------------|
| New lesson | SQL seed + optional `.ts` | Admin UI → Supabase |
| Fix typo in subtitle | Edit SQL, re-run | Admin subtitle editor |
| Unpublish | Change SQL / status manually | Archive in admin |
| Who can write | Developer with SQL access | `admin_profiles` + RLS |

---

## Related docs

- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — security and roadmap
- [supabase/SEED_PLAN.md](./supabase/SEED_PLAN.md) — legacy seed workflow
- [CONTENT_AUTHORING_GUIDE.md](./CONTENT_AUTHORING_GUIDE.md) — local TypeScript authoring
