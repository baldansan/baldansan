# Game Data Requirements — Buunduu Surtsgaay

What lesson vocabulary fields each practice game needs. All data comes from existing `vocabulary_words` / lesson JSON — **no new schema in v1.0**.

---

## Required fields (all games)

| Field | Used for |
|-------|----------|
| `chinese` | Prompts, tiles, options |
| `pinyin` | Display under Chinese |
| `mongolian` | Match/translate answers |

Minimum **4 usable words** per lesson for match and translate games.

---

## Per-game requirements

### Match & Translate
- `chinese` + `mongolian` on at least 4 words
- `pinyin` recommended for match right column

### Missing word
- `exampleChinese` must exist and **contain** the vocabulary `chinese` word
- `exampleMongolian` optional but shown as hint

### Arrange
- `exampleChinese` with length ≥ 4 (after removing spaces)
- `exampleMongolian` optional hint

### Stroke demo (v1.0)
- `chinese` (≥1 character)
- Uses **generic component list** in code — not real stroke/component DB
- Real hanzi component data planned for a later sprint

---

## Empty states

When data is insufficient, games show:

- Match/translate: *«Энэ хичээлд тоглоом үүсгэхэд хангалттай үг алга.»*
- Missing word/arrange: *«Энэ тоглоомд example sentence хэрэгтэй.»*

CTA links to lesson vocabulary page.

---

## Content upload checklist

For each HSK lesson:

1. Add ≥4 vocabulary rows with Chinese, pinyin, Mongolian
2. Add `exampleChinese` / `exampleMongolian` for sentence games
3. Verify example sentences include the target word (missing-word game)
4. Publish lesson (public) so `getPublicLessonById` returns data

---

## Future enrichment

- Dedicated stroke/component table or HanziWriter integration
- Quiz question import for arrange (subtitle lines as alternate source)
- Supabase game progress persistence
- Mongolian → Chinese translate mode
- Real handwriting and speech practice on `/kanji/[vocabId]`
