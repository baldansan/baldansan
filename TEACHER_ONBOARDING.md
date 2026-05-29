# Teacher Onboarding — Buunduu Surtsgaay

How a teacher can use the platform today.

## Today (available)

### 1. Create teacher profile

- `/teacher/setup` — display name, organization

### 2. Create class and add students

- `/teacher/classes/new` — class name, level
- `/teacher/classes/{id}` — add students with email and optional linked `student_user_id`
- **Invite link:** generate student invite at classroom page; invitee accepts at `/invite/{token}` after login

### 3. Create assignments

- `/teacher/assignments/new` — pick class, lesson, type, due date
- Lesson page (logged in): link to create assignment with lesson prefill

### 4. Teacher dashboard and reports

- `/teacher-dashboard` — real metrics, recent activity, classes needing attention
- `/teacher/reports` — overview + per-class + per-assignment reports, copy/download markdown

### 5. Class and assignment analytics

- `/teacher/classes/{id}` — student progress table, assignment summary, needs attention
- `/teacher/assignments/{id}` — completion stats, student results, missing students

### 6. Student assignments

- Students at `/my-assignments` when linked to classroom
- Due date, status, quiz score, completed badge, lesson CTA

### 7. Demo and courses

- `/demo` — learning flow preview
- `/courses/hsk5` — assignable lessons

### 8. Organization invite acceptance

- If invited as org teacher/manager, open `/invite/{token}` → login/signup → Accept → `/organization`

### 9. Organization-aware setup (Step 11)

- `/organization` — see organizations you belong to
- If linked as teacher/manager: create org classrooms and assignments
- `/teacher-dashboard` separates personal and organization classes
- Contact school admin to add you via `/organization/{id}/members` or B2B inquiry

## How to read class reports and assignment progress

1. Open `/teacher-dashboard` for high-level counts (classes, students, assignments, avg quiz).
2. Check **Classes needing attention** for empty classes or classes without assignments.
3. Open a class → review **Student progress** table:
   - **Invited / unlinked** — no `student_user_id`; progress unavailable until linked
   - **Completion rate** — assignments completed vs assigned
   - **Latest quiz** — from `assignment_results`
4. Review **Needs attention** for students with 0 completions, low assignment completion, or class avg quiz below 70%.
5. Open an assignment → see who started/completed and quiz percentages.
6. Use **Copy report** or **Download markdown** on class, assignment, or `/teacher/reports` for sharing or review notes.

### 8. Organization account (foundation)

- If linked via `organization_members`, `/teacher-dashboard` shows your organization
- Otherwise submit `/school-inquiry` for training center / school setup
- Full multi-teacher team linking — Step 11

See [ORGANIZATION_ACCOUNTS.md](./ORGANIZATION_ACCOUNTS.md).

## Teacher-facing pages

| Route | Purpose |
|-------|---------|
| `/teachers` | Teacher package + reporting overview |
| `/teacher-dashboard` | Overview + analytics |
| `/teacher/reports` | Exportable class reports |
| `/teacher/setup` | Teacher profile |
| `/teacher/classes` | Class list |
| `/teacher/classes/new` | Create class |
| `/teacher/classes/{id}` | Class detail + analytics |
| `/teacher/assignments` | Assignment list |
| `/teacher/assignments/new` | Create assignment |
| `/teacher/assignments/{id}` | Assignment analytics |
| `/school-inquiry` | B2B contact |

## Recommended teacher flow

1. `/teacher/setup` → create profile
2. `/teacher/classes/new` → create class
3. Add students with linked accounts
4. `/teacher/assignments/new` → assign lesson
5. Students complete via `/my-assignments` → lesson → quiz
6. Review `/teacher/classes/{id}` and export report
7. `/school-inquiry` for B2B pilot expansion

## Related

- [CLASSROOM_WORKFLOW.md](./CLASSROOM_WORKFLOW.md)
- [TEACHER_REPORTING.md](./TEACHER_REPORTING.md)
- [TEACHER_ASSIGNMENTS_PLAN.md](./TEACHER_ASSIGNMENTS_PLAN.md)
- [B2B_SCHOOL_PACKAGE.md](./B2B_SCHOOL_PACKAGE.md)
