# Lesson content prompt template (master)

Copy this template into ChatGPT or Cursor, replace the `LESSON CONTEXT` placeholders, and request **valid JSON only** for bulk import into Buunduu Surtsgaay.

No OpenAI API in the app — admins use **Lesson content prompt generator** on `/admin/lessons/{id}/edit` for a pre-filled version.

---

## Master prompt

```
You are creating lesson content JSON for Buunduu Surtsgaay (Mongolian learners studying Chinese).

LESSON CONTEXT
- Lesson ID: [LESSON_ID]
- Title: [ENGLISH_TITLE]
- Chinese title: [CHINESE_TITLE]
- Summary: [MONGOLIAN_SUBTITLE_AND_DESCRIPTION]
- Target HSK level: [HSK1–HSK6]
- Tone: [emotional short drama | daily conversation | Taobao practical | workplace]
- Style: natural Mongolian translations, short-drama conversational Chinese

OUTPUT REQUIREMENTS (STRICT)
- Return VALID JSON ONLY. No markdown, no code fences, no extra commentary.
- Root object keys: "subtitles", "vocabulary", "quizQuestions"
- Include pinyin for subtitles and vocabulary unless told otherwise.

COUNTS
- subtitles: [N] timed lines
- vocabulary: [N] words
- quizQuestions: [N] questions (mix multiple_choice and cloze)

SUBTITLES — each item: start, end, chinese, pinyin, mongolian

VOCABULARY — each item: chinese, pinyin, mongolian, hskLevel, exampleChinese, exampleMongolian
- No duplicate chinese words.

QUIZ — each item: type, question, options (≥2), correctAnswer (must match one option), explanation

{
  "subtitles": [],
  "vocabulary": [],
  "quizQuestions": []
}

Generate the full JSON now.
```

---

## Example (Lesson 5 style)

```
LESSON CONTEXT
- Lesson ID: 5
- Title: Lesson 5
- Chinese title: 你怎么不说话
- Summary: Богино драм — харилцааны зөрчил
- Target HSK level: HSK5
- Tone: emotional short drama
...
```

Expected output shape matches [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md).

---

## After ChatGPT responds

1. Copy JSON only (no markdown fences).
2. Paste into **Bulk import** on `/admin/lessons/{id}/edit`.
3. Run **Validate** → fix errors → **Import**.
4. Check **Import QA summary** and preview at `/lessons/{id}?preview=admin`.

---

## Improvement prompts (Step 20)

For **fixing** existing lessons (not creating from scratch), use:

- **Prompt library:** `/admin/prompts`
- **Edit page:** Content improvement prompts section
- **Analytics:** Generate fix prompts from difficult questions or weak vocabulary

See [AI_ASSISTED_CONTENT_WORKFLOW.md](./AI_ASSISTED_CONTENT_WORKFLOW.md).

**Example — fix one weak quiz question:**

```
You are fixing one weak quiz question for Buunduu Surtsgaay.
LESSON CONTEXT — Lesson ID: 5, Title: …
PROBLEM QUESTION — accuracy 40%, common wrong: …
Return JSON with quizQuestions array only (empty subtitles/vocabulary).
```

**Example — improve low-engagement vocabulary:**

```
WEAK VOCABULARY WORD — Chinese: 说话, learned count: 0
Return JSON with improved exampleChinese, exampleMongolian, optional quiz question.
```

---

## Related

- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md)
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md)
