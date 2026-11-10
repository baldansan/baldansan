# Жинхэнэ шалгалт (真题) багцын формат

Импорт: `/admin/import/mock-test` (zip). Шаардлага: migration `080_mock_tests_admin_write.sql`.

```
H41329.zip
├── H41329.json
├── audio/H41329.mp3          (сонсголын бүтэн бичлэг, 32–40 kbps mono)
└── images/q06_A.png …        (асуулт/сонголтын зураг)
```

`H41329.json`:
```json
{
  "test_id": "H41329",
  "hsk_level": 4,
  "title": "HSK 4 — H41329 (жинхэнэ шалгалт)",
  "total_questions": 100,
  "time_limit_min": 105,
  "has_writing": true,
  "sections": [
    { "skill": "listening", "time_min": 30, "audio_url": "audio/H41329.mp3",
      "parts": [ { "part": 1, "range": [1, 10], "q_type": "judge", "desc": "★ өгүүлбэр зөв/буруу" } ] },
    { "skill": "reading", "time_min": 40, "parts": [ … ] },
    { "skill": "writing", "time_min": 25, "parts": [ … ] }
  ],
  "questions": [
    {
      "skill": "listening", "part": 1, "q_no": 1, "q_type": "judge",
      "stem": "★ 他今天很忙。",
      "options": null,
      "correct_answer": "√",
      "image_url": null,
      "needs_image": false,
      "tags": ["sk.listening.judge"],
      "explanation_mn": "Бичлэгт … гэж хэлсэн тул ★ өгүүлбэр зөв.",
      "audio_start_sec": 61.2, "audio_end_sec": 75.9,
      "audio_transcript": "男：…\n女：…",
      "tutor_note": {
        "transcript": [{ "zh": "男：…", "pinyin": "…", "mn": "…" }],
        "key": "…", "keyMn": "…",
        "why": "ЗААВАЛ — яагаад зөв",
        "wrong": { "A": "…", "B": "…" },
        "trap": "…", "tip": "…",
        "words": [{ "zh": "…", "pinyin": "…", "mn": "…" }]
      }
    }
  ]
}
```

- `q_type`: judge | choice | match | fill_match | fill_word | fill_char | complete | essay | summary | error_find.
- Сонголттой асуулт: `options: [{key:"A", text:"…"}]` эсвэл зурагтай `{key:"A", text:"", image_url:"images/p03_i1.png"}`.
- `correct_answer`: сонголтын key (A/B/…), judge-д `√`/`×`, complete-д бүтэн өгүүлбэр.
- Сонсголын асуулт бүрт `audio_start_sec`/`audio_end_sec` (бүтэн бичлэг дотор) — апп тэр хэсгийг тоглуулна.
- Монгол тайлбарт ө/ү заавал зөв; орос галиг хориотой.
- Patch горим: `{"test_id":"H41327","questions":[{"q_no":42,"explanation_mn":"…"}]}` — зөвхөн өгсөн талбар солигдоно.
