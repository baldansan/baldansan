# zhongdex — graded HSK 3.0 sentences + word canon

- **Source:** https://github.com/saymei/zhongdex (commit `2ea38cc5adc962df4097961f2aecf68a651497ca`, fetched 2026-09-26 with `git clone --depth 1`)
- **License (data):** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), https://creativecommons.org/licenses/by-sa/4.0/. The upstream code is MIT; we copied data only.
- **Required attribution (reproduce this):**
  > Zhongdex by SayMei (https://github.com/saymei/zhongdex), CC BY-SA 4.0. Contains data from CC-CEDICT (MDBG, CC BY-SA 4.0, https://www.mdbg.net/chinese/dictionary?page=cc-cedict) and the HSK 3.0 (2026) word list. Changes were made: fields were selected, renamed and reformatted, and an extra `level_app` estimate was added.
- **ShareAlike:** these files and anything derived from them (e.g. our Mongolian glosses of these sentences) must be published under CC BY-SA 4.0. Keep them separate from MIT/proprietary data. "Zhongdex" and "SayMei" are trademarks: say "built from Zhongdex data".

## Files

| File | Count | Size | What it is |
|---|---|---|---|
| `sentences.json` | 29,619 | 13.9 MB | graded example sentences |
| `words.json` | 11,092 | 4.1 MB | HSK 3.0 (2026) word canon, with the fields our `data/hsk_words.json` lacks |
| `compare-hsk_words.json` | — | 9 KB | overlap/level comparison with `data/hsk_words.json` |

### `sentences.json` — `[{id, zh, pinyin, en, level, level_app, new_words[], words[], headwords[], source, license, attribution}]`
- `id` — `zhongdex:<hash>` (upstream id `dex:s:<hash>`).
- `zh`, `pinyin`, `en` — upstream `hanzi`, `pinyin` (tone marks), `english`, copied verbatim. Upstream pinyin spacing is inconsistent (about 1/4 of the sentences are spaced by syllable, the rest by word).
- `level` — upstream **ZSG** grade 1–7: the highest HSK 3.0 (2026) band of any content word after segmentation. **7 = band 7–9** (or a word outside HSK). Distribution: 1: 299, 2: 679, 3: 1,207, 4: 2,366, 5: 2,716, 6: 2,948, 7: 19,404.
- `level_app` — our own estimate using `data/hsk_words.json` (forward maximum matching; unknown character → lowest level of any word containing it, else 7). It often differs from `level` because the two word lists band words differently (see below).
- `new_words` — upstream `newWordCount` as an array: `new_words[k-1]` = number of distinct words **outside bands 1..k**. `new_words[k-1] == 1` means the sentence is an **i+1 sentence** for a learner who knows band k (4,766 sentences are i+1 for band 1).
- `words` — upstream segmentation; `headwords` — the canon words this sentence is filed under (up to 3 sentences per headword: easy / at-level / stretch).

### `words.json` — `[{id, zh, trad, pinyin, pinyin_num, pos[], level, band2021, band2_0, list_id, freq_rank, zipf, radical, en[], in_hsk_words, hsk_words_level, source, license}]`
Fields we lack in `data/hsk_words.json`: official **2026 band** with upstream row id (`list_id`), **2021 band**, legacy HSK 2.0 band, corpus **Zipf** frequency, and the full list of CC-CEDICT glosses (`en[]`). `level` scale is 1–6, 7 = band 7–9.

## Comparison with `data/hsk_words.json`
- zhongdex: 11,092 records / 10,959 distinct forms; ours: 10,057 distinct forms.
- **Overlap: 9,674 forms.** Only in zhongdex: 1,285 (68 in band 1, 109 in band 2, 61 in band 3 — mostly compounds such as 上车, 北边, 回家, and forms with alternates like `妈妈|妈`, `有时候|有时`). Only in ours: 383 (301 of them 7–9).
- **Levels disagree on 3,992 of the 9,674 shared words (41 %).** The biggest groups: ours 6 → zhongdex 7–9 (581), ours 5 → zhongdex 3 (418), ours 5 → 4 (412), ours 6 → 5 (377), ours 4 → 3 (306). Our level also agrees poorly with the 2021 band (5,587 of 9,674 agree). Our bands 1–3 hold only 294 / 197 / 487 words, while the official 2026 split is 500 / 772 / 973. **Our `hsk_level` column should be audited against an official list** before it is used for grading. Full lists are in `compare-hsk_words.json`.

## How it was produced
`python3 scripts/open/zhongdex.py` (from the repo root). It reads `data/sentences.jsonl` and `data/hsk_bands.json` from the raw clone at `/home/claude/open-media/raw/zhongdex` and clones the repo if that folder is missing.

## Caveats
- **Count mismatch:** the upstream README says 32,725 sentences, but the committed `data/sentences.jsonl` at this commit has **29,619**, and `data/sentence-stats.json` agrees (29,619). We ingested all of them. No sentence was skipped.
- **Sentence provenance:** upstream says the sentences come from SayMei's own production dictionary (`source.license: "SayMei"` per record, meaning SayMei owns them). The whole `data/` directory is released under CC BY-SA 4.0 by SayMei. No third-party credit is given for the sentences. This is a new (2026) project, so spot-check quality: for example `楼是谁？` → "Who is Lou?" is not useful for learners.
- Upstream NOTICE lists the licence of the vendored HSK 3.0 list as **unresolved**. Band numbers are facts about the syllabus, but keep this in mind.
- Pinyin and English are upstream and unreviewed. Teachers should check 多音字 and tone sandhi. No Mongolian yet (`mn` is absent).
