# Task: protect LEARNING CONTENT from the runtime UI translator

Context: the app's UI is now Chinese by default. A runtime translator (`lib/i18n/dom-translator.ts`) walks the DOM and replaces any text node whose exact text is a known Mongolian **UI string** (buttons, titles, helper text) with its Chinese translation. It skips everything inside an element with `translate="no"`.

Problem: learning content is also Mongolian — a vocabulary word's meaning ("нүд", "шинэ", "бүгд"), a sentence translation, a grammar explanation, a video subtitle, a quiz option, a Korean lesson gloss. If such a content string happens to equal a UI string (e.g. the word meaning "Шинэ" = UI badge "Шинэ" → 新; "Нүүр" (face) = nav "Нүүр" → 首页), the translator would wrongly change the content. Content must stay exactly as authored.

Your job, in the files/directories assigned to you: add `translate="no"` to the JSX element that renders **data-driven Mongolian content**, so the translator never touches it.

Rules:
1. Mark the **narrowest** element around the content text (the `<p>`, `<span>`, `<li>`, `<td>`, `<div>` whose children are the content values) — NOT a whole card that also contains UI buttons/labels (those must still be translated). If a container has only content children (e.g. a `<ul>` of vocabulary rows without buttons), marking the container is fine.
2. What counts as content: any rendered value coming from props/DB/JSON/data files that is language content — `meaning`, `meaningMn`, `mn`, `translation`, `translationMn`, `_mn` fields, `explanation`, `note`, `gloss`, `subtitle`/`subtitles` text, `hint`, `example` translations, quiz `question`/`options`/`explanation` text, grammar rule text, story/dialogue lines, Korean romanization/gloss, `title_mn` of series/videos/lessons, user-typed text (notes, answers). Chinese/pinyin-only values don't strictly need marking but marking them is harmless.
3. What is NOT content (leave alone so it gets translated): literal Mongolian strings written in JSX (`<button>Хадгалах</button>`, `tr(locale, "…")`, headings, empty-state text, error messages, labels, badges, toasts).
4. Do not change any logic, text, classes, or formatting other than adding the attribute. Keep TypeScript valid: for custom components (not DOM elements) you can't add `translate` unless they forward it — wrap or mark the DOM element inside instead. `translate="no"` is a valid React attribute on DOM elements.
5. Work file by file: grep for JSX expressions like `{word.meaning}`, `{item.mn}`, `{t.translation}`, `{line.mn}`, `{subtitle.text}`, `.meaningMn`, `explanation`, `translation`, `_mn`, `gloss`, `romanization`, `hint`, `note`, and inspect each render site. Also `dangerouslySetInnerHTML` of content.
6. When done: `npx tsc --noEmit` must pass (run from /home/claude/repo). Report: list of files changed with a one-line note of what was protected, and any content render sites you were unsure about.

Assigned to you: {SCOPE}
