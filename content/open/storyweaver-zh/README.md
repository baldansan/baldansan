# StoryWeaver (Pratham Books) — Chinese (Simplified)

- **Source:** https://storyweaver.org.in/en/stories?language=Chinese%20(Simplified) — all 406 books listed for "Chinese (Simplified)" on 2026-09-26.
- **License:** **CC BY 4.0** — https://creativecommons.org/licenses/by/4.0/. Checked per story: the book's own attribution page ("Released under … license" for the translation, the original story and every illustration) was parsed; all 406 books list only CC BY 4.0, so none were skipped. StoryWeaver: "The license that has been used for all stories and illustrations is CC BY 4.0" (https://storyweaver.org.in/en/open-content).
- **Required attribution:** each story's `attribution` field holds StoryWeaver's own attribution text (translator, original story + author + publisher, every illustration + illustrator), e.g.
  > This story: 干净的小猫 is translated by Carissa Kang. The © for this translation lies with Carissa Kang, 2017. Some rights reserved. Released under CC BY 4.0 license. Based on Original story: 'Clean Cat', by Kanchan Bannerjee. © Pratham Books, 2015. … Images Attributions: Cover page: Clean cat, by Deepa Balsavar © Pratham Books, 2015 …

  Show it (or link to it) on the story screen plus "Source: StoryWeaver (storyweaver.org.in), CC BY 4.0. Changes: pinyin added[, Mongolian translation added]".

## How the text was fetched
- List: `GET /api/v1/books-search?languages[]=Chinese (Simplified)&page=N&per_page=200` (public).
- Pages: `GET /api/v1/stories/<slug>/read?embed=true` — the public **embed reader** JSON (no login). The plain `/read` endpoint returns 401 without login, and PDF/ePub download (`/node/api/v1/download-story`) needs a login token.
- The site rate-limits (HTTP 429) above ~1 request/s; the script waits 1 s between calls and backs off 30 s on 429. A full fetch took ~30 min.
- Raw JSON cached in `/home/claude/open-media/raw/storyweaver-zh/` (list-N.json, read/<id>.json).

## Counts
- **406 stories**, 5,195 story pages (401 of them illustration-only, `no_text: true`), 195,044 Han characters.
- Levels (StoryWeaver `level`): 1 → 182, 2 → 112, 3 → 75, 4 → 11, **5 → 26** (API value "5" = StoryWeaver's newer early-reader band; the book's back cover says "Level 1 book for children who can read easy words, less than 50 words" — see `level_help`). Levels 1 + 2 + 5 = 320 books for kids/YCT.
- `hsk_p90` distribution: 1: 2, 2: 5, 3: 29, 4: 83, 5: 179, 6: 89, 7: 13, none: 6.
- Flags: 6 `wordless` books (no Chinese text), 9 `inline_pinyin` (the book itself prints pinyin in the text, e.g. 秋天), 75 `latin_names_in_text` (character names left in Latin script, e.g. Veena, Manu).
- 41 pages contained Traditional characters inside "Simplified" books → converted with OpenCC t2s (`t2s_pages_changed` per story).
- No book in this language has audio (`isAudio` false for all 406).

## Files
- `data.json` — `{source, source_url, language, listed, count, skipped[], stories[]}`. Story: `id` (`sw-zh-<storyweaver id>`), `story_id`, `slug`, `url`, `title`, `title_pinyin`, `description`, `level`, `level_help`, `hsk_max`, `hsk_p90`, `authors[]` (translators/authors of this version), `original_authors[]`, `illustrators[]`, `publisher`, `is_audio`, `orientation`, `cover` (public path), `cover_url`, `page_count`, `char_count`, `t2s_pages_changed`, `flags[]`, `pages[]`, `source`, `license`, `license_url`, `licenses_all[]`, `attribution`.
  Page: `id` (`sw-zh-<id>-pNN`), `page` (1-based story page), `reader_page` (position in StoryWeaver's reader, cover = 1 — matches "Page N" in the image attributions), `zh` (text boxes joined with `\n`), `pinyin`, `hsk_max`, `image` (illustration crop URL, size4 ≈ 800 px), `no_text` (only when true).
- `manifest.json` — image URLs only (not downloaded): `{story, page, kind (image|cover), url}` for 5,484 images (pages with an illustration + covers).
- `public/open/storyweaver-zh/covers/<id>.jpg` — one cover per story (≤ 268 px, ≤ 30 KB; 406 files, ≈ 7 MB). For story 577905 the cover crop 404s, so its first page illustration is used.

## How to regenerate
`python3 scripts/open/storyweaver-zh.py` (fetches anything not cached, then builds; `--offline` builds from cache; `DELAY=` sets seconds between calls). Shared helpers: `scripts/open/_kids_zh.py`.

## Caveats
- Many Chinese versions are **community translations** (publisher "StoryWeaver Community": 362 of 406) and quality varies — some read like machine translation (e.g. the description of 小心！老虎来了！). Teacher review needed before promoting a book; Jala (38) and Singapore Book Council (6) versions are publisher-reviewed.
- `pinyin` by pypinyin (see Global Storybooks README for method); **needs teacher check** of 多音字 and proper names; unknown multi-character words (e.g. 鹦鹉) get per-character spacing.
- `hsk_max` is dominated by single rare words; sort by `level` / `hsk_p90`.
- OpenCC maps 鮟鱇 to CJK Ext-B characters; the helper keeps 鮟鱇.
