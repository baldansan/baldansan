# Chinese Mother Goose Rhymes (Headland, 1900)

- **Source:** Isaac Taylor Headland (translator & illustrator), *Chinese Mother Goose Rhymes*, Fleming H. Revell, 1900. Project Gutenberg eBook #40425 — https://www.gutenberg.org/ebooks/40425 (plain text https://www.gutenberg.org/cache/epub/40425/pg40425.txt, fetched 2026-09-26). Original scan: https://archive.org/details/chinesemothergoo00head
- **License:** Public domain (published 1900). Attribution (courtesy): “Chinese Mother Goose Rhymes”, translated and illustrated by Isaac Taylor Headland (Fleming H. Revell, 1900). Public domain; text via Project Gutenberg eBook #40425.

## Important: no Chinese text
The Gutenberg edition contains **0 Chinese characters** (checked in both the .txt and the -images.html). In the 1900 print the Chinese originals appear only as brush calligraphy inside the illustrated pages, and the transcriber notes "special formatting to match illustrated pages removed". So this dataset has **English verse only**; `zh` and `pinyin` are `null`. Nothing was invented or back-translated.
To get the Chinese: (a) a teacher can match each rhyme to the known Beijing folk rhyme (Headland's preface credits Baron Vitale's collection; Guido Vitale, *Chinese Folklore: Pekinese Rhymes*, 1896, is PD and prints the Chinese originals — scans at archive.org `cu31924023513462` / `chinesefolklorep00vitarich`; verify before relying on it), or (b) transcribe the calligraphy from the archive.org scan by hand.

## Counts
- 140 rhymes (some titles repeat, e.g. two "The Bride", two "A Riddle", two "The Five Fingers" — they are different rhymes).
- 2 illustration captions were dropped ("LITTLE ORIENTALS", "SEVENTEEN HUNDRED BABIES").

## Files
- `data.json` — `{source, source_url, scan_url, license, han_chars_in_ebook (0), note, count, rhymes[]}`. Rhyme fields: `id` (`cmg-NNN-slug`), `n` (order in book), `title_en`, `title_en_original` (as printed, upper case), `en` (verse; stanzas separated by a blank line), `zh` (null), `pinyin` (null), `level` ("kids"), `riddle_answer_en` (only for riddles whose answer is printed, e.g. "A duck"), `source`, `license`, `attribution`.

## How it was produced
`python3 scripts/open/mother-goose-zh.py` (downloads the Gutenberg txt to `/home/claude/open-media/raw/mother-goose-zh/` if missing, splits on the upper-case rhyme titles after the preface).

## Caveats
- 1900 translation: some rhymes reflect period attitudes (e.g. "Of What Use Is a Girl?", "Little Small-Feet" / "Little Bound Feet") — review before using with children.
