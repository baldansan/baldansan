-- =============================================================================
-- Buunduu Surtsgaay — Phase 6 Step 2: Production verification (read-only)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor.
-- Safe: SELECT only — no INSERT/UPDATE/DELETE.
-- Output columns: check_group | check_name | status | details
-- Status: pass | warn | fail
-- =============================================================================

-- Helper: table exists in public schema
-- Helper: column exists on public.lessons

WITH
checks AS (

  -- -------------------------------------------------------------------------
  -- A. Core content tables
  -- -------------------------------------------------------------------------
  SELECT 'core_tables'::text AS check_group, 'courses'::text AS check_name,
    CASE WHEN to_regclass('public.courses') IS NOT NULL THEN 'pass' ELSE 'fail' END AS status,
    CASE WHEN to_regclass('public.courses') IS NOT NULL THEN 'Table exists.'
         ELSE 'Missing — run supabase/migrations/001_initial_schema.sql' END AS details
  UNION ALL
  SELECT 'core_tables', 'lessons',
    CASE WHEN to_regclass('public.lessons') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.lessons') IS NOT NULL THEN 'Table exists.'
         ELSE 'Missing — run 001_initial_schema.sql' END
  UNION ALL
  SELECT 'core_tables', 'subtitle_lines',
    CASE WHEN to_regclass('public.subtitle_lines') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.subtitle_lines') IS NOT NULL THEN 'Table exists.'
         ELSE 'Missing — run 001_initial_schema.sql' END
  UNION ALL
  SELECT 'core_tables', 'vocabulary_words',
    CASE WHEN to_regclass('public.vocabulary_words') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.vocabulary_words') IS NOT NULL THEN 'Table exists.'
         ELSE 'Missing — run 001_initial_schema.sql' END
  UNION ALL
  SELECT 'core_tables', 'quiz_questions',
    CASE WHEN to_regclass('public.quiz_questions') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.quiz_questions') IS NOT NULL THEN 'Table exists.'
         ELSE 'Missing — run 001_initial_schema.sql' END

  -- -------------------------------------------------------------------------
  -- B. User progress tables
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'user_progress', 'user_lesson_progress',
    CASE WHEN to_regclass('public.user_lesson_progress') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.user_lesson_progress') IS NOT NULL THEN 'Table exists.'
         ELSE 'Missing — run 001_initial_schema.sql' END
  UNION ALL
  SELECT 'user_progress', 'user_vocabulary_progress',
    CASE WHEN to_regclass('public.user_vocabulary_progress') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.user_vocabulary_progress') IS NOT NULL THEN 'Table exists.'
         ELSE 'Missing — run 001_initial_schema.sql' END
  UNION ALL
  SELECT 'user_progress', 'user_quiz_attempts',
    CASE WHEN to_regclass('public.user_quiz_attempts') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.user_quiz_attempts') IS NOT NULL THEN 'Table exists.'
      ELSE 'Missing — run 001_initial_schema.sql' END
  UNION ALL
  SELECT 'user_retention', 'user_daily_activity',
    CASE WHEN to_regclass('public.user_daily_activity') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.user_daily_activity') IS NOT NULL THEN 'Table exists.'
      ELSE 'Missing — run 009_user_retention.sql' END
  UNION ALL
  SELECT 'user_retention', 'user_daily_goals',
    CASE WHEN to_regclass('public.user_daily_goals') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.user_daily_goals') IS NOT NULL THEN 'Table exists.'
      ELSE 'Missing — run 009_user_retention.sql' END
  UNION ALL
  SELECT 'user_retention', 'user_streaks',
    CASE WHEN to_regclass('public.user_streaks') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.user_streaks') IS NOT NULL THEN 'Table exists.'
      ELSE 'Missing — run 009_user_retention.sql' END
  UNION ALL
  SELECT 'user_engagement', 'user_study_reminders',
    CASE WHEN to_regclass('public.user_study_reminders') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.user_study_reminders') IS NOT NULL THEN 'Table exists.'
      ELSE 'Missing — run 010_user_reminders_achievements.sql' END
  UNION ALL
  SELECT 'user_engagement', 'user_notifications',
    CASE WHEN to_regclass('public.user_notifications') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.user_notifications') IS NOT NULL THEN 'Table exists.'
      ELSE 'Missing — run 010_user_reminders_achievements.sql' END
  UNION ALL
  SELECT 'user_engagement', 'user_achievements',
    CASE WHEN to_regclass('public.user_achievements') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.user_achievements') IS NOT NULL THEN 'Table exists.'
      ELSE 'Missing — run 010_user_reminders_achievements.sql' END

  -- -------------------------------------------------------------------------
  -- C. Admin / CMS tables
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'admin_cms', 'admin_profiles',
    CASE WHEN to_regclass('public.admin_profiles') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.admin_profiles') IS NOT NULL THEN 'Table exists.'
         ELSE 'Missing — run supabase/admin/001_admin_profiles_setup.sql' END
  UNION ALL
  SELECT 'admin_cms', 'admin_tasks',
    CASE WHEN to_regclass('public.admin_tasks') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.admin_tasks') IS NOT NULL THEN 'Table exists.'
         ELSE 'Missing — run supabase/migrations/006_admin_tasks.sql' END
  UNION ALL
  SELECT 'admin_cms', 'admin_activity_log',
    CASE WHEN to_regclass('public.admin_activity_log') IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN to_regclass('public.admin_activity_log') IS NOT NULL THEN 'Table exists.'
         ELSE 'Missing — run supabase/migrations/007_admin_activity_log.sql' END

  -- -------------------------------------------------------------------------
  -- D. Lesson media columns
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'lesson_media_columns', col.column_name,
    CASE WHEN col.column_name IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN col.column_name IS NOT NULL THEN 'Column exists on public.lessons.'
         ELSE 'Missing — run supabase/migrations/002_lesson_media_fields.sql' END
  FROM (VALUES
    ('video_url'),
    ('thumbnail_url'),
    ('audio_url'),
    ('source_note'),
    ('media_status')
  ) AS expected(column_name)
  LEFT JOIN information_schema.columns col
    ON col.table_schema = 'public'
   AND col.table_name = 'lessons'
   AND col.column_name = expected.column_name

  -- -------------------------------------------------------------------------
  -- E. Release workflow columns
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'release_workflow_columns', expected.column_name,
    CASE WHEN col.column_name IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN col.column_name IS NOT NULL THEN 'Column exists on public.lessons.'
         ELSE 'Missing — run supabase/migrations/005_lesson_release_workflow.sql' END
  FROM (VALUES
    ('release_status'),
    ('qa_status'),
    ('approved_at'),
    ('approved_by'),
    ('release_notes'),
    ('last_reviewed_at')
  ) AS expected(column_name)
  LEFT JOIN information_schema.columns col
    ON col.table_schema = 'public'
   AND col.table_name = 'lessons'
   AND col.column_name = expected.column_name

  -- -------------------------------------------------------------------------
  -- F. Activity snapshot columns
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'activity_snapshots', expected.column_name,
    CASE WHEN col.column_name IS NOT NULL THEN 'pass' ELSE 'fail' END,
    CASE WHEN col.column_name IS NOT NULL THEN 'Column exists on admin_activity_log.'
         ELSE 'Missing — run supabase/migrations/008_admin_activity_snapshots.sql' END
  FROM (VALUES
    ('before_snapshot'),
    ('after_snapshot'),
    ('diff_summary')
  ) AS expected(column_name)
  LEFT JOIN information_schema.columns col
    ON col.table_schema = 'public'
   AND col.table_name = 'admin_activity_log'
   AND col.column_name = expected.column_name

  -- -------------------------------------------------------------------------
  -- G. Required functions
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'functions', 'is_admin',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) THEN 'pass' ELSE 'fail' END,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) THEN 'Function public.is_admin() exists.'
         ELSE 'Missing — run supabase/admin/001_admin_profiles_setup.sql' END
  UNION ALL
  SELECT 'functions', 'get_lesson_route_status',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'get_lesson_route_status'
    ) THEN 'pass' ELSE 'fail' END,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'get_lesson_route_status'
    ) THEN 'RPC exists for lesson visibility.'
         ELSE 'Missing — run supabase/migrations/003_lesson_route_status.sql' END
  UNION ALL
  SELECT 'functions', 'get_admin_lesson_bundle',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'get_admin_lesson_bundle'
    ) THEN 'pass' ELSE 'fail' END,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'get_admin_lesson_bundle'
    ) THEN 'RPC exists for admin lesson fetch.'
         ELSE 'Missing — run supabase/migrations/004_admin_lesson_bundle.sql' END
  UNION ALL
  SELECT 'functions', 'update_updated_at_column',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
    ) THEN 'pass' ELSE 'warn' END,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
    ) THEN 'Trigger helper exists.'
         ELSE 'Missing — usually from 001_initial_schema.sql' END

  -- -------------------------------------------------------------------------
  -- H. Storage bucket
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'storage', 'lesson-media bucket',
    CASE
      WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'lesson-media') THEN 'pass'
      ELSE 'fail'
    END,
    CASE
      WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'lesson-media') THEN
        'Bucket exists' ||
        CASE WHEN (SELECT public FROM storage.buckets WHERE id = 'lesson-media')
          THEN ' (public read enabled).' ELSE ' (not public — check storage settings).' END
      ELSE 'Missing — run supabase/storage/001_lesson_media_bucket_policies.sql or create bucket in Dashboard.'
    END

  -- -------------------------------------------------------------------------
  -- I. RLS enabled
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'rls_enabled', t.table_name,
    CASE
      WHEN c.relrowsecurity THEN 'pass'
      WHEN to_regclass('public.' || t.table_name) IS NULL THEN 'fail'
      ELSE 'warn'
    END,
    CASE
      WHEN to_regclass('public.' || t.table_name) IS NULL THEN 'Table missing.'
      WHEN c.relrowsecurity THEN 'RLS enabled.'
      ELSE 'RLS not enabled — review policies before production.'
    END
  FROM (VALUES
    ('admin_profiles'),
    ('admin_tasks'),
    ('admin_activity_log'),
    ('user_lesson_progress'),
    ('user_vocabulary_progress'),
    ('user_quiz_attempts'),
    ('user_daily_activity'),
    ('user_daily_goals'),
    ('user_streaks'),
    ('user_study_reminders'),
    ('user_notifications'),
    ('user_achievements'),
    ('lessons'),
    ('subtitle_lines'),
    ('vocabulary_words'),
    ('quiz_questions')
  ) AS t(table_name)
  LEFT JOIN pg_class c ON c.relname = t.table_name
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'

  -- -------------------------------------------------------------------------
  -- J. Policy existence (count > 0)
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'policies', pol.tablename,
    CASE
      WHEN pol.policy_count > 0 THEN 'pass'
      WHEN to_regclass('public.' || pol.tablename) IS NULL THEN 'fail'
      ELSE 'warn'
    END,
    CASE
      WHEN to_regclass('public.' || pol.tablename) IS NULL THEN 'Table missing.'
      WHEN pol.policy_count > 0 THEN pol.policy_count::text || ' policy/policies found.'
      ELSE 'No policies — run RLS policy SQL for this table.'
    END
  FROM (
    SELECT expected.tablename,
      COALESCE(COUNT(p.policyname), 0)::int AS policy_count
    FROM (VALUES
      ('admin_profiles'),
      ('admin_tasks'),
      ('admin_activity_log'),
      ('user_lesson_progress'),
      ('user_vocabulary_progress'),
      ('user_quiz_attempts'),
      ('lessons')
    ) AS expected(tablename)
    LEFT JOIN pg_policies p
      ON p.schemaname = 'public' AND p.tablename = expected.tablename
    GROUP BY expected.tablename
  ) pol

  UNION ALL
  SELECT 'policies', 'storage.objects (lesson-media)',
    CASE WHEN COALESCE(sp.cnt, 0) > 0 THEN 'pass' ELSE 'warn' END,
    CASE WHEN COALESCE(sp.cnt, 0) > 0
      THEN sp.cnt::text || ' storage policy/policies for lesson-media.'
      ELSE 'No storage policies — run supabase/storage/001_lesson_media_bucket_policies.sql' END
  FROM (
    SELECT COUNT(*)::int AS cnt
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (
        policyname ILIKE '%lesson%media%'
        OR qual::text ILIKE '%lesson-media%'
        OR with_check::text ILIKE '%lesson-media%'
      )
  ) sp

  -- -------------------------------------------------------------------------
  -- J2. Security — is_admin qualification in policies
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'security', 'is_admin policy qualification',
    CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname IN ('public', 'storage')
          AND (
            (p.qual IS NOT NULL AND p.qual::text ~* '\mis_admin\s*\(' AND p.qual::text !~* 'public\.is_admin\s*\(')
            OR (p.with_check IS NOT NULL AND p.with_check::text ~* '\mis_admin\s*\(' AND p.with_check::text !~* 'public\.is_admin\s*\(')
          )
      ) THEN 'warn'
      ELSE 'pass'
    END,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname IN ('public', 'storage')
          AND (
            (p.qual IS NOT NULL AND p.qual::text ~* '\mis_admin\s*\(' AND p.qual::text !~* 'public\.is_admin\s*\(')
            OR (p.with_check IS NOT NULL AND p.with_check::text ~* '\mis_admin\s*\(' AND p.with_check::text !~* 'public\.is_admin\s*\(')
          )
      ) THEN 'Some policies use bare is_admin() — prefer public.is_admin(auth.uid()).'
      ELSE 'No unqualified is_admin() references found in policy expressions.'
    END

  UNION ALL
  SELECT 'security', 'admin_activity_log policies',
    CASE
      WHEN to_regclass('public.admin_activity_log') IS NULL THEN 'fail'
      WHEN COALESCE((
        SELECT COUNT(*)::int FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'admin_activity_log'
      ), 0) = 0 THEN 'warn'
      ELSE 'pass'
    END,
    CASE
      WHEN to_regclass('public.admin_activity_log') IS NULL THEN 'Table missing — run 007_admin_activity_log.sql'
      WHEN COALESCE((
        SELECT COUNT(*)::int FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'admin_activity_log'
      ), 0) = 0 THEN 'No policies — run 002_admin_content_policies.sql'
      ELSE (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_activity_log') || ' policy/policies.'
    END

  UNION ALL
  SELECT 'security', 'admin_tasks policies',
    CASE
      WHEN to_regclass('public.admin_tasks') IS NULL THEN 'fail'
      WHEN COALESCE((
        SELECT COUNT(*)::int FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'admin_tasks'
      ), 0) = 0 THEN 'warn'
      ELSE 'pass'
    END,
    CASE
      WHEN to_regclass('public.admin_tasks') IS NULL THEN 'Table missing — run 006_admin_tasks.sql'
      WHEN COALESCE((
        SELECT COUNT(*)::int FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'admin_tasks'
      ), 0) = 0 THEN 'No policies — run 002_admin_content_policies.sql'
      ELSE (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_tasks') || ' policy/policies.'
    END

  UNION ALL
  SELECT 'policies', 'content: subtitle_lines',
    CASE WHEN pol.policy_count > 0 THEN 'pass' WHEN to_regclass('public.subtitle_lines') IS NULL THEN 'fail' ELSE 'warn' END,
    CASE WHEN to_regclass('public.subtitle_lines') IS NULL THEN 'Table missing.'
         WHEN pol.policy_count > 0 THEN pol.policy_count::text || ' policy/policies found.'
         ELSE 'No policies — run 002_admin_content_policies.sql' END
  FROM (
    SELECT COALESCE(COUNT(p.policyname), 0)::int AS policy_count
    FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'subtitle_lines'
  ) pol

  UNION ALL
  SELECT 'policies', 'content: vocabulary_words',
    CASE WHEN pol.policy_count > 0 THEN 'pass' WHEN to_regclass('public.vocabulary_words') IS NULL THEN 'fail' ELSE 'warn' END,
    CASE WHEN to_regclass('public.vocabulary_words') IS NULL THEN 'Table missing.'
         WHEN pol.policy_count > 0 THEN pol.policy_count::text || ' policy/policies found.'
         ELSE 'No policies — run 002_admin_content_policies.sql' END
  FROM (
    SELECT COALESCE(COUNT(p.policyname), 0)::int AS policy_count
    FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'vocabulary_words'
  ) pol

  UNION ALL
  SELECT 'policies', 'content: quiz_questions',
    CASE WHEN pol.policy_count > 0 THEN 'pass' WHEN to_regclass('public.quiz_questions') IS NULL THEN 'fail' ELSE 'warn' END,
    CASE WHEN to_regclass('public.quiz_questions') IS NULL THEN 'Table missing.'
         WHEN pol.policy_count > 0 THEN pol.policy_count::text || ' policy/policies found.'
         ELSE 'No policies — run 002_admin_content_policies.sql' END
  FROM (
    SELECT COALESCE(COUNT(p.policyname), 0)::int AS policy_count
    FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'quiz_questions'
  ) pol

  -- -------------------------------------------------------------------------
  -- K. Data sanity
  -- -------------------------------------------------------------------------
  UNION ALL
  SELECT 'data_sanity', 'lessons total',
    CASE WHEN to_regclass('public.lessons') IS NULL THEN 'fail'
         WHEN (SELECT COUNT(*) FROM public.lessons) = 0 THEN 'warn'
         ELSE 'pass' END,
    CASE WHEN to_regclass('public.lessons') IS NULL THEN 'Table missing.'
         ELSE (SELECT COUNT(*)::text FROM public.lessons) || ' lesson(s).' END
  UNION ALL
  SELECT 'data_sanity', 'lessons available',
    CASE WHEN to_regclass('public.lessons') IS NULL THEN 'fail'
         WHEN (SELECT COUNT(*) FROM public.lessons WHERE status = 'available') = 0 THEN 'warn'
         ELSE 'pass' END,
    CASE WHEN to_regclass('public.lessons') IS NULL THEN 'Table missing.'
         ELSE (SELECT COUNT(*)::text FROM public.lessons WHERE status = 'available') || ' available lesson(s).' END
  UNION ALL
  SELECT 'data_sanity', 'lessons draft',
    CASE WHEN to_regclass('public.lessons') IS NULL THEN 'fail' ELSE 'pass' END,
    CASE WHEN to_regclass('public.lessons') IS NULL THEN 'Table missing.'
         ELSE (SELECT COUNT(*)::text FROM public.lessons WHERE status = 'draft') || ' draft lesson(s).' END
  UNION ALL
  SELECT 'data_sanity', 'admin_profiles',
    CASE WHEN to_regclass('public.admin_profiles') IS NULL THEN 'fail'
         WHEN (SELECT COUNT(*) FROM public.admin_profiles) = 0 THEN 'warn'
         ELSE 'pass' END,
    CASE WHEN to_regclass('public.admin_profiles') IS NULL THEN 'Table missing.'
         ELSE (SELECT COUNT(*)::text FROM public.admin_profiles) || ' admin profile(s).' END
  UNION ALL
  SELECT 'data_sanity', 'subtitle_lines',
    CASE WHEN to_regclass('public.subtitle_lines') IS NULL THEN 'fail' ELSE 'pass' END,
    CASE WHEN to_regclass('public.subtitle_lines') IS NULL THEN 'Table missing.'
         ELSE (SELECT COUNT(*)::text FROM public.subtitle_lines) || ' row(s).' END
  UNION ALL
  SELECT 'data_sanity', 'vocabulary_words',
    CASE WHEN to_regclass('public.vocabulary_words') IS NULL THEN 'fail' ELSE 'pass' END,
    CASE WHEN to_regclass('public.vocabulary_words') IS NULL THEN 'Table missing.'
         ELSE (SELECT COUNT(*)::text FROM public.vocabulary_words) || ' row(s).' END
  UNION ALL
  SELECT 'data_sanity', 'quiz_questions',
    CASE WHEN to_regclass('public.quiz_questions') IS NULL THEN 'fail' ELSE 'pass' END,
    CASE WHEN to_regclass('public.quiz_questions') IS NULL THEN 'Table missing.'
         ELSE (SELECT COUNT(*)::text FROM public.quiz_questions) || ' row(s).' END
  UNION ALL
  SELECT 'data_sanity', 'admin_activity_log',
    CASE WHEN to_regclass('public.admin_activity_log') IS NULL THEN 'fail'
         WHEN (SELECT COUNT(*) FROM public.admin_activity_log) = 0 THEN 'warn'
         ELSE 'pass' END,
    CASE WHEN to_regclass('public.admin_activity_log') IS NULL THEN 'Table missing.'
         ELSE (SELECT COUNT(*)::text FROM public.admin_activity_log) || ' activity row(s).' END
  UNION ALL
  SELECT 'data_sanity', 'admin_tasks',
    CASE WHEN to_regclass('public.admin_tasks') IS NULL THEN 'fail' ELSE 'pass' END,
    CASE WHEN to_regclass('public.admin_tasks') IS NULL THEN 'Table missing.'
         ELSE (SELECT COUNT(*)::text FROM public.admin_tasks) || ' task row(s).' END
  UNION ALL
  SELECT 'data_sanity', 'user_quiz_attempts',
    CASE WHEN to_regclass('public.user_quiz_attempts') IS NULL THEN 'fail' ELSE 'pass' END,
    CASE WHEN to_regclass('public.user_quiz_attempts') IS NULL THEN 'Table missing.'
         ELSE (SELECT COUNT(*)::text FROM public.user_quiz_attempts) || ' attempt(s).' END

)
SELECT check_group, check_name, status, details
FROM checks
ORDER BY
  CASE check_group
    WHEN 'core_tables' THEN 1
    WHEN 'user_progress' THEN 2
    WHEN 'admin_cms' THEN 3
    WHEN 'lesson_media_columns' THEN 4
    WHEN 'release_workflow_columns' THEN 5
    WHEN 'activity_snapshots' THEN 6
    WHEN 'functions' THEN 7
    WHEN 'storage' THEN 8
    WHEN 'rls_enabled' THEN 9
    WHEN 'policies' THEN 10
    WHEN 'security' THEN 11
    WHEN 'data_sanity' THEN 12
    ELSE 99
  END,
  check_name;
