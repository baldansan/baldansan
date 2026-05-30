# Korean lesson ZIP package template

Use with **`/admin/import/korean`**.

## Files

| File | Required |
|------|----------|
| `manifest.json` | Yes |
| `lesson.json` | Yes |
| `vocabulary.json` | Yes |
| `quiz.json` | Yes |
| `subtitles.json` | Optional |
| `practice.json` | Optional (reference only in v1) |
| `grammar.json` | Optional (reference only in v1) |
| `audio/` | Optional |
| `images/` | Optional |

## Field mapping (Korean → DB)

| Korean ZIP field | Database column |
|------------------|-----------------|
| `korean` | `vocabulary_words.chinese` |
| `romanization` | `vocabulary_words.pinyin` |
| `mongolian` | `vocabulary_words.mongolian` |
| `level` | `vocabulary_words.hsk_level` |
| `targetTitle` / `koreanTitle` | `lessons.chinese_title` |
| `mongolianTitle` | `lessons.subtitle` / title |

See [KOREAN_ZIP_IMPORT_FORMAT.md](../../../KOREAN_ZIP_IMPORT_FORMAT.md) for full spec.

## Before import

1. Ensure `korean-1` course exists — run `content/korean-book-1/create-korean-course.sql` in Supabase.
2. Zip files at ZIP root (not nested folder).
3. Import creates **draft** lesson automatically if missing.
