# Task: «Хувийн багш» (私教) mode for HSK mock-test practice — structured tutor notes per question

Repo /home/claude/repo (Next.js 16, Supabase). Read first: `lib/mock-test/types.ts`, `lib/mock-test/practice-feedback.ts`, `components/mock-test/mock-test-practice-question.tsx` (PracticeFeedbackPanel, transcript section, `PracticeAudio`), `components/mock-test/mock-test-practice-client.tsx`, `lib/supabase/mock-tests-server.ts` (row mapping — add the new column), `supabase/migrations/060_mock_question_audio_slices.sql` (style), `supabase/content/001_mock_test_explanations.sql` (how explanations were patched). UI: `tr(locale, "...")` + ZH_UI block `// --- Хувийн багш ---` right after `export const ZH_UI… = {` (re-read before editing); content in `translate="no"`. Mongolian plain, no Russian loanwords. Do NOT commit. `npx tsc --noEmit` + `NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build` must pass. Do NOT invent explanations for real questions — this task is UI + schema + an import tool; the notes themselves will be generated separately from an export.

Owner's words: «яг л HSK-д хувийн багштай бэлдэж байгаа юм шиг — юу гэж хэлсэн, яагаад чи бурууг нь сонгов, алийг нь сонгох ёстой байсан».

## 1. Schema — `supabase/migrations/069_mock_tutor_notes.sql` (idempotent)
`alter table public.mock_test_questions add column if not exists tutor_note jsonb;` + comment. Shape (documented in the migration comment and in `lib/mock-test/tutor-note.ts` as a zod-free TS type + `parseTutorNote(unknown): TutorNote | null` with validation):
```ts
type TutorNote = {
  transcript?: { zh: string; pinyin?: string; mn?: string }[]; // listening: what was said, line by line (speaker prefix like 男/女 allowed in zh)
  key?: string;            // the one sentence/phrase that decides the answer (zh)
  keyMn?: string;          // its meaning
  why: string;             // why the correct option is right (mn)
  wrong?: Record<string, string>; // per option key: why it's wrong (mn) — «B: 印象 нь сэтгэгдэл гэсэн нэр үг тул 让人特别___-д таарахгүй»
  trap?: string;           // the trap the question sets (mn)
  tip?: string;            // strategy tip (mn)
  words?: { zh: string; pinyin: string; mn: string }[]; // 3–6 key words
};
```
Runner `supabase/content/RUN-TUTOR-FROM-GITHUB.sql` (same style as RUN-WRITING) running 069.

## 2. Server mapping
`lib/supabase/mock-tests-server.ts` — map `tutor_note` (parsed with `parseTutorNote`) into `MockTestQuestionRow.tutor_note: TutorNote | null` (add to `types.ts`). `lib/study-plan/study-plan-server.ts` sets `tutor_note: null` where it stubs rows.

## 3. Feedback UI (practice mode) — replace `PracticeFeedbackPanel` content when `question.tutor_note` exists
Card «🎓 Багшийн тайлбар» (zh 私教讲解), sections in this order, each collapsible except the first two:
1. Verdict line as now («Зөв! 🎉» / «Буруу байна» + your answer / correct answer).
2. **«Юу гэж хэлсэн бэ»** (listening only, when `transcript`): lines with zh (hanzi, `translate="no"`), pinyin (toggle, default on), mn (toggle, default on); the `key` line highlighted (match by inclusion) with a «🔑» mark; a «🔊 Дахин сонс» button that replays the question audio slice (reuse `PracticeAudio`'s cached element — expose a tiny `replayPracticeAudio(url, startSec)` helper from `lib/mock-test/practice-audio-store.ts`).
3. **«Яагаад зөв бэ»** — `why`; then **«Яагаад чи буруу сонгов»** — when the learner's answer is wrong and `wrong[yourKey]` exists, show THAT one first in amber («Чи B сонгосон: …»), then the rest of `wrong` as a compact list «A · B · C» (collapsed by default: «Бусад сонголт яагаад буруу вэ ▾»).
4. **«Урхи»** (`trap`) and **«Зөвлөгөө»** (`tip`) as two small chips/lines.
5. **«Түлхүүр үгс»** — chips zh · pinyin · mn, tap → `/dictionary?q=<zh>`.
Fallback: no `tutor_note` → today's panel (explanation_mn). Keep the existing transcript section but hide it when the note has its own transcript (avoid duplication).
Exam review (`mock-test-attempt-review-client.tsx` / result view): if it renders explanations, also render the tutor card there (same component `components/mock-test/tutor-note-card.tsx`).

## 4. Practice list badge
In `mock-test-practice-list-client.tsx` (the list of practice groups/tests), show «🎓 N/M тайлбартай» per test if the counts are available cheaply (a `count` query on `tutor_note is not null` grouped by test — add to the server loader only if it exists there; otherwise skip and say so).

## 5. Admin import for notes — `app/admin/mock-tests/tutor-notes/page.tsx` (admin-guarded like other admin pages; find the pattern) + client: textarea to paste a JSON array `[{ id: "<question uuid>", tutor_note: {...} }, …]` → validate with `parseTutorNote` → preview table (id, has transcript?, why length, wrong keys) → POST `/api/admin/mock-tests/tutor-notes` (service role; upsert `tutor_note` by id; returns updated count). Also a **CSV/JSON export button** on the same page: GET `/api/admin/mock-tests/export?skill=listening&level=1` → downloads JSON `[{id, test_id, hsk_level, skill, part, q_no, q_type, stem, options, correct_answer, audio_transcript, explanation_mn, has_tutor_note}]` (service role) — this is what the owner will send back to me to write the notes.

## 6. ZH_UI: «Багшийн тайлбар»: "私教讲解", «Юу гэж хэлсэн бэ»: "听力原文", «Яагаад зөв бэ»: "为什么对", «Яагаад чи буруу сонгов»: "你为什么选错了", «Бусад сонголт яагаад буруу вэ»: "其他选项为什么不对", «Урхи»: "陷阱", «Зөвлөгөө»: "技巧", «Түлхүүр үгс»: "关键词", «Дахин сонс»: "再听一遍", «Чи сонгосон»: "你选了", + others.

## 7. Verify
tsc + build; local server (dummy env; kill stale by PID from `ps aux | grep next-server`, never `pkill -f`); unit-check `parseTutorNote` with a node script (valid / missing why / bad types); Playwright (400×860) screenshot of the tutor card using a demo: add `?demoTutor=1` to the practice question route ONLY in development (`process.env.NODE_ENV !== "production"`) that injects a fake note into the first question (make the demo text obviously placeholder, e.g. «(жишээ) …»), → `/tmp/shots/tutor-*.png`. Report files changed, SQL to run, anything skipped.
