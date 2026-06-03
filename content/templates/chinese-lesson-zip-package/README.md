# Chinese / HSK lesson ZIP package template

Use with **`/admin/import/chinese`**.

Full spec: [docs/BUUNDUU_CHINESE_HSK_PACKAGE_V1.md](../../../docs/BUUNDUU_CHINESE_HSK_PACKAGE_V1.md)  
Shared ZIP rules: [LESSON_ZIP_IMPORT_FORMAT.md](../../../LESSON_ZIP_IMPORT_FORMAT.md)

## Example files in this folder

| File | Purpose |
|------|---------|
| `manifest.example.json` | Package identity, HSK level, profile |
| `lesson.example.json` | Lesson metadata (imported as **draft**) |
| `vocabulary.example.json` | `vocabulary_words` rows |
| `quiz.example.json` | `quiz_questions` rows |
| `subtitles.example.json` | Optional timed subtitles |

Copy examples into a ZIP root (rename `*.example.json` → `*.json`).

## Minimum ZIP layout

| File | Required |
|------|----------|
| `manifest.json` | Yes |
| `lesson.json` | Yes |
| `vocabulary.json` | Yes (≥ 1 row) |
| `quiz.json` | Yes for most HSK profiles (may be `[]` with warning) |
| `subtitles.json` | Optional |
| `texts.json`, `workbook.json`, … | Profile-dependent — see HSK V1 doc |
| `audio/`, `images/` | Optional |

## Field mapping (vocabulary)

| ZIP field | Database column |
|-----------|-----------------|
| `chinese` | `vocabulary_words.chinese` |
| `pinyin` | `vocabulary_words.pinyin` |
| `mongolian` | `vocabulary_words.mongolian` |
| `hskLevel` | `vocabulary_words.hsk_level` |

Aliases `target` / `reading` / `level` are also accepted (see import normalizer).

## quiz.json rules

- Types: **`multiple_choice`**, **`cloze`** only.
- **`cloze` / fill-in:** `options` must be the lesson **Chinese word bank** (汉字 only). Do **not** put Mongolian distractors such as `Буруу`, `Үнэн`, or `Худал` in `options`.
- **`multiple_choice`:** `correctAnswer` must exactly match one `options` entry.
- Rows with `gameType` are skipped (app games build from vocabulary).
- Listening **true/false** (Үнэн/Худал) lives in `workbook.json` / lesson player exercises, not in `quiz.json`.

## Build a ZIP (PowerShell)

```powershell
cd content/templates/chinese-lesson-zip-package
Copy-Item manifest.example.json manifest.json
Copy-Item lesson.example.json lesson.json
Copy-Item vocabulary.example.json vocabulary.json
Copy-Item quiz.example.json quiz.json
# optional:
Copy-Item subtitles.example.json subtitles.json
Compress-Archive -Path manifest.json,lesson.json,vocabulary.json,quiz.json -DestinationPath ..\..\..\hsk-lesson-template.zip
```

Upload the ZIP at **`/admin/import/chinese`**.
