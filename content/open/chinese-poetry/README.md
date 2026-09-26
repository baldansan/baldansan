# chinese-poetry — 蒙学 classics, 唐诗三百首, 宋词三百首

- **Source:** https://github.com/chinese-poetry/chinese-poetry (commit `b8594f8`, 2026-06-17), folders `蒙学/`, `全唐诗/唐诗三百首.json`, `宋词/宋词三百首.json`
- **License:** texts are **public domain** (pre-modern works). The dataset is **MIT License** — https://github.com/chinese-poetry/chinese-poetry/blob/master/LICENSE (© chinese-poetry contributors). Keep the MIT notice with redistributed data.
- **Attribution line:** Classical texts (public domain) from the chinese-poetry dataset, © chinese-poetry contributors, MIT License; converted to Simplified Chinese with OpenCC and annotated with pypinyin.
- **Fetched:** 2026-09-26 · **Script:** `scripts/open/chinese-poetry.py` (raw clone in `/home/claude/open-raw/chinese-poetry`, sparse checkout of the 3 folders)

## Files

| file | content | count |
|---|---|---|
| `mengxue.json` | 9 蒙学 works (below) | 1,733 lines + 226 千家诗 poems |
| `tangshi300.json` | 唐诗三百首 (from `全唐诗/唐诗三百首.json`) | 366 poems, 1,751 lines |
| `songci300.json` | 宋词三百首 | 280 词, 2,562 lines |

`mengxue.json` works: 三字经 (传统版/清代通行本, 96 printed lines), 百家姓 (71 lines of 8 surnames + 438 郡望 `origin` entries), 千字文 (125 lines), 弟子规 (8 chapters, 90 lines), 千家诗 (226 poems, multi-part poems split into 其一/其二… with `subtitle`), 声律启蒙 (30 韵 sections, 90 paragraphs), 幼学琼林 (33 chapters, 191 paragraphs), 增广贤文 (752 lines), 朱子家训 (51 lines).
Not included from 蒙学/: 古文观止 (476 KB adult prose anthology), 文字蒙求 (character-study treatise), 三字经 新版 (Republic-era expanded edition; the traditional edition is used), and 蒙学/tangshisanbaishou.json (the 全唐诗 version was requested instead).

## Schema

```
mengxue.json  { source, source_url, source_commit, license, attribution, generated, pinyin_note,
                works: [ { id, title, title_trad, author, dynasty, level:"kids", source, license, attribution,
                           edition?, pinyin_note?, origin? (百家姓 郡望),
                           sections: [ { volume?, chapter, lines: [ {id, zh, pinyin, phrases?} ] } ]   // most works
                           poems:    [ { id, title, subtitle, author, dynasty, form, paragraphs:[{id, zh, pinyin}] } ]  // 千家诗
                } ] }
tangshi300.json { …meta, level:"classic", poems: [ {id, title, author, dynasty:"唐", form, tags[], paragraphs:[{id, zh, pinyin}], level, source_id} ] }
songci300.json  { …meta, level:"classic", poems: [ {id, title (=词牌), rhythmic, author, dynasty:"宋", paragraphs:[{id, zh, pinyin}], level} ] }
```

- Lines follow the printed layout: 三字经 = one line of four 3-char phrases ("人之初，性本善，性相近，习相远。"), 千字文 = 8-char couplet lines ("天地玄黄，宇宙洪荒。", built by pairing the source's 4-char phrases), 百家姓 = 8-surname lines. `phrases` holds the 3-/4-char units for memorisation games.
- `pinyin`: tone marks, **one syllable per Han character**, space separated, ASCII punctuation (so it can be aligned 1:1 with the characters for ruby display). 千字文 uses the source dataset's own `spells` pinyin; everything else is pypinyin (Style.TONE, whole-line context).
- `form` (唐诗) comes from the source tags (五言绝句/七言律诗/乐府…); 17 poems have no form tag.

## Caveats

- **Traditional → Simplified** by OpenCC `t2s` (opencc-python-reimplemented). 百家姓: 於 is kept as the surname 於 (OpenCC would merge it into 于). Other surname-sensitive conversions (e.g. 萬→万, 蕭→萧) follow OpenCC and should be checked by a teacher.
- **Pinyin is machine-generated** (pypinyin) — classical 多音字 are often wrong: e.g. 为 read wèi where 文言 needs wéi ("…者为天"), 客思 sī (should be sì), 斜/看 rhyme readings, 说 (=悦) yuè, etc. **Needs teacher check** before being shown as authoritative.
- 唐诗三百首 has 366 records because some multi-part titles are split into separate records by the source.
- 宋词 source was already Simplified; OpenCC was still applied (no-op in practice).
