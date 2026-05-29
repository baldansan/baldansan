# Supabase Migration Status — v1.0

Track which migrations are applied on production/staging. Run in **numeric order** in Supabase SQL Editor.

**Production app:** https://baldansan.vercel.app

---

## v1.0 core (required for learner launch)

| # | File | Purpose | Status |
|---|------|---------|--------|
| 001 | `001_initial_schema.sql` | Courses, lessons, content tables | Needs check |
| 002 | `002_lesson_media_fields.sql` | Lesson media columns | Needs check |
| 003 | `003_lesson_route_status.sql` | Route status helper | Needs check |
| 004 | `004_admin_lesson_bundle.sql` | Admin lesson bundle RPC | Needs check |
| 005 | `005_lesson_release_workflow.sql` | Draft/publish workflow | Needs check |
| 005 | `005_grant_is_admin_rpc.sql` | Grant `is_admin` execute | Needs check |
| 006 | `006_admin_tasks.sql` | Admin tasks table | Needs check |
| 007 | `007_admin_activity_log.sql` | Activity log | Needs check |
| 008 | `008_admin_activity_snapshots.sql` | Rollback snapshots | Needs check |
| 009 | `009_user_retention.sql` | Streak / daily goal | Needs check |
| 010 | `010_user_reminders_achievements.sql` | Reminders, achievements | Needs check |
| — | `admin/001_admin_profiles_setup.sql` | `admin_profiles` + bootstrap | Needs check |
| — | `policies/002_admin_content_policies.sql` | Content RLS + `is_admin()` | Needs check |

---

## Phase 7 B2B / classroom (optional for v1.0 learner)

Does not block v1.0 if routes degrade gracefully. Required for school/B2B features.

| # | File | Purpose | Status |
|---|------|---------|--------|
| 011 | `011_classroom_roles_assignments.sql` | Classrooms, assignments | Needs check |
| 012 | `012_school_organizations_b2b_crm.sql` | Organizations, inquiries | Needs check |
| 013 | `013_organization_classrooms_permissions.sql` | Org classrooms, permissions | Needs check |
| 014 | `014_b2b_pilot_onboarding.sql` | Pilot onboarding wizard | Needs check |
| 015 | `015_organization_invitations.sql` | Invitation table (spec: invitation links base) | Needs check |
| 016 | `016_invitation_email_delivery.sql` | Legacy delivery log table | Needs check |
| 017 | `017_invitation_links_classroom_accept.sql` | Classroom accept + `invitations` view | Needs check |
| 018 | `018_invitation_email_deliveries.sql` | Current email delivery log | Needs check |

**Note:** Spec name `015_invitation_links.sql` maps to `015_organization_invitations.sql` + `017_invitation_links_classroom_accept.sql`.

---

## Admin helper standardization

Canonical function:

```sql
public.is_admin(check_user_id uuid default auth.uid())
```

Use in RLS policies as:

```sql
public.is_admin(auth.uid()::uuid)
```

Drop legacy zero-argument overload if present to avoid ambiguity. Do not run partial policy-drop scripts without recreating all affected policies.

---

## v1.0 verification SQL

Run in Supabase SQL Editor after migrations:

```sql
-- Core content
select count(*) as courses from public.courses;
select count(*) as available_lessons
from public.lessons where status = 'available';

-- Progress / auth support
select exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'user_lesson_progress'
) as has_lesson_progress;

select exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'admin_profiles'
) as has_admin_profiles;

-- Admin helper
select public.is_admin(auth.uid()::uuid) as am_i_admin;

-- B2B optional (OK if false on learner-only DB)
select exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'organization_invitations'
) as has_invitations;
```

**Expected for launch:** `courses > 0`, `available_lessons >= 1`, `has_lesson_progress = true`, `has_admin_profiles = true`.

---

## Full verification script

See [supabase/verify/production_verification.sql](./supabase/verify/production_verification.sql) and [supabase/verify/README.md](./supabase/verify/README.md).
