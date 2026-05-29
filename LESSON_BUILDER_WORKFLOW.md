# Lesson Builder workflow — Buunduu Surtsgaay

Guided admin workflow at **`/admin/lesson-builder`** for creating a complete lesson package from draft to publish.

---

## What Lesson Builder does

Lesson Builder combines existing admin tools into one step-by-step dashboard:

1. **Select a lesson** — search by id, title, or Chinese title; see status and QA summary.
2. **Workflow checklist** — seven steps from draft creation through publish, with pass/fail status and links.
3. **Package summary** — metadata completeness, content counts, HSK distribution, translation gaps, publish readiness.
4. **Quick actions** — jump to create draft, edit page, previews, export, or Content QA dashboard.

It does **not** replace individual editors on `/admin/lessons/{id}/edit`. Those tools remain the place to generate prompts, import JSON, export backups, and publish.

---

## Recommended workflow

### 1. Create draft

- Go to **`/admin/lessons/new`** or use **New draft lesson** on Lesson Builder.
- Fill title, Chinese title, description, duration, order index.
- **Save draft** → redirects to `/admin/lessons/{id}/edit`.

### 2. Generate prompt

- On the edit page (or via Lesson Builder Step 2 link), open **Lesson content prompt generator**.
- Copy the ChatGPT prompt tailored to your lesson metadata.

### 3. Ask ChatGPT for JSON

- Paste the prompt into ChatGPT.
- Request JSON matching [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md): `subtitles`, `vocabulary`, `quizQuestions`.

### 4. Bulk import

- On **`/admin/lessons/{id}/edit`** → **Bulk import content**.
- **Validate JSON** → fix errors → choose **Append** or **Replace** → **Import content**.
- Use manual subtitle/vocabulary/quiz editors for small fixes.

### 5. QA check

- **Import QA summary** on the edit page (same logic as Lesson Builder package summary).
- **Content QA dashboard** at `/admin/lessons` for list-level overview.
- Publish readiness requires:
  - Complete metadata (title, Chinese title, description, duration)
  - At least one subtitle
  - ≥5 vocabulary words
  - ≥3 quiz questions
  - No missing Mongolian on subtitles/vocabulary
  - No quiz answer mismatches

### 6. Preview

- Draft/archived: `/lessons/{id}?preview=admin` (admin only)
- Sub-routes: `/watch`, `/vocabulary`, `/quiz` with `?preview=admin`
- Available lessons: public routes without preview param

### 7. Export backup

- On edit page → **Export lesson backup** → copy or download `lesson-{id}-backup.json`.
- Export **before publish** and **before any Replace import or restore**.

### 8. Publish

- On edit page → **Publishing controls** → **Publish** (enabled when QA passes).
- Lesson appears on `/courses/hsk5` and public `/lessons/{id}`.

---

## Using Lesson Builder with an existing lesson (e.g. Lesson 5)

1. Log in as admin → open **`/admin/lesson-builder`**.
2. Search or select **Lesson 5** in the lesson list.
3. Review **Lesson package summary** — counts, HSK distribution, readiness.
4. Follow the **Workflow checklist** — each step links to the right edit page or preview URL.
5. Use **Quick actions** for edit, watch preview, export, or QA dashboard.
6. When Step 7 shows **Ready to publish**, open edit page → Publish.

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Publishing with &lt;5 vocabulary or &lt;3 quiz | Import more content or add via manual editors |
| Missing Mongolian on subtitles/vocab | Edit rows or re-import corrected JSON |
| Quiz `correctAnswer` not in `options` | Fix in quiz editor or re-import |
| Metadata counts ≠ actual row counts | **Refresh counts** on edit page |
| Replace import without backup | Export JSON first; see [LESSON_BACKUP_RESTORE.md](./LESSON_BACKUP_RESTORE.md) |
| Preview 404 on draft without `?preview=admin` | Use admin preview links from Lesson Builder |

---

## Recovery with backup / restore

1. **Export backup** from edit page (or restore from a previous export file).
2. **Restore from backup** on edit page — append or replace (replace requires confirmation).
3. **Duplicate lesson** to copy a broken lesson to a new draft ID and start over.
4. See [LESSON_BACKUP_RESTORE.md](./LESSON_BACKUP_RESTORE.md) for full safety workflow.

---

## Related docs

- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md) — overall content pipeline
- [LESSON_PROMPT_TEMPLATE.md](./LESSON_PROMPT_TEMPLATE.md) — ChatGPT prompt
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md) — JSON import schema
- [LESSON_EXPORT_FORMAT.md](./LESSON_EXPORT_FORMAT.md) — backup export schema
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 admin roadmap
