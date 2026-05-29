# Korean PreLesson — Admin import steps (today)

Import **Korean Book 1 Hangul** into the existing admin CMS. No new features — bulk JSON paste only.

**Content pack:** `content/korean-book-1/`

---

## Which file to import first?

| Priority | File | Lesson ID | Why |
|----------|------|-----------|-----|
| **Import first (today)** | `prelesson-01-vowels-basic.json` | `k-pre-01` | Smallest focused lesson; 6 vowels; best for complete beginner |
| Second (today) | `prelesson-03-consonants-basic.json` | `k-pre-03` | Basic consonants after vowels |
| Third (today) | `prelesson-05-syllable-building.json` | `k-pre-05` | Syllable building (가, 나, …) |
| Legacy (skip unless needed) | `prelesson-hangul.json` | `k-hangul` | Combined lesson — use 8-file track instead |

Full order: [korean-prelesson-import-index.md](./content/korean-book-1/korean-prelesson-import-index.md)

Validate before import:

```powershell
node content/korean-book-1/scripts/validate-prelessons.mjs
```

---

## Step 0 — Validate JSON locally

From project root:

```powershell
node content/korean-book-1/scripts/validate-prelessons.mjs
```

Must show **“All PreLesson JSON files passed validation.”**

Bulk import reads only: `subtitles`, `vocabulary`, `quizQuestions` (aliases: `quiz`, `words`, `subtitleLines`). The `lesson` block is for your reference when creating the admin shell.

---

## Step 1 — Create or check course `korean-1`

**Option A — Supabase SQL (manual):**

Run [content/korean-book-1/create-korean-course.sql](./content/korean-book-1/create-korean-course.sql)

**Option B — Admin UI:**

Open `/admin/lessons` → create course if missing.

| Field | Value |
|-------|-------|
| ID | `korean-1` |
| Title | Солонгост ажиллахад хэрэгтэй Солонгос хэл |
| Description | Солонгос үсэг, үндсэн үг, өгүүлбэр… |
| Level | Beginner |
| Status | `draft` until QA, then `available` |

Check learner route: `/courses/korean-1`

---

## Step 2 — Create lesson shell (first import: `k-pre-01`)

1. Open **`/admin/lessons/new`**
2. Fill metadata from `prelesson-01-vowels-basic.json` → `lesson` block:

| Field | Value |
|-------|-------|
| Lesson ID | `k-pre-01` |
| Course | `korean-1` |
| Title | PreLesson 01 — Үндсэн эгшиг |
| Chinese / target title | 기본 모음 |
| Subtitle | Солонгосын 6 үндсэн эгшиг — a, eo, o, u, eu, i |
| order_index | `0` |
| status | `draft` |
| media_status | `missing` |
| source_note | `Korean Book 1 · lessonType=prelesson` |

3. Save lesson.

Repeat for `k-pre-03`, `k-pre-05` when ready (same pattern, IDs from JSON).

**Legacy combined lesson** (`k-hangul`): only if you skip the 8-lesson track. Metadata from `prelesson-hangul.json`:

- Title: PreLesson — 한글  
- chineseTitle: 한글  
- Subtitle: Солонгос үсэг унших суурь  

---

## Step 3 — Bulk import JSON

1. Open **`/admin/lessons/k-pre-01/edit`**
2. Find **Bulk import content**
3. Open `content/korean-book-1/prelesson-01-vowels-basic.json` in editor
4. **Select all → Copy** (entire file)
5. Paste into bulk import textarea
6. Click **Validate JSON**
   - Zero errors required
   - Warnings about `skillTags` are OK
7. Mode: **Replace**
8. Confirm replace checkbox
9. Click **Import content**
10. Wait for success toast / message

---

## Step 4 — Preview (admin)

| Page | URL |
|------|-----|
| Admin edit | `/admin/lessons/k-pre-01/edit` |
| Lesson detail | `/lessons/k-pre-01?preview=admin` |
| Vocabulary | `/lessons/k-pre-01/vocabulary?preview=admin` |
| Quiz | `/lessons/k-pre-01/quiz?preview=admin` |
| Textbook watch | `/lessons/k-pre-01/watch?preview=admin` |

Check:

- Hangul in vocabulary (ㅏ, ㅓ, …)
- Romanization in pinyin column (a, eo, …)
- Mongolian explanations visible
- Quiz answers match options
- **No video placeholder error** — textbook UI for prelesson
- **No fake audio/video URLs**

---

## Step 5 — Publish (after QA only)

Run [KOREAN_PRELESSON_TEST_CHECKLIST.md](./KOREAN_PRELESSON_TEST_CHECKLIST.md) first.

1. On `/admin/lessons/k-pre-01/edit` → publish when QA passes
2. Set course `korean-1` to `available` if still draft
3. Re-test without `?preview=admin`

**Today minimum:** publish `k-pre-01` after checklist. Import `k-pre-03` + `k-pre-05` before end of day if time allows.

---

## Step 6 — Supabase verify (optional)

Run [verify-korean-prelesson.sql](./content/korean-book-1/verify-korean-prelesson.sql)

Expected for `k-pre-01`: vocab = 12, quiz = 10, media_status = missing.

---

## Lesson ID behavior

- JSON uses **string IDs**: `k-pre-01`, `k-pre-03`, …
- Admin shell **must use the same ID** before import
- If you create a numeric ID by mistake, learner URLs will not match this content pack — recreate shell with `k-pre-01`

---

## Field mapping reminder

| Korean content | JSON field |
|----------------|------------|
| Hangul ㅏ, 가, 한글 | `chinese` |
| Romanization a, ga | `pinyin` |
| Mongolian meaning | `mongolian` |
| Level | `hskLevel`: `KR-Beginner` |

---

## Related

- [KOREAN_PRELESSON_TEST_CHECKLIST.md](./KOREAN_PRELESSON_TEST_CHECKLIST.md)
- [KOREAN_PRELESSON_PUBLISH_QA.md](./KOREAN_PRELESSON_PUBLISH_QA.md)
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md)
