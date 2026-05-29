# Teacher Reporting — Buunduu Surtsgaay

Phase 7 Step 9: teacher-facing class progress analytics and exportable reports.

## Overview

Teachers with a profile and classrooms can view real metrics from Supabase (via anon client + RLS):

- Classroom and student counts
- Assignment completion from `assignment_results`
- Quiz averages from completed results
- Needs-attention alerts (unlinked students, low completion, low quiz average)
- Markdown reports (copy or download)

## Routes

| Route | Purpose |
|-------|---------|
| `/teacher-dashboard` | Overview metrics, recent activity, classes needing attention |
| `/teacher/reports` | Overview + per-class + per-assignment report list |
| `/teacher/classes/{id}` | Class summary, student table, assignment summary, export |
| `/teacher/assignments/{id}` | Completion summary, student results, export |

## Analytics helpers

`lib/supabase/teacher-analytics.ts`:

| Function | Returns |
|----------|---------|
| `getTeacherOverviewMetrics()` | Classroom/student/assignment counts, completed results, avg quiz |
| `getClassroomProgressAnalytics(classroomId)` | Class summary, assignment summaries, needs attention |
| `getClassroomStudentProgress(classroomId)` | Per-student rows |
| `getAssignmentAnalytics(assignmentId)` | Completion stats + student result table |
| `getTeacherAssignmentSummary()` | All assignments with completion rates |
| `getTeacherRecentClassActivity(limit)` | Recent assignments + completed results |

Report markdown: `lib/teacher/report-builder.ts`

## Data sources

| Table | Teacher access (RLS) |
|-------|----------------------|
| `classrooms` | Own rows |
| `classroom_students` | Students in own classes |
| `assignments` | Assignments in own classes |
| `assignment_results` | Results for own assignments |
| `user_quiz_attempts` | **Own row only** — not readable for students |
| `user_vocabulary_progress` | **Own row only** — may be empty for teachers |
| `user_lesson_progress` | **Own row only** — not used directly in Step 9 |

Primary analytics use **`assignment_results`** (quiz score, status, completed_at) synced when a logged-in student completes a quiz matching an assignment lesson.

## Class analytics

On `/teacher/classes/{id}`:

- **Summary:** students, active students, assignments, completion rate, avg quiz
- **Student progress table:** name, status, assignments completed, rate, latest quiz, learned words (if available), last activity
- **Assignment summary:** title, lesson, due date, completed/total, rate, avg quiz
- **Needs attention:** zero completions, low assignment completion, avg quiz &lt; 70%, invited unlinked students
- **Export:** copy or download markdown class report

## Assignment analytics

On `/teacher/assignments/{id}`:

- Started / completed counts and completion rate
- Student result table with quiz % and completed_at
- Missing / not started students
- Copy or download assignment report

## Student view

`/my-assignments` shows due date, status, quiz score (from `assignment_results`), completed badge, and lesson CTA.

Quiz completion triggers `completeMatchingAssignmentsForLesson()` in `lib/classroom/assignment-completion.ts` → `upsertAssignmentResult()`.

## Reports

`/teacher/reports`:

- Teacher overview report (export)
- Per-class reports with metrics + copy
- Assignment list with links to detail analytics

## Current limitations

- Learned vocabulary counts may show `—` when RLS blocks teacher reads of `user_vocabulary_progress`
- Students must be linked via `student_user_id` on `classroom_students` for progress tracking
- No PDF/CSV export yet — markdown only
- Organization rollup available at `/organization/{id}/reports` (Step 12)
- Recent activity is assignment-centric, not full lesson/quiz stream

## Future improvements

- RLS policy or secure view for teacher-scoped student progress (without service_role)
- PDF/CSV export, scheduled email reports
- Assignment due reminders and overdue status
- Bulk student import and invite flow

## Related

- [ORGANIZATION_REPORTING.md](./ORGANIZATION_REPORTING.md)

- [CLASSROOM_WORKFLOW.md](./CLASSROOM_WORKFLOW.md)
- [CLASSROOM_SCHEMA.md](./CLASSROOM_SCHEMA.md)
- [TEACHER_ASSIGNMENTS_PLAN.md](./TEACHER_ASSIGNMENTS_PLAN.md)
- [TEACHER_ONBOARDING.md](./TEACHER_ONBOARDING.md)
