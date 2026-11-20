# HSK 3.0 全真模拟 (BLCUP 2026) → mock_tests импортын pipeline

Эх: `C:\Users\PC\Desktop\Surtsgaay app\hsk 3.0\M147.HSK 3.0全真模拟` (сканнердсан PDF + mp3). Ажлын хавтас (cloud): `/home/claude/work/m30`.

1. `render.sh` — PDF → хуудасны PNG (110 dpi) + tesseract OCR (chi_sim).
2. `transcribe.py` — mp3 → faster-whisper (small, int8) үгийн цагтай JSON.
3. Extractor subagent (sonnet) — `EXTRACT-SPEC.md` → `out/<TID>/extract.json` (+ `img/`), `check_extract.py`.
4. Explainer subagent (sonnet) — `EXPLAIN-SPEC.md` → `out/<TID>/explain.json`, `check_explain.py`.
5. `align.py <TID> <audio-key>` — script ↔ whisper тулгаж асуулт бүрийн audio_start/end (`align_fix.json`-оор гар засвар).
6. `build.py <TID> <audio-key>` — `public/mock-tests/<tid>/` (listening.mp3 mono 48k, img/*.webp) + `out/<TID>/<TID>.sql` + importer zip (`<TID>.zip`, json-only; audio/зураг нь public замаар).

ID: `M<түвшин>26<№>` (M12601 = HSK 1, 2026, №1; M72603 = HSK 7–9 №3). UI: `isHsk30TestId()` → «HSK 3.0» таб.
