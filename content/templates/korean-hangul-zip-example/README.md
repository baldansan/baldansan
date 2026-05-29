# Korean Hangul ZIP example — Teach → Practice flow

Minimal **upload-ready** package for `/admin/import`. Follows [KOREAN_LESSON_PACKAGE_SPEC.md](../../../KOREAN_LESSON_PACKAGE_SPEC.md).

## Files (ZIP root)

```
manifest.json
lesson.json
vocabulary.json
quiz.json
subtitles.json    (recommended)
index.html        (teacher reference — optional for import)
```

## Build ZIP (PowerShell)

From this folder:

```powershell
Compress-Archive -Path manifest.json,lesson.json,vocabulary.json,quiz.json,subtitles.json,index.html -DestinationPath korean-pre01-example.zip -Force
```

## Lesson flow in this example

| Step | Source |
|------|--------|
| Teach | `subtitles.json` role `teach` |
| Example | `subtitles.json` + `vocabulary.json` examples |
| Warning | `subtitles.json` role `warning` |
| Pronunciation | `subtitles.json` role `pronunciation` + TTS |
| Check | `quiz.json` `phase: "check"` |
| Practice | `quiz.json` `phase: "practice"` |
| Game | App generates from vocabulary (`gameType` rows are **not** imported as quiz) |

## quiz.json rules

- **`type`:** only `multiple_choice` or `cloze`
- **`gameType`:** author note only — skipped on import
- **`skillTags`:** same-category distractors (eo/o/u/eu)

## After import

1. `/admin/import` → upload ZIP → Parse → Import as draft
2. Preview `/lessons/k-pre-01?preview=admin`
3. Walk: watch (textbook) → vocabulary → quiz → games
4. Publish when QA passes

## Related

- [KOREAN_LESSON_PACKAGE_SPEC.md](../../../KOREAN_LESSON_PACKAGE_SPEC.md)
- [LESSON_ZIP_IMPORT_FORMAT.md](../../../LESSON_ZIP_IMPORT_FORMAT.md)
- [TTS_PRONUNCIATION_SYSTEM.md](../../../TTS_PRONUNCIATION_SYSTEM.md)
