# Lingua Libre — Mandarin word recordings (HSK 1–2 manifest)

- **Source:** Wikimedia Commons, [Category:Lingua_Libre_pronunciation-cmn](https://commons.wikimedia.org/wiki/Category:Lingua_Libre_pronunciation-cmn) (4,122 files on 2026-09-26), recorded with https://lingualibre.org/
- **License:** set per file and read from Commons `extmetadata`. The kept files are **CC BY-SA 4.0** (673 files, https://creativecommons.org/licenses/by-sa/4.0/) or **CC0** (288 files). Each item carries `license` and `license_url`.
- **Required attribution (CC BY-SA files):** give the speaker name, the licence and a link to the Commons file page, for example
  > Pronunciation by Luilui6666 (Lingua Libre), CC BY-SA 4.0, via Wikimedia Commons (link to `page_url`).
  Each item has a ready-made `attribution` string. If we ever serve a re-encoded copy, add "converted to mp3" and keep it CC BY-SA.
- **Audio was not downloaded.** Only this manifest is stored.

## File
`manifest.json` — 961 items covering 645 distinct words, 0.65 MB:
`[{zh, zh_written?, file_url, page_url, speaker, recorder, uploader, size, license, license_url, level_app, level_2026, source, attribution}]`
- `file_url` — the original upload (`.wav`) on upload.wikimedia.org. Commons also offers transcoded ogg/mp3 derivatives.
- `zh` — simplified. `zh_written` appears only on the 41 recordings whose title uses traditional characters (converted with OpenCC t2s).
- `level_app` — the level in `data/hsk_words.json` (1 or 2), if the word is there. `level_2026` — the zhongdex HSK 3.0 (2026) band (1 or 2), if the word is there.
- Target set: HSK 1–2 words from `data/hsk_words.json` (491) plus HSK 3.0 (2026) bands 1–2 from zhongdex (1,272), 1,294 distinct words in all. Recordings were found for 645 of them; 293 of these are HSK 1–2 in our own list.
- Order: lowest level first, with one recording per word before any second recordings. There were only 961 matches, so the 2,000 cap was not reached.

## How it was produced
`python3 scripts/open/lingua-libre-cmn.py` (from the repo root). It uses the MediaWiki API (`list=categorymembers`, then `prop=imageinfo` with `extmetadata`) with a descriptive User-Agent, sleeps 0.3 s between calls and backs off on HTTP 429. API responses are cached in `/home/claude/open-media/raw/lingua-libre/`.

## Caveats
- The word is parsed from the file title `LL-Q9192 (cmn)-<speaker>-<word>.wav`. 3,161 category files were not HSK 1–2 words, or their titles could not be matched (for example numbers such as `17-45` or phrases).
- Most recordings come from a few speakers (Luilui6666 279, Jouketou 225, CanonNi 181, Levi Highway 91, 雲角 76, …). Some speakers may use Taiwan Mandarin: 41 titles are written in traditional characters. In Taiwan Mandarin some words are pronounced differently (e.g. 垃圾 lèsè, 和 hàn). A teacher should listen before these files are used as the reference pronunciation.
- Recording quality has not been checked (volume, noise, clipping).
