# B2B School Package — Buunduu Surtsgaay

**Production:** https://baldansan.vercel.app

## Product overview

Бөөндөө Сурцгаая is a short-video Chinese learning platform with subtitle, pinyin, vocabulary, quiz, review, and progress tracking. Phase 7 Step 6 adds **B2B presentation pages**. Step 7 adds **classroom/assignment workflow foundation** (UI preview + schema plan).

## Classroom / assignment / reporting (Steps 7–9)

| Route | Purpose |
|-------|---------|
| `/teacher-dashboard` | Teacher overview + real analytics |
| `/teacher/reports` | Class reports + markdown export |
| `/teacher/classes/{id}` | Class analytics + student progress |
| `/teacher/assignments/{id}` | Assignment completion analytics |
| `/teacher/classes` | Class list |
| `/teacher/assignments` | Assignment list |

See [CLASSROOM_WORKFLOW.md](./CLASSROOM_WORKFLOW.md) and [TEACHER_REPORTING.md](./TEACHER_REPORTING.md).

## Teacher reports (value proposition)

- **Class progress** — students, completion rate, average quiz
- **Assignment completion** — per-assignment started/completed counts
- **Student progress** — per-student completion and quiz from assignment results
- **Exportable reports** — copy or download markdown for pilot review and school reporting

## Multi-teacher team (Step 11)

- One organization, many teachers with roles (owner, manager, teacher, assistant)
- Shared organization classrooms and assignments
- Organization dashboard at `/organization/{id}`
- Training center owner adds team, teachers run classes, managers review reports
- See [MULTI_TEACHER_WORKFLOW.md](./MULTI_TEACHER_WORKFLOW.md) and [B2B_CRM_WORKFLOW.md](./B2B_CRM_WORKFLOW.md)

## School rollout (training centers)

1. Demo lesson үзнэ
2. Багшийн workflow туршина
3. Class/assignment setup төлөвлөнө
4. Сурагчидтай pilot явуулна
5. Progress тайлан шалгана (`/teacher/reports`, class/assignment analytics)

## Target customers

- Хятад хэлний сургалтын төв
- Ерөнхий боловсролын сургууль
- Их дээд сургуулийн нэмэлт хөтөлбөр
- Online Chinese teacher
- Self-study community (with school partnership)

## School workflow

1. Teacher assigns lesson
2. Student watches short scene
3. Student studies vocabulary
4. Student completes quiz
5. Teacher checks progress/report via `/teacher/reports` and class analytics
6. Class reviews mistakes

## Teacher workflow

1. Choose course/lesson
2. Assign to students via `/teacher/assignments/new`
3. Students complete watch/vocab/quiz
4. Teacher reviews results on class/assignment pages or exports markdown report
5. Class discussion

## Packages (placeholder)

| Package | Status |
|---------|--------|
| Free learner | Live — public HSK5 |
| Teacher starter | Placeholder |
| School package | Placeholder |
| Training center package | Placeholder |
| Custom B2B package | Placeholder |

**Payment is not active.** See `/pricing`.

## CRM / admin inquiry flow

1. Prospect submits `/school-inquiry` → stored in `b2b_inquiries`
2. Admin reviews at `/admin/b2b/inquiries`
3. Update status, notes, activity timeline
4. Create organization from inquiry → `/admin/b2b/organizations/{id}`
5. Add organization members (owner, teachers)

See [B2B_CRM_WORKFLOW.md](./B2B_CRM_WORKFLOW.md).

## Routes

| Route | Purpose |
|-------|---------|
| `/schools` | B2B landing |
| `/teachers` | Teacher package |
| `/demo` | Learning flow demo |
| `/school-inquiry` | B2B inquiry form (CRM backend) |
| `/admin/b2b` | Admin CRM home |
| `/teacher-dashboard` | Teacher overview + analytics |
| `/teacher/reports` | Class reports |
| `/pricing` | B2B + learner packages |

## Limitations (current)

- No real payment
- Organization classrooms not yet linked (Step 11)
- Teacher org self-linking manual via admin members
- No email auto-reply on inquiry

## How to demo

1. Open `/schools` or `/demo`
2. Walk through Lesson 1: watch → vocabulary → quiz → review
3. Submit `/school-inquiry` (admin sees in `/admin/b2b`)
4. Show `/teacher-dashboard` and class reports
5. Admin: create organization from inquiry

## Related docs

- [B2B_CRM_WORKFLOW.md](./B2B_CRM_WORKFLOW.md)
- [ORGANIZATION_ACCOUNTS.md](./ORGANIZATION_ACCOUNTS.md)
- [TEACHER_ONBOARDING.md](./TEACHER_ONBOARDING.md)
- [SCHOOL_INQUIRY_WORKFLOW.md](./SCHOOL_INQUIRY_WORKFLOW.md)
- [CLASSROOM_WORKFLOW.md](./CLASSROOM_WORKFLOW.md)
- [TEACHER_ASSIGNMENTS_PLAN.md](./TEACHER_ASSIGNMENTS_PLAN.md)
