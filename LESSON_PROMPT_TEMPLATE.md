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

1. Copy JSON only (no markdown).
2. `/admin/lessons/{id}/edit` → Bulk import → Validate.
3. Fix errors; warnings are OK to import.
4. Import QA summary → Publish when **Ready to publish**.

---

## Related

- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md)
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md)
