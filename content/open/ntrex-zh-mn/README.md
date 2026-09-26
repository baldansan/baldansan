# NTREX-128 — aligned Chinese / Mongolian / English news sentences

- **Source:** https://github.com/MicrosoftTranslator/NTREX (commit `468c6b6`), files `NTREX-128/newstest2019-src.eng.txt`, `newstest2019-ref.zho-CN.txt`, `newstest2019-ref.mon.txt`, `DOCUMENT_IDS.tsv`
- **License:** **CC BY-SA 4.0** — https://github.com/MicrosoftTranslator/NTREX/blob/main/LICENSE.md
- **Required attribution:** NTREX-128 — News Test References for MT Evaluation of 128 Languages, Christian Federmann, Tom Kocmi, Ying Xin (2022), Microsoft, https://github.com/MicrosoftTranslator/NTREX, CC BY-SA 4.0; English source from WMT19 newstest. Changes: selected zho-CN/mon/eng lines, added pinyin (pypinyin) and HSK level estimate.
  Cite: Federmann et al., *NTREX-128*, SUMEval 2022, https://aclanthology.org/2022.sumeval-1.4 ; Barrault et al., *Findings of WMT19*.
- **ShareAlike:** derived data (e.g. drills built from these sentences) must stay CC BY-SA 4.0.
- **Fetched:** 2026-09-26 · **Script:** `scripts/open/ntrex-zh-mn.py`

## Content

`data.json` — **1,997** line-aligned sentences from **123** news documents (BBC, etc.), 0 skipped.

```
{ source, source_url, source_commit, license, attribution, generated, languages, level_note, count,
  items: [ {id "ntrex-0001", line, doc_id, zh, pinyin, mn, en, level, level_p90} ] }
```

- `zh` = Simplified Chinese reference (zho-CN), `mn` = Mongolian (Khalkha, Cyrillic, ISO `mon`), `en` = English source.
- `pinyin`: word-spaced tone-mark pinyin (pypinyin, segmented by forward max-match on HSK + pypinyin phrase lists — shared helper `scripts/open/_kids_zh.py`).
- `level`: highest HSK level (1–7, 7 = HSK 7–9) among HSK words found; `level_p90`: level that covers 90 % of the HSK word tokens (better for sorting).
  Distribution — level: 1:2, 2:7, 3:15, 4:45, 5:142, 6:301, 7:1485 · level_p90: 1:9, 2:21, 3:44, 4:167, 5:554, 6:677, 7:523, none:2.

## Caveats

- Both `zh` and `mn` are **independent human translations of the English** source, not translations of each other — good for reading practice and as an MT/translation QA benchmark, but zh↔mn alignment is only at sentence level and wording can diverge.
- News register: almost all sentences are HSK 5+ material. Some zh lines keep Latin acronyms (AM, MWP) and half-width brackets from the source.
- Pinyin is automatic (多音字 and proper names need checking).
