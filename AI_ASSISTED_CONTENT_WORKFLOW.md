# AI-assisted content workflow — Buunduu Surtsgaay

Phase 5 Step 20: copy-ready improvement prompts for ChatGPT/Cursor. **No OpenAI API integration in the app.**

---

## What this is

Admins use analytics and QA signals to generate **text prompts** in the admin UI, copy them to the clipboard, and paste into ChatGPT or Cursor. The external tool returns JSON. Admins validate and import via existing bulk import tools.

The app never calls an AI API and never stores API keys for content generation.

---

## End-to-end workflow

```
Analytics / QA issue
  → Generate improvement prompt (admin UI)
  → Copy prompt → paste into ChatGPT / Cursor
  → Receive strict JSON (subtitles, vocabulary, quizQuestions)
  → Validate in Bulk import editor
  → Import QA summary passes
  → Admin preview (?preview=admin)
  → Export backup JSON
  → Publish when ready
```

---

## Where prompts appear

| Location | Prompt types |
|----------|----------------|
| `/admin/prompts` | Prompt library — full lesson, subtitles, vocabulary, quiz, publish, import cleanup |
| `/admin/lessons/{id}/edit` | Content improvement prompts section (6 cards) |
| `/admin/analytics/lessons/{id}` | Lesson improvement + per-question / weak-vocab fix prompts |
| `/admin/analytics/questions` | “Generate fix prompt” per difficult question |
| `/admin/analytics/vocabulary` | “Generate vocabulary improvement prompt” for low/never learned |
| `/admin/lesson-builder` | Links to prompt library + edit page improvement section |

Helper: [lib/admin/improvement-prompts.ts](./lib/admin/improvement-prompts.ts)  
UI: [components/admin/improvement-prompt-card.tsx](./components/admin/improvement-prompt-card.tsx)

---

## Prompt output rules

All improvement prompts ask for:

- **Valid JSON only** — no markdown, no code fences, no commentary
- Root keys: `subtitles`, `vocabulary`, `quizQuestions`
- Natural **Mongolian** translations
- **Chinese + pinyin** on subtitles and vocabulary
- Quiz `correctAnswer` must match one `options` entry exactly

Same shape as [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md).

---

## Use cases

| Problem | Prompt |
|---------|--------|
| Weak quiz questions | Question fix prompt from question insights |
| Low lesson quiz score | Lesson improvement prompt with analytics signals |
| Missing subtitles / vocab / quiz | Missing content or publish readiness prompts |
| Missing pinyin / Mongolian on subtitles | Subtitle improvement prompt |
| Low vocabulary engagement | Vocabulary improvement prompt |
| JSON import errors | Import cleanup prompt |

---

## Safety

- No `service_role` key — Supabase anon + admin JWT only
- No destructive auto-import — admin validates and imports manually
- Export backup before replace imports
- AdminGuard on all `/admin/*` routes

---

## Related docs

- [LESSON_PROMPT_TEMPLATE.md](./LESSON_PROMPT_TEMPLATE.md) — master create-from-scratch prompt
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md) — JSON schema and validation
- [ADMIN_QUESTION_ANALYTICS.md](./ADMIN_QUESTION_ANALYTICS.md) — difficult question prompts
- [ADMIN_VOCABULARY_ANALYTICS.md](./ADMIN_VOCABULARY_ANALYTICS.md) — weak vocabulary prompts
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 roadmap
