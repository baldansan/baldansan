# HSK6 хичээлийн импортын пакетууд

`hsk6-lNN/` — `content/hsk-source/hsk6/hsk6-lNN.json`-оос `docs/hsk-source/lesson-build/hsk6/INSTRUCTIONS-HSK6-L01.md` зааврын дагуу 3 Sonnet агентаар (texts / grammar+vocab+quiz+lesson / workbook) бүтээсэн FLAT багц. Аудио байхгүй (TTS), зураг байхгүй. Zip: хавтас дотор `zip -qr ../hsk6-lNN.zip . -x '.*'` → `npx tsx scripts/validate-lesson-zip.mts` → `/admin/import/chinese`.
Профайл: `hsk6-advanced-reading-output-summary` (texts.json-д comprehensiveNotes / discourseRhetoric / sentenceErrorAnalysis / applicationSummaryWriting / workbookSummaryWriting түлхүүр ЗААВАЛ).
