# HSK Import QA Checklist

Use after importing a Chinese HSK ZIP at `/admin/import/chinese`.

## Pre-import validation

- [ ] Parse / Validate shows correct **HSK Level** and **profile badge**
- [ ] **Critical errors** empty before import
- [ ] Expected **warnings** only (audio/images/QA optional)
- [ ] **Info** shows vocabulary, text, workbook, quiz counts

## Profile-specific

### HSK1
- [ ] Does not require HSK4 fields (`textComprehensionQuestions`, `longText`, …)
- [ ] `pinyinPronunciation`, `characters`, `miniQuiz` sections detected

### HSK4
- [ ] Text count warning if not 5 (import still allowed)
- [ ] Full `texts` payload stored in `source_note` `hskTexts`

### HSK6
- [ ] `longText` / `summaryPrompt` supported
- [ ] Does not require HSK1 `pinyinPronunciation`

## Post-import

- [ ] Lesson status is **draft** on `/admin/lessons`
- [ ] `source_note` contains `hskLevel`, `lessonProfile`, `hskInventory`
- [ ] Re-import same lesson updates draft (no duplicate)
- [ ] `/lessons/{lessonId}?preview=admin` loads without error
- [ ] `/lessons/{lessonId}/vocabulary?preview=admin` shows vocabulary
- [ ] `/lessons/{lessonId}/quiz?preview=admin` shows quiz when present

## Regression

- [ ] `/admin/import/korean` unchanged
- [ ] Legacy Chinese ZIP (no `chinese-hsk` manifest) still imports
- [ ] Existing published HSK lessons unchanged
- [ ] `npm run build` passes
