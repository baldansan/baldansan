# Classical originals of 寓言 / 成语故事 (zh.wikisource)

- **Source:** 维基文库 zh.wikisource.org — raw wikitext of the pages listed below (`index.php?action=raw`, User-Agent set, 2 s between requests)
- **License:** **Public domain** — pre-modern texts (Warring States – Han, Wikisource `{{PD-old}}`). No attribution legally required; we credit the book/chapter and Wikisource anyway.
- **Attribution line (per item):** 《book·chapter》, text from 维基文库 zh.wikisource.org (page), public domain; converted to Simplified with OpenCC, pinyin by pypinyin.
- **Only classical originals (文言).** No modern retellings (those are copyrighted); our own simple retellings / Mongolian versions are a later, separate step.
- **Fetched:** 2026-09-26 · **Script:** `scripts/open/fables-classical.py` (page cache in `/home/claude/open-raw/wikisource/`)

## Content — 29 fables, 0 skipped

| 成语 | source | chars | Wikisource page |
|---|---|---|---|
| 守株待兔 | 《韩非子·五蠹》 | 58 | `韓非子/五蠹` |
| 刻舟求剑 | 《吕氏春秋·慎大览·察今》 | 53 | `呂氏春秋/卷十五` |
| 拔苗助长（揠苗助长） | 《孟子·公孙丑上》 | 80 | `孟子/公孫丑上` |
| 亡羊补牢 | 《战国策·楚策四·庄辛谓楚襄王》 | 23 | `戰國策 (士禮居叢書本)/楚/四` |
| 掩耳盗铃 | 《吕氏春秋·不苟论·自知》 | 55 | `呂氏春秋/卷二十四` |
| 画蛇添足 | 《战国策·齐策二》 | 95 | `戰國策 (士禮居叢書本)/齊/二` |
| 井底之蛙 | 《庄子·秋水》 | 197 | `莊子/秋水` |
| 狐假虎威 | 《战国策·楚策一》 | 88 | `戰國策 (士禮居叢書本)/楚/一` |
| 自相矛盾 | 《韩非子·难一》 | 71 | `韓非子/難一` |
| 郑人买履 | 《韩非子·外储说左上》 | 61 | `韓非子/外儲說左上` |
| 塞翁失马 | 《淮南子·人间训》 | 134 | `淮南子/人間訓` |
| 叶公好龙 | 《新序·杂事第五》 | 69 | `新序/雜事/卷五` |
| 对牛弹琴 | 《牟子理惑论》(载《弘明集》卷一) | 49 | `弘明集/01` |
| 杯弓蛇影 | 《风俗通义·怪神》 | 165 | `風俗通義/9` |
| 滥竽充数 | 《韩非子·内储说上七术》 | 44 | `韓非子/內儲說上七術` |
| 买椟还珠 | 《韩非子·外储说左上》 | 53 | `韓非子/外儲說左上` |
| 邯郸学步 | 《庄子·秋水》 | 32 | `莊子/秋水` |
| 东施效颦 | 《庄子·天运》 | 62 | `莊子/天運` |
| 愚公移山 | 《列子·汤问》 | 310 | `列子/湯問篇` |
| 精卫填海 | 《山海经·北山经》 | 72 | `山海經/北山經` |
| 鹬蚌相争 | 《战国策·燕策二》 | 109 | `戰國策 (士禮居叢書本)/燕/二` |
| 惊弓之鸟 | 《战国策·楚策四》 | 142 | `戰國策 (士禮居叢書本)/楚/四` |
| 南辕北辙 | 《战国策·魏策四》 | 128 | `戰國策 (士禮居叢書本)/魏/四` |
| 朝三暮四 | 《列子·黄帝》 | 86 | `列子/黃帝篇` |
| 杞人忧天 | 《列子·天瑞》 | 151 | `列子/天瑞篇` |
| 疑邻盗斧 | 《列子·说符》 | 65 | `列子/說符篇` |
| 两小儿辩日 | 《列子·汤问》 | 117 | `列子/湯問篇` |
| 庖丁解牛 | 《庄子·养生主》 | 292 | `莊子/養生主` |
| 夸父逐日 | 《山海经·海外北经》 | 37 | `山海經/海外北經` |

## Schema

```
{ source, source_url, license, generated, note, count, skipped[],
  items: [ { id "fable-01", key, idiom, title, book, chapter,
             zh (simplified), zh_trad (as on Wikisource, commentary removed; null if offsets could not be mapped),
             pinyin (one syllable per Han char, ASCII punctuation), sentences: [{zh, pinyin}],
             chars, level: "classic", source, source_url, license, attribution } ] }
```

## Caveats

- Passages are cut between a start and an end anchor phrase chosen by hand (see `FABLES` in the script); inline commentary (`{{*|…}}` — 鲍彪/姚宏 notes in the 士禮居 战国策 etc.) and variant-reading notes are removed (`{{另|A|B}}` → A).
- 亡羊补牢 is only the proverb sentence spoken by 庄辛 (the idiom has no separate story in the source). 掩耳盗铃's original is about a bell (钟, 掩耳盗钟).
- OpenCC t2s leaves some classical/variant characters, a few outside the BMP that need a CJK Ext-B+ font: 𪾸 (矉, 东施效颦), 𫓧 (鈇, 疑邻盗斧), 𫍻 / 𬴃 (庖丁解牛), 䖟 (对牛弹琴); also 鼃 (=蛙, 井底之蛙), 楯 (=盾, 自相矛盾).
- Pinyin is pypinyin — 文言 readings are frequently wrong (e.g. 为 wéi/wèi, 说 = 悦 yuè, 通假字). **Teacher check required.**
