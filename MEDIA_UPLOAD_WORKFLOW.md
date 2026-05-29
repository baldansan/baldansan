# Media upload workflow — Buunduu Surtsgaay

Phase 5 Step 16: Supabase Storage upload for lesson thumbnail, audio, and video.

---

## Overview

Admins upload files on **`/admin/lessons/{id}/edit`** → **Upload media files**. The app:

1. Validates file type and size
2. Uploads to Supabase Storage bucket `lesson-media`
3. Gets a public URL
4. Saves URL to `lessons.thumbnail_url`, `audio_url`, or `video_url`
5. Updates `media_status` automatically

Manual URL paste remains available in **Media URLs (manual)** below the upload card.

---

## One-time Supabase setup

### 1. Admin policies (if not done)

Run [supabase/policies/002_admin_content_policies.sql](./supabase/policies/002_admin_content_policies.sql) so `public.is_admin()` exists.

Bootstrap your admin user in `admin_profiles`.

### 2. Storage bucket + RLS

Run [supabase/storage/001_lesson_media_bucket_policies.sql](./supabase/storage/001_lesson_media_bucket_policies.sql) in Supabase SQL Editor.

Or create bucket manually:

1. Dashboard → **Storage** → **New bucket**
2. Name: `lesson-media`
3. **Public bucket:** on
4. Run only the policy section from the SQL file

See [supabase/storage/README.md](./supabase/storage/README.md) for folder layout.

---

## Upload steps (admin)

1. Open `/admin/lessons/{lessonId}/edit` (e.g. Lesson 5 draft).
2. Scroll to **Upload media files**.
3. For each type:
   - **Thumbnail** — choose JPEG/PNG/WebP (max 5MB)
   - **Audio** — choose MP3/WAV/M4A (max 50MB)
   - **Video** — choose MP4/WebM/MOV (max 500MB)
4. Click **Upload** — URL is saved automatically.
5. Preview appears in the upload card and in the manual URL section.
6. Verify on `/lessons/{id}?preview=admin` and `/lessons/{id}/watch?preview=admin`.
7. Set publish when QA + media are ready.

### Auto media status after upload

| Condition | `media_status` |
|-----------|----------------|
| Video URL set | `ready` |
| Thumbnail and/or audio only | `pending` |
| All cleared | `missing` |

Use **Auto-set status from URLs** in the manual editor if you paste URLs by hand.

---

## File formats

| Type | Allowed | Max size |
|------|---------|----------|
| Thumbnail | `.jpg`, `.jpeg`, `.png`, `.webp` | 5 MB |
| Audio | `.mp3`, `.wav`, `.m4a` | 50 MB |
| Video | `.mp4`, `.webm`, `.mov` | 500 MB |

---

## Storage path convention

```
lesson-media/lessons/{lessonId}/{mediaType}-{timestamp}-{filename}
```

Example:

```
lesson-media/lessons/5/video-1717000000000-intro.mp4
```

---

## Security

- **No `service_role` key** in the Next.js app — uploads use anon key + admin JWT.
- Storage RLS: public read, admin-only write (`public.is_admin()`).
- Draft lessons stay non-public; use `?preview=admin` to verify media before publish.

---

## Current limitations

- **No transcoding** — upload playable formats directly.
- **No CDN optimization** — public bucket URLs only.
- **No YouTube/Douyin embed** — direct file URLs or external links.
- Clearing media URLs does **not** delete Storage objects (future cleanup tool).

---

## Future (post Step 16)

- Video processing / transcoding pipeline
- Private bucket + signed URLs
- CDN / edge caching
- Storage object cleanup when media cleared

---

## Related docs

- [MEDIA_WORKFLOW.md](./MEDIA_WORKFLOW.md) — URL metadata + public display
- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md) — publish checklist
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 roadmap
