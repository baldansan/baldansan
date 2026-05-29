# Teacher Assignments Plan — Buunduu Surtsgaay

## Assignment types

| Type | Student action |
|------|----------------|
| Watch | Complete `/lessons/{id}/watch` |
| Vocabulary | Study and mark words on vocabulary page |
| Quiz | Complete quiz; score stored |
| Review | Use `/review` for assigned words |
| Full lesson | Watch + vocabulary + quiz sequence |

## Due dates

- Optional `due_date` on assignment
- Future: reminders via engagement system (in-app, then push/email)
- Overdue status **дараагийн шатанд**

## Expected student flow

1. Student sees assignment (future: student dashboard or notification)
2. Opens lesson link from assignment
3. Completes required steps
4. `assignment_results` updated (future) from progress hooks

## Progress reporting (Step 9)

Teacher analytics via `lib/supabase/teacher-analytics.ts`:

- Completion rate per assignment and class
- Average quiz score from `assignment_results`
- Students behind schedule (needs-attention alerts)
- Per-student rows on class detail
- Markdown export on class, assignment, and `/teacher/reports`

Vocabulary counts may be limited by RLS (teacher cannot read all student `user_vocabulary_progress` rows).

## Assignment result tracking

When a logged-in student completes a quiz:

1. `saveQuizResultSmart()` in `lib/progress.ts`
2. `completeMatchingAssignmentsForLesson()` matches lesson + assignment type
3. `upsertAssignmentResult()` writes status `completed`, `quiz_score`, `quiz_total`, `quiz_percentage`, `completed_at`

Teachers read results through RLS on `assignment_results`.

## Current UI (Step 8–9) — implemented

- `/teacher/setup` — teacher profile CRUD
- `/teacher/classes` + `/teacher/classes/new` + `/teacher/classes/[id]` — real classrooms + analytics
- `/teacher/assignments` + `/teacher/assignments/new` + `/teacher/assignments/[id]` — real assignments + analytics
- `/teacher/reports` — overview and per-class reports
- `/my-assignments` — student inbox with quiz score and completed badge
- Quiz completion syncs to `assignment_results`

## Still planned

- Bulk student import
- Assignment due reminders
- Teacher-readable student vocab/quiz aggregates (RLS-safe view)
- Email invite / auto-link student on signup

## Related

- [CLASSROOM_WORKFLOW.md](./CLASSROOM_WORKFLOW.md)
- [supabase/plans/classroom_schema_plan.sql](./supabase/plans/classroom_schema_plan.sql)
