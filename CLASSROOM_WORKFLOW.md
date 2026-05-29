# Classroom Workflow — Buunduu Surtsgaay

Teacher classroom, assignment, and reporting workflow.

## Routes

| Route | Purpose |
|-------|---------|
| `/teacher-dashboard` | Overview metrics, recent activity, quick actions |
| `/teacher/reports` | Class reports list + export |
| `/teacher/setup` | Create teacher profile |
| `/teacher/classes` | Class list |
| `/teacher/classes/new` | Create class |
| `/teacher/classes/{id}` | Class detail + analytics |
| `/teacher/assignments` | Assignment list |
| `/teacher/assignments/new` | Create assignment |
| `/teacher/assignments/{id}` | Assignment detail + analytics |
| `/my-assignments` | Student assignment inbox |
| `/organization` | Organization hub (list memberships) |
| `/organization/{id}` | Organization dashboard |
| `/organization/{id}/members/import` | Bulk CSV import members |
| `/teacher/classes/{id}/students/import` | Bulk CSV import students |
| `/organization/{id}/classrooms` | Org classroom list |
| `/organization/{id}/assignments` | Org assignment list |

## Teacher dashboard

- **Logged out:** Login + demo CTAs
- **Logged in + profile:** Real metrics, personal vs organization classes, org switcher
- Recent class activity, classes needing attention, link to `/teacher/reports`

## Organization classrooms

1. Owner/manager adds teachers at `/organization/{id}/members`
2. Teacher creates org class at `/teacher/classes/new?organizationId={id}`
3. Org classes appear on org dashboard and teacher dashboard (organization section)
4. Assignments inherit `organization_id` from classroom

## Classes

- Create personal class at `/teacher/classes/new` (no organization)
- Create org class with organization selector or query param
- Add students on class detail (display name, email, optional `student_user_id`)
- **Bulk import students** at `/teacher/classes/{id}/students/import` (CSV paste, no email yet)
- **Student invite link** at `/teacher/classes/{id}` → copy link/message → accept at `/invite/{token}`
- Class analytics: summary, student progress table, assignment summary, needs attention, export

## Assignments

Types: Watch, Vocabulary, Quiz, Review, Full lesson

- Create at `/teacher/assignments/new` (optionally prefill classroom from query)
- Assignment analytics: completion summary, student results, missing students, export

## Student progress

- Students see assignments at `/my-assignments` when linked via `student_user_id`
- Quiz completion syncs to `assignment_results` (status, quiz_score, quiz_percentage, completed_at)
- Teacher views progress via assignment results (RLS-safe)

## Reporting workflow

1. Teacher creates class and adds linked students
2. Teacher assigns lessons
3. Students complete lesson/quiz
4. Results appear in class and assignment analytics
5. Teacher reviews **Needs attention** on class page
6. Teacher copies or downloads markdown report from class, assignment, or `/teacher/reports`
7. Teacher uses report for class review session

See [TEACHER_REPORTING.md](./TEACHER_REPORTING.md).

## Status

| Feature | Status |
|---------|--------|
| Teacher profile | `/teacher/setup` |
| Create class | `/teacher/classes/new` |
| Add students | Classroom detail page |
| Create assignment | `/teacher/assignments/new` |
| Student view | `/my-assignments` |
| Quiz → result sync | On quiz save (logged-in) |
| Class analytics | `/teacher/classes/{id}` |
| Assignment analytics | `/teacher/assignments/{id}` |
| Reports export | `/teacher/reports` |

## Schema

Migration `011_classroom_roles_assignments.sql`:

- `teacher_profiles`
- `student_profiles`
- `classrooms`
- `classroom_students`
- `assignments`
- `assignment_results`

See [CLASSROOM_SCHEMA.md](./CLASSROOM_SCHEMA.md).

## Related

- [TEACHER_ASSIGNMENTS_PLAN.md](./TEACHER_ASSIGNMENTS_PLAN.md)
- [TEACHER_REPORTING.md](./TEACHER_REPORTING.md)
- [TEACHER_ONBOARDING.md](./TEACHER_ONBOARDING.md)
