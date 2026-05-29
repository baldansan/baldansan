# Supabase Storage — Lesson Media

Phase 5 Step 16: admin upload for lesson thumbnail, audio, and video files.

## Bucket plan

| Setting | Value |
|---------|--------|
| Bucket name | `lesson-media` |
| Public read | Yes (public URLs for now) |
| Upload | Authenticated admins only (Storage RLS) |
| Service role | **Never** use in the Next.js app |

## Folder structure

```
lesson-media/
  lessons/{lessonId}/thumbnail-{timestamp}-{filename}.jpg
  lessons/{lessonId}/audio-{timestamp}-{filename}.mp3
  lessons/{lessonId}/video-{timestamp}-{filename}.mp4
```

Example for Lesson 5:

```
lesson-media/lessons/5/thumbnail-1717000000000-cover.jpg
lesson-media/lessons/5/audio-1717000001000-dialogue.mp3
lesson-media/lessons/5/video-1717000002000-lesson.mp4
```

## App flow

1. Admin selects file on `/admin/lessons/[lessonId]/edit`.
2. Client uploads to `lesson-media` via Supabase JS (anon key + admin JWT).
3. App reads the public URL with `getPublicUrl`.
4. URL is saved to `lessons.thumbnail_url`, `audio_url`, or `video_url` via `updateLessonMedia`.
5. Public lesson/watch pages use those URLs when the lesson is published.

## Policies

Run [001_lesson_media_bucket_policies.sql](./001_lesson_media_bucket_policies.sql) in Supabase SQL Editor **after**:

- [supabase/policies/002_admin_content_policies.sql](../policies/002_admin_content_policies.sql) (so `public.is_admin()` exists)
- Admin bootstrap row in `admin_profiles`

## Dashboard alternative

If bucket SQL insert fails in your Supabase version:

1. Dashboard → **Storage** → **New bucket**
2. Name: `lesson-media`
3. Public bucket: **on**
4. Then run only the policy section of `001_lesson_media_bucket_policies.sql`

## Security notes

- Public read is intentional for learner playback (no transcoding/CDN yet).
- Only admins can insert/update/delete objects.
- Do not commit `.env.local` or `service_role` keys.
- Future: signed URLs, private bucket + CDN, video processing.

## Related docs

- [MEDIA_UPLOAD_WORKFLOW.md](../../MEDIA_UPLOAD_WORKFLOW.md)
- [MEDIA_WORKFLOW.md](../../MEDIA_WORKFLOW.md)
