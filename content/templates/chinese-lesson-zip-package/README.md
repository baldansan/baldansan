# Chinese / HSK lesson ZIP package template

Use with **`/admin/import/chinese`**.

## Files

| File | Required |
|------|----------|
| `manifest.json` | Yes |
| `lesson.json` | Yes |
| `vocabulary.json` | Yes |
| `quiz.json` | Yes (may be empty with warning) |
| `subtitles.json` | Optional |
| `audio/` | Optional |
| `images/` | Optional |

## Field mapping

| ZIP field | Database column |
|-----------|-----------------|
| `chinese` | `vocabulary_words.chinese` |
| `pinyin` | `vocabulary_words.pinyin` |
| `mongolian` | `vocabulary_words.mongolian` |
| `hskLevel` | `vocabulary_words.hsk_level` |

See [LESSON_ZIP_IMPORT_FORMAT.md](../../../LESSON_ZIP_IMPORT_FORMAT.md).
