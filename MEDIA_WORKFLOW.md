# Media workflow — Buunduu Surtsgaay

URL-based lesson media metadata (Phase 5 Step 15) plus **Supabase Storage upload** (Phase 5 Step 16).

---

## Current media foundation

Admins attach media via **`/admin/lessons/{id}/edit`**:

1. **Upload media files** — Supabase Storage (`lesson-media` bucket) → public URLs saved automatically
2. **Media URLs (manual)** — paste or override external URLs

See [MEDIA_UPLOAD_WORKFLOW.md](./MEDIA_UPLOAD_WORKFLOW.md) for upload setup and limits.

| Field | DB column | Purpose |
|-------|-----------|---------|
| Video URL | `video_url` | Main lesson video (direct mp4/webm or external page link) |
| Thumbnail URL | `thumbnail_url` | Cover image on lesson detail and video poster |
| Audio URL | `audio_url` | Optional audio resource (shadowing, podcast, etc.) |
| Source note | `source_note` | Admin note: platform, rights, original filename |
| Media status | `media_status` | Workflow flag: `missing`, `pending`, `ready` |

Migration: [supabase/migrations/002_lesson_media_fields.sql](./supabase/migrations/002_lesson_media_fields.sql)

---

## Media status values

| Status | Meaning |
|--------|---------|
| `missing` | No media configured (default) |
| `pending` | URLs added or in progress; not ready for learners |
| `ready` | Admin marked media complete; video URL should be set |

Content QA dashboard (`/admin/lessons`) shows media status and warnings:
- No video URL
- Media pending
- Thumbnail missing

---

## Public display behavior

### Lesson detail (`/lessons/{id}`)

- **Thumbnail URL** → cover card
- **Video URL** → “Video ready” + link to watch page
- **No video URL** → placeholder + “Video coming soon”

### Watch page (`/lessons/{id}/watch`)

- **Direct video URL** (`.mp4`, `.webm`, `.ogg`) → `<video controls>` with optional poster from thumbnail
- **Other video URL** → “Open video” external link card
- **No video URL** → existing placeholder
- **Audio URL** → audio controls (direct file) or “Open audio resource” link

YouTube/Douyin embeds are **not** implemented yet — use direct file URLs or external links for now.

---

## Admin workflow

Recommended before publish (see [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md)):

1. **Upload** thumbnail, audio, and video on the edit page (or paste URLs manually)
2. Confirm **media status** is `ready` when video is attached
3. Preview at `/lessons/{id}?preview=admin` and `/lessons/{id}/watch?preview=admin`
4. Publish when content QA + media are complete

Also available on **Lesson Builder** (`/admin/lesson-builder`) — checklist Step 5 **Media** and selected lesson summary (thumbnail/video/audio presence).

---

## Storage upload (Step 16)

Bucket: `lesson-media` (public read, admin-only upload).

Setup: [supabase/storage/001_lesson_media_bucket_policies.sql](./supabase/storage/001_lesson_media_bucket_policies.sql)

Full guide: [MEDIA_UPLOAD_WORKFLOW.md](./MEDIA_UPLOAD_WORKFLOW.md)

---

## Related docs

- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md) — full lesson publish pipeline
- [LESSON_BUILDER_WORKFLOW.md](./LESSON_BUILDER_WORKFLOW.md) — guided admin workflow
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — schema reference
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 roadmap
