# Supabase Migration Status — v1.0

Track which migrations are applied on production/staging. Run in **numeric order** in Supabase SQL Editor.

**Production app:** https://baldansan.vercel.app

Do not run SQL from the app automatically — document and verify manually.

---

## Required for v1.0 learner launch

| # | File | Tables / purpose | v1.0 |
|---|------|------------------|------|
| 001 | `001_initial_schema.sql` | `courses`, `lessons`, content child tables, progress | **Required** |
| 002 | `002_lesson_media_fields.sql` | Lesson media columns | **Required** |
| 003 | `003_lesson_route_status.sql` | Route status helper | **Required** |
| 004 | `004_admin_lesson_bundle.sql` | Admin lesson bundle RPC | **Required** |
| 005 | `005_lesson_release_workflow.sql` | Draft/publish workflow | **Required** |
| 005 | `005_grant_is_admin_rpc.sql` | Grant `is_admin` execute | **Required** |
| 006 | `006_admin_tasks.sql` | Admin tasks | Recommended |
| 007 | `007_admin_activity_log.sql` | Activity log | Recommended |
| 008 | `008_admin_activity_snapshots.sql` | Rollback snapshots | Recommended |
| 009 | `009_user_retention.sql` | Streak / daily goal | Recommended |
| 010 | `010_user_reminders_achievements.sql` | Reminders, achievements | Recommended |
| — | `admin/001_admin_profiles_setup.sql` | `admin_profiles` bootstrap | **Required** |
| — | `policies/002_admin_content_policies.sql` | Content RLS | **Required** |

**Minimum learner DB:** 001–005 + admin bootstrap + content policies. 009–010 needed for streak/daily goal without crash (app degrades if missing).

---

## B2B / classroom / invite foundation (optional for v1.0)

Required only for school/B2B routes — **must not block learner launch** if unapplied.

| # | File | Purpose | v1.0 |
|---|------|---------|------|
| 011 | `011_classroom_roles_assignments.sql` | Classrooms, assignments | Optional |
| 012 | `012_school_organizations_b2b_crm.sql` | Organizations, inquiries | Optional |
| 013 | `013_organization_classrooms_permissions.sql` | Org classrooms, permissions | Optional |
| 014 | `014_b2b_pilot_onboarding.sql` | Pilot onboarding | Optional |
| 015 | `015_organization_invitations.sql` | Invitations base | Optional |
| 016 | `016_invitation_email_delivery.sql` | Legacy delivery log | Optional |
| 017 | `017_invitation_links_classroom_accept.sql` | Classroom accept + view | Optional |
| 018 | `018_invitation_email_deliveries.sql` | Email delivery log | Optional |

**Naming note:** `015_invitation_links.sql` (spec) = `015_organization_invitations.sql` + `017_invitation_links_classroom_accept.sql`.

---

## Admin helper — canonical only

Use:

```sql
public.is_admin(auth.uid()::uuid)
```

**Never use** ambiguous zero-argument `public.is_admin()` when multiple overloads exist.

Canonical function:

```sql
public.is_admin(check_user_id uuid default auth.uid())
```

---

## Core v1.0 verification SQL

```sql
-- Content tables
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='courses') as courses;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='lessons') as lessons;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='subtitle_lines') as subtitle_lines;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='vocabulary_words') as vocabulary_words;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='quiz_questions') as quiz_questions;

-- Progress
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='user_lesson_progress') as user_lesson_progress;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='user_vocabulary_progress') as user_vocabulary_progress;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='user_quiz_attempts') as user_quiz_attempts;

-- Admin
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='admin_profiles') as admin_profiles;

-- Counts
select count(*) as available_lessons from public.lessons where status = 'available';

-- Admin check (when logged in as admin in SQL editor with JWT, or test via app)
-- select public.is_admin(auth.uid()::uuid) as am_i_admin;
```

**Expected:** all `exists` = true for core tables; `available_lessons >= 1`.

---

## B2B optional verification SQL

```sql
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='teacher_profiles') as teacher_profiles;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='student_profiles') as student_profiles;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='classrooms') as classrooms;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='classroom_students') as classroom_students;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='assignments') as assignments;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='assignment_results') as assignment_results;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='organizations') as organizations;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='organization_members') as organization_members;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='b2b_inquiries') as b2b_inquiries;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='organization_onboarding') as organization_onboarding;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='organization_invitations') as invitations;
select exists (select 1 from information_schema.tables where table_schema='public' and table_name='invitation_email_deliveries') as invitation_email_deliveries;
```

OK if false on learner-only production until B2B launch.

---

## Full verification script

[supabase/verify/production_verification.sql](./supabase/verify/production_verification.sql)
