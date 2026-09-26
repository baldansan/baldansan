# Task: class required curriculum («Заавал хөтөлбөр») on top of assignments

Repo /home/claude/repo (Next.js 16, Supabase). UI: Mongolian literals via `tr(locale, "...")` + Chinese in `ZH_UI` (`lib/i18n/translate.ts`); content in `translate="no"`. Do NOT commit. `npx tsc --noEmit` + `npm run build` must pass.

## Goal
A teacher picks, for a class, the book/level and the ordered list of app lessons every student must complete. Students see a «Заавал» (必修) section with order + progress; teacher and parent see each student's completion %. Other lessons remain optional (free for now).

## Design — reuse `assignments` + `assignment_results` (completion already auto-synced on quiz completion by `lib/classroom/assignment-completion.ts`)
1. **Migration `supabase/migrations/066_classroom_curriculum.sql`** (idempotent):
   - `alter table public.assignments add column if not exists is_curriculum boolean not null default false, add column if not exists order_index integer, add column if not exists course_id text;`
   - index on (classroom_id, is_curriculum, order_index).
   - `alter table public.classrooms add column if not exists curriculum_course_id text;` (the chosen level, e.g. 'hsk1') — optional convenience.
   - RLS additions so a **guardian** can read their child's rows: policies on `assignments` (via classroom_students of child) and `assignment_results` (`student_user_id` where `public.is_guardian_of(student_user_id)`), using the helper from migration 065. Check existing policies in migrations 011/013/055/058 and add, don't replace.
   - RPC `public.set_classroom_curriculum(p_classroom_id uuid, p_course_id text, p_lessons jsonb)` security definer: caller must `public.can_manage_org_classroom(p_classroom_id)`; `p_lessons` = array of `{lesson_id, title, order_index}`; it upserts curriculum assignments (assignment_type 'full_lesson', is_curriculum true, order_index, course_id, title), deletes curriculum assignments of that class not in the list (their results cascade), updates `classrooms.curriculum_course_id`. Returns count.
   - RPC `public.classroom_curriculum_progress(p_classroom_id uuid)` security definer (teacher/manager or guardian-of-a-member or the student themself): returns rows `(student_user_id uuid, display_name text, total int, completed int, percent int, last_completed_at timestamptz)` computed from curriculum assignments × classroom_students × assignment_results(status='completed').
2. **lib**: `lib/supabase/curriculum.ts` — `getClassroomCurriculum(classroomId)` (ordered assignments where is_curriculum), `setClassroomCurriculum(classroomId, courseId, lessons[])` (rpc), `getClassroomCurriculumProgress(classroomId)` (rpc), `getMyCurriculum()` for the signed-in student: their classes' curriculum assignments + own results, ordered, with `nextLessonId`. Map `is_curriculum/order_index/course_id` into the `Assignment` type (`lib/classroom/types.ts`) and `mapAssignmentFromRow` in `lib/supabase/classrooms.ts`.
3. **Teacher UI** — `components/teacher/class-curriculum-editor.tsx`, placed in `components/teacher/classroom-detail-view.tsx` right after the join-code card:
   - Step 1: choose level — HSK1 … HSK6 (courses that have published app lessons; use `getPublicLessonSummariesByCourseId(courseId)` from `lib/content` through a small API route or server action — teacher pages are client components, so add `app/api/curriculum/lessons?courseId=` route returning `{id, title, chineseTitle}` list).
   - Step 2: checklist of that level's lessons (all checked by default, in course order), reorder not needed (course order); "Хадгалах" → `setClassroomCurriculum`.
   - Shows current curriculum summary (N lessons) and a per-student progress table (`classroom_curriculum_progress`): name, completed/total, %, last completed.
4. **Student UI**:
   - `/my-assignments` (`components/teacher/my-assignments-view.tsx`): add a top section «Ангийн заавал хичээл» listing curriculum lessons in order with ✓ / ▶ (next) / ○, each linking to the lesson (`lessonPath(lessonId)` from `lib/content`), and a progress bar `completed/total`.
   - Home (`components/mobile/home-app-view.tsx`): if the signed-in user has a curriculum, show a compact card «Заавал хичээл 3/15 · Дараагийн: 第4课 …» linking to the next lesson (load via `getMyCurriculum()` in an effect; hide when none). Keep it light — one card.
5. **Parent** (`/family`, `components/kids/*` from the previous task): for each child with a class, show «Заавал хичээл: x/y (z%)» using `classroom_curriculum_progress` filtered to that child (guardian RLS allows). If the RPC errors, hide silently.
6. **Kid mode**: nothing special — kids are classroom_students so `getMyCurriculum()` works.
7. Chinese strings for all new UI text in ZH_UI («Заавал хөтөлбөр»: "必修课程", «Ангийн заавал хичээл»: "班级必修课", «Дараагийн»: "下一课", «Хадгалах»: exists, «Түвшин сонгох»: "选择级别", «Гүйцэтгэл»: "完成率" …).

Report: files changed, the SQL to run, anything left undone. Test the migration SQL syntax against a scratch Postgres if available (`psql -h /tmp -p 5433 -U postgres -d mig` has stub tables classrooms/classroom_students/kid_profiles; you may need to create stub `assignments`/`assignment_results` tables there to test).
