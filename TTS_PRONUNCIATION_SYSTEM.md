# TTS pronunciation system

Device/browser **Web Speech API** (`speechSynthesis`) for Korean and Chinese learner content. No paid external TTS API. No database changes.

---

## How it works

1. User taps **speaker** (🔊) on vocabulary, subtitles, quiz, or games.
2. If `audioUrl` is provided and playback succeeds → play that file.
3. Else → browser TTS with saved voice/rate/pitch for `ko-KR` or `zh-CN`.
4. If TTS is unavailable → Mongolian message: *«Энэ төхөөрөмж дээр уншуулах боломжгүй байна.»*

Settings are stored in **localStorage** (`buunduu-tts-settings-v1`).

---

## Language codes

| Content | Code | Inference |
|---------|------|-----------|
| Korean (Hangul, KR lessons) | `ko-KR` | `courseId` starts with / contains `korean`, or `hskLevel` starts with `KR` |
| Chinese (HSK) | `zh-CN` | `courseId` HSK/Chinese, default fallback |

---

## Voice availability

- Depends on **device OS and browser** (iOS, Android, Windows, Chrome, Safari, etc.).
- Users can install extra voices in system settings (e.g. Korean TTS pack on phone).
- App **voice dropdown** lists voices matching the selected language tab.
- **Refresh voices** button on `/profile` re-reads the browser voice list.

---

## User settings (`/profile` → Дуудлага TTS)

Per language (`koKR`, `zhCN`):

| Setting | Default | Range |
|---------|---------|-------|
| voiceURI | system default | dropdown |
| rate | 0.9 | 0.6–1.3 |
| pitch | 1 | 0.7–1.3 |
| volume | 1 | 0.2–1 |

**Test phrases:**

- Korean: `안녕하세요. 저는 몽골 사람입니다.`
- Chinese: `你好。我们一起学习中文。`

---

## Code layout

| Path | Role |
|------|------|
| `lib/tts/speech.ts` | `speechSynthesis` wrapper, SSR-safe |
| `lib/tts/tts-settings.ts` | localStorage get/save |
| `lib/tts/infer-lang.ts` | Course/level → `ko-KR` / `zh-CN` |
| `lib/tts/play-pronunciation.ts` | Audio file + saved TTS settings |
| `components/tts/speaker-button.tsx` | Reusable speaker control |
| `components/tts/tts-settings-card.tsx` | Profile settings UI |

---

## Where speaker buttons appear

- Lesson vocabulary (`/lessons/[id]/vocabulary`) — word + example
- Lesson watch subtitles (`/lessons/[id]/watch`)
- Lesson detail preview (subtitle + vocab snippets)
- Quiz (`/lessons/[id]/quiz`) — CJK in question, options, explanation
- Kanji detail (`/kanji/[vocabId]`)
- Games: translate, match (Chinese/Korean column), missing-word, arrange
- Profile: TTS test only (settings card)

Hangul PreLesson content uses the same vocabulary UI — every ㅏ, 가, 한국 row gets a speaker when imported.

---

## Audio file priority

- Lesson-level `audio_url` remains on watch/media player (full lesson audio).
- Per-item `audioUrl` on `SpeakerButton` is supported when passed (future per-vocab audio).
- Failed audio playback automatically falls back to TTS.

---

## Future plan

- Upload **native / studio audio** for lesson dialogues and vocabulary.
- Optional per-word `audio_url` in CMS when schema supports it (no schema change in this sprint).
- Mongolian TTS (`mn-MN`) for Mongolian explanation lines (optional).

---

## Limitations

- TTS quality varies by device; not a replacement for teacher pronunciation.
- iOS Safari may require user gesture before first speak (tap satisfies this).
- Some Android devices have limited Korean voices until language pack installed.
- Mongolian text is not read by default (Chinese/Korean target script only).
- No offline TTS engine bundled in the app.

---

## Related

- [PRACTICE_GAMES.md](./PRACTICE_GAMES.md)
- [KOREAN_PRELESSON_IMPORT_PLAN.md](./KOREAN_PRELESSON_IMPORT_PLAN.md)
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md)
