# Korean Book ZIP workflow

How Korean (and Chinese) lesson packages move from an external content project into Buunduu Surtsgaay.

---

## Overview

```
Korean content project          Buunduu Surtsgaay admin
─────────────────────          ───────────────────────
JSON + optional media    →     ZIP package
       │                            │
       └──────────────────►  /admin/import
                                    │
                                    ├─ Parse + validate
                                    ├─ Import draft lesson
                                    ├─ Upload audio/images (if present)
                                    └─ Preview + publish
```

---

## Step 1 — Prepare package (Korean project)

1. Export or copy lesson JSON aligned with [LESSON_ZIP_IMPORT_FORMAT.md](../LESSON_ZIP_IMPORT_FORMAT.md).
2. Use field mapping:
   - `chinese` → Korean Hangul
   - `pinyin` → romanization
   - `mongolian` → Mongolian explanation
3. Add `manifest.json` with `courseId: korean-1`, `language: ko-KR`.
4. Optional: place MP3 files under `audio/`, PNG/JPG under `images/`.
5. Zip root files (not the parent folder):

```
manifest.json
lesson.json
vocabulary.json
quiz.json
subtitles.json   (optional)
audio/           (optional)
images/          (optional)
```

Example starter: `content/templates/korean-hangul-zip-example/`

---

## Step 2 — Admin upload

1. Ensure course **`korean-1`** exists in Supabase/admin.
2. Open **`/admin/import`** (Admin → “ZIP import хийх”).
3. Select ZIP → **Parse / Validate**.
4. Fix any errors (missing files, quiz answer mismatch, etc.).
5. Click **Import as draft**.

Imported lesson status is always **`draft`**.

---

## Step 3 — Text vs media

| Content | On import |
|---------|-----------|
| Lesson metadata | Upserted |
| Vocabulary | Replace mode insert |
| Quiz | Replace mode insert |
| Subtitles | Replace mode insert |
| Lesson audio/thumbnail | Uploaded to `lesson-media` if Storage allows |
| Per-vocab audio | Validated only — **not in DB schema v1** |

If Storage fails:

- Text import still succeeds
- Warnings list failed files
- `media_status` = `missing` or `pending`

---

## Step 4 — Preview

After import, use links on the success panel:

- `/admin/lessons/{id}/edit` — metadata, manual JSON import still available
- `/lessons/{id}?preview=admin`
- `/lessons/{id}/vocabulary?preview=admin`
- `/lessons/{id}/quiz?preview=admin`

Check Mongolian copy, quiz answers, and TTS on vocabulary rows.

---

## Step 5 — Publish

1. Run lesson QA on edit page (same as JSON import path).
2. Upload missing lesson video/audio manually if ZIP had no media.
3. Publish when ready.

---

## TTS fallback

If audio files are not bundled or upload fails:

- Learners use **speaker buttons** (browser TTS `ko-KR`)
- Settings: `/profile` → Дуудлага (TTS)

See [TTS_PRONUNCIATION_SYSTEM.md](../TTS_PRONUNCIATION_SYSTEM.md).

---

## Hangul PreLessons

Package each prelesson as its own ZIP:

| lessonId | Content |
|----------|---------|
| `k-pre-01` … `k-pre-08` | Hangul track |
| `k-01` | 소개 |
| `k-02` | 학교 |

Source JSON already in `content/korean-book-1/prelesson-*.json` — convert to ZIP layout for bulk upload.

---

## Related

- [KOREAN_LESSON_PACKAGE_SPEC.md](../KOREAN_LESSON_PACKAGE_SPEC.md) — **Солонгос lesson package бүтэц, section урсгал**
- [KOREAN_PRELESSON_IMPORT_PLAN.md](../KOREAN_PRELESSON_IMPORT_PLAN.md) — JSON paste import order
- [LESSON_IMPORT_FORMAT.md](../LESSON_IMPORT_FORMAT.md) — single-lesson JSON bulk paste
- [MEDIA_UPLOAD_WORKFLOW.md](../MEDIA_UPLOAD_WORKFLOW.md)
