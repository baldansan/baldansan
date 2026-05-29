# Classroom Schema — Buunduu Surtsgaay

Migration: `supabase/migrations/011_classroom_roles_assignments.sql`

## Tables

### teacher_profiles
| Column | Purpose |
|--------|---------|
| user_id (PK) | auth.users id |
| display_name | Teacher name |
| organization | School / training center |
| bio | Optional |
| role | Default `teacher` |

### student_profiles
| Column | Purpose |
|--------|---------|
| user_id (PK) | auth.users id |
| display_name | Student name |
| school_name | Optional |
| grade_level | Optional |

### classrooms
| Column | Purpose |
|--------|---------|
| id | UUID |
| teacher_user_id | Owner teacher |
| name, level, description | Class metadata |
| status | Default `active` |
| organization_id | FK → organizations (nullable — personal class) |
| visibility | `private`, `organization`, `archived` |
| created_by | User who created the classroom |

### assignments
| Column | Purpose |
|--------|---------|
| classroom_id | FK → classrooms |
| lesson_id | Public lesson id (text) |
| assignment_type | full_lesson, watch, vocabulary, quiz, review |
| title, instructions, due_date, status | Assignment metadata |
| organization_id | FK → organizations (from classroom) |
| created_by | User who created the assignment |

### classroom_students
| Column | Purpose |
|--------|---------|
| classroom_id | FK → classrooms |
| student_user_id | Linked account (nullable for invites) |
| display_name, email | Teacher-visible identity |
| status | `invited` or `active` |

### assignment_results
| Column | Purpose |
|--------|---------|
| assignment_id | FK → assignments |
| student_user_id | Student |
| status | not_started, in_progress, completed |
| quiz_score, quiz_total, quiz_percentage | Quiz sync |
| metadata | jsonb extras |

## RLS model

- **Teachers** own rows via `classrooms.teacher_user_id = auth.uid()`
- **Org owner/manager** manage org classrooms and assignments via `can_manage_org` / org helpers
- **Org teachers/assistants** read org classrooms; teachers create when org member
- **Students** see enrollments where `classroom_students.student_user_id = auth.uid()`
- **Students** see assignments for enrolled classrooms (personal or org)
- **Students** insert/update own `assignment_results`
- **Admins** read all via `public.is_admin()` where policies allow
- **No service_role** in client — anon + JWT only

Migration `013_organization_classrooms_permissions.sql` extends policies for org scope.

## API

Client helpers: `lib/supabase/classrooms.ts`

Quiz sync: `lib/classroom/assignment-completion.ts` → called from `saveQuizResultSmart`

## Current limitations

- No email invite flow / auto-link by email on signup
- Bulk student CSV import at `/teacher/classes/{id}/students/import` (Phase 7 Step 14)
- No class-level analytics dashboard
- Teacher sees student UUID in results (not display name join yet)
- student_profiles optional — enrollment uses classroom_students display fields

## Related

- [CLASSROOM_WORKFLOW.md](./CLASSROOM_WORKFLOW.md)
- [TEACHER_ASSIGNMENTS_PLAN.md](./TEACHER_ASSIGNMENTS_PLAN.md)
- [supabase/plans/classroom_schema_plan.sql](./supabase/plans/classroom_schema_plan.sql) (original plan)
