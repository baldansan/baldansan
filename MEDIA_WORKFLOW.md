# Media workflow — Buunduu Surtsgaay

URL-based lesson media metadata foundation (Phase 5 Step 15). **No file upload yet.**

---

## Current media foundation

Admins attach media metadata to each lesson via **`/admin/lessons/{id}/edit`** → **Lesson media** section:

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

1. Add **video URL** (hosted mp4/webm or trusted external link)
2. Add **thumbnail URL** (cover image)
3. Optionally add **audio URL** and **source note**
4. Set **media status** to `ready` when verified
5. Preview at `/lessons/{id}?preview=admin` and `/lessons/{id}/watch?preview=admin`

Also available on **Lesson Builder** (`/admin/lesson-builder`) — selected lesson summary shows media status and video URL presence.

---

## No upload yet

This step stores **URLs only**. Admins paste links to already-hosted files (CDN, cloud storage, etc.).

**Future (Phase 5 Step 16):** Supabase Storage upload for lesson media — bucket, RLS, admin upload UI, signed URLs.

---

## Related docs

- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md) — full lesson publish pipeline
- [LESSON_BUILDER_WORKFLOW.md](./LESSON_BUILDER_WORKFLOW.md) — guided admin workflow
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — schema reference
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 roadmap
