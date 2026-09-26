# LibriVox — Chinese recordings (三百千, 弟子规, 唐诗三百首 卷一–五, 论语)

- **Source:** LibriVox volunteer recordings hosted on the Internet Archive. Metadata from `https://archive.org/metadata/<id>` and section titles/readers from the LibriVox catalog pages (fetched 2026-09-26).
- **License:** **Public domain** — archive.org `licenseurl` = http://creativecommons.org/licenses/publicdomain/ for every item; LibriVox policy: "All LibriVox recordings are in the public domain" (https://librivox.org/pages/public-domain/). No attribution required; we credit "LibriVox volunteers" + reader names anyway (`reader` field).

| group | archive.org id | LibriVox page | sections | minutes |
|---|---|---|---|---|
| 三百千 (百家姓·千字文·三字经) | three_chinese_classics_0907_librivox | https://librivox.org/three-classic-chinese-texts/ | 3 | 32 |
| 弟子规 (Mandarin, Cantonese, Hakka) | di_zi_gui_0805_librivox | https://librivox.org/di-zi-gui-by-li-yuexiu/ | 3 | 29 |
| 唐诗三百首 卷一 | 300_tang_poems_vol_1_librivox | https://librivox.org/three-hundred-tang-poems-volume-1-by-various/ | 105 | 132 |
| 唐诗三百首 卷二 | 300_tang_poems_vol_2_librivox | https://librivox.org/three-hundred-tang-poems-volume-2-by-various/ | 111 | 268 |
| 唐诗三百首 卷三 | 300_tang_poems_vol_3_librivox | https://librivox.org/three-hundred-tang-poems-volume-3-by-various/ | 260 | 247 |
| 唐诗三百首 卷四 | tangpoems4_1207_librivox | https://librivox.org/three-hundred-tang-poems-volume-4-by-various/ | 114 | 107 |
| 唐诗三百首 卷五 | three_hundred_tang_poems_volume_5_1501_librivox | https://librivox.org/three-hundred-tang-poems-volume-5-by-various/ | 97 | 54 |
| 论语 | lun_yu_0801_librivox | https://librivox.org/lun-yu-or-analects-of-confucius-read-in-chinese/ | 20 | 148 |

Total: 8 books, 713 sections (≈ 17 h). Dialect labels parsed from the LibriVox titles: Mandarin 268, Hokkien 168, Teochow 80, Cantonese 40, Taiwanese 23, Hakka 3, Hunanese 3, Sichuanese 2, Hainanese 1, Wu 1, unlabeled 124 (三百千, 论语, all of 卷五 and a few others — 卷五 and 论语 are described as "read in Chinese"; check by ear). **Only Mandarin tracks (≈ 5.4 h of poems + 弟子规 Mandarin + 三百千 + 论语) are relevant for learners** — filter on `dialect == "Mandarin"` or listen-check the unlabeled ones.

## Files
- `manifest.json` — `{source, license, note, count, sections, books[]}`. Book: `id`, `archive_id`, `group` (sanbaiqian | dizigui | tangshi | lunyu), `name_zh`, `title`, `librivox_url`, `archive_url`, `runtime`, `duration_s`, `section_count`, `dialects[]`, `license`, `license_url`, `source`, `attribution`, `sections[]`.
  Section: `id`, `file`, `url` (64 kbps mp3 on archive.org), `url_vbr` (original VBR mp3), `title` (LibriVox chapter title as published), `number` (poem number in 唐诗三百首 numbering — use this to join with a poem-text dataset such as chinese-poetry), `dialect`, `duration_s`, `bytes` (64 kbps file), `reader`, `language`, `author`, `etext` (link to the text PDF, where given), and when the title contains Chinese: `zh` (Simplified via OpenCC t2s), `zh_trad` (original, only if different), `pinyin`; `en` = English title given in the LibriVox title.
- No audio downloaded (≈ 700 files; stream or fetch on demand from `url`).

## How it was produced
`python3 scripts/open/librivox-zh.py` (raw archive.org JSON + catalog HTML cached in `/home/claude/open-media/raw/librivox-zh/`; `--offline` rebuilds from cache). librivox.org sits behind Cloudflare and intermittently returns 52x — the script retries.

## Caveats
- Volunteer readers; accent and audio quality vary — listen-check before using as model pronunciation.
- 卷五 has English-only chapter titles (no `zh`); join via `number`.
- Some LibriVox Chinese titles are abbreviated (e.g. 001 感遇其 = 感遇其一) — pinyin of titles by pypinyin, needs teacher check.
- The `zh` of 论语 sections is the chapter name (e.g. 学而，第一), not the text.
