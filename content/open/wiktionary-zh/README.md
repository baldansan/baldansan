# Wiktionary (via kaikki.org) — 成语 / 谚语 / 歇后语

- **Source:** English Wiktionary, Chinese entries, as extracted by wiktextract — https://kaikki.org/dictionary/Chinese/ (`kaikki.org-dictionary-Chinese.jsonl`, 1.2 GB, dump dated 2026-09-25)
- **License:** **CC BY-SA 4.0** (https://creativecommons.org/licenses/by-sa/4.0/), also GFDL. wiktextract tool: MIT.
- **Required attribution (CC BY-SA):** From English Wiktionary (https://en.wiktionary.org), © Wiktionary contributors, CC BY-SA 4.0; extracted with wiktextract via kaikki.org (https://kaikki.org/dictionary/Chinese/). Changes: filtered, simplified-script fields selected, per-syllable pinyin and HSK level added.
  Every item also carries `source_url` (its Wiktionary page).
- **ShareAlike:** anything derived from these files (e.g. our Mongolian glosses) must be published under CC BY-SA 4.0 too — keep it separate from proprietary lesson content (see CATALOG "Keep SA data separate").
- **Fetched:** 2026-09-26 · **Script:** `scripts/open/wiktionary-zh.py` (raw dump in `/home/claude/open-raw/`)

## Files & counts

| file | selection | count |
|---|---|---|
| `idioms.json` | sense category **Chinese chengyu**; kept if the simplified form is in `data/hsk_words.json` (HSK 1–9 list) **or** it is one of 21 famous 寓言/成语故事 titles (守株待兔, 画蛇添足, 井底之蛙 … same list as `fables-classical`) **or** every character is an HSK 1–6 character; ranked (HSK/curated first → has examples/etymology → lowest max-char level) and capped at 3,000 | **3,000** (of 6,785 chengyu; 2,744 dropped for rare chars, 1,041 cut by the cap) |
| `proverbs.json` | category **Chinese proverbs** or POS `proverb` — all | **858** (191 have no Mandarin reading: Cantonese/Hokkien/Hakka… proverbs) |
| `xiehouyu.json` | category **Chinese xiehouyu** — all | **127** (68 without Mandarin reading) |

(Category page counts on Wiktionary — 12,661 / 1,702 / 267 — count Traditional and Simplified pages separately; kaikki merges them into one entry, hence roughly half.)

## Schema

`{ source, source_url, license, attribution, generated, count, items: [...] }`, item:

| field | |
|---|---|
| `id` | `cy-0001` / `yy-0001` / `xhy-0001` |
| `zh`, `zh_trad` | Simplified form (Wiktionary's Simplified form, else OpenCC t2s); Traditional page title if different |
| `pinyin` | Wiktionary Standard-Mandarin Pinyin (citation tones, as written on Wiktionary, e.g. `shǒuzhūdàitù`, `sān ge chòupíjiàng, shèngguò yīge Zhūgě Liàng`) |
| `pinyin_syllables` | one syllable per Han character — Wiktionary's reading split per character; when there is no Mandarin reading or it cannot be aligned, pypinyin output and `pinyin_check: true` |
| `mandarin` | false = no Mandarin pronunciation on Wiktionary (dialect saying) |
| `varieties` | e.g. `["Cantonese","Mandarin"]` from `<Variety> chengyu/proverbs/xiehouyu` categories |
| `en` | English glosses (all senses); `en_tags` marks figurative/derogatory/literary… senses |
| `literal` | literal meaning, if given |
| `etymology` | Wiktionary etymology text if ≤ 400 chars (e.g. "Based on a story in Han Feizi") |
| `source_quotes` | classical source passage(s) quoted in the etymology (pre-1900 works only), `{zh, ref, en?}` — `en` dropped when the ref cites a published translation |
| `examples` | ≤ 3 editor-written usage examples `{zh, pinyin, en}` (literary quotations are excluded) |
| `level` | HSK level of the idiom if in `data/hsk_words.json`, else the highest HSK level of its characters (1–7, 7 = HSK 7–9 or beyond) |
| `in_hsk_list` | idiom itself is in `data/hsk_words.json` (280 idioms) |
| `source_url` | Wiktionary page |

Stats: idioms — 165 with examples, 491 with etymology, 118 `pinyin_check`; proverbs — 204 with etymology, 215 `pinyin_check` (mostly dialect); xiehouyu — 59 with etymology, 72 `pinyin_check`.

## Caveats

- Glosses/etymologies are English, written by Wiktionary editors; Mongolian is a later step (no `mn` field).
- Some entries are non-Mandarin sayings (filter with `mandarin: true` for the Mandarin course).
- HSK `level` for idioms is a character-based estimate, not a difficulty rating.
