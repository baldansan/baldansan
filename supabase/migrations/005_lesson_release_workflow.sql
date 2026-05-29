-- Phase 5 Step 21: Lesson release workflow columns (internal approval vs public status)
-- Run after 001–004 (and optionally 005_grant_is_admin_rpc). Safe to re-run (IF NOT EXISTS).
-- Complements lessons.status (draft / available / archived) — does not replace it.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'release_status'
  ) THEN
    ALTER TABLE public.lessons
      ADD COLUMN release_status text NOT NULL DEFAULT 'draft';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'qa_status'
  ) THEN
    ALTER TABLE public.lessons
      ADD COLUMN qa_status text NOT NULL DEFAULT 'needs_review';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE public.lessons ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE public.lessons ADD COLUMN approved_by uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'release_notes'
  ) THEN
    ALTER TABLE public.lessons ADD COLUMN release_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'last_reviewed_at'
  ) THEN
    ALTER TABLE public.lessons ADD COLUMN last_reviewed_at timestamptz;
  END IF;
END $$;

COMMENT ON COLUMN public.lessons.release_status IS
  'Internal release workflow: draft, in_review, approved, published, archived';
COMMENT ON COLUMN public.lessons.qa_status IS
  'Release QA gate: needs_review, passed, failed';
COMMENT ON COLUMN public.lessons.status IS
  'Public visibility: draft, available, archived (unchanged by this migration)';
