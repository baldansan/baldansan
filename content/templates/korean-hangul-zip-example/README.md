# Korean Hangul ZIP example (text only)

Minimal files to build a test ZIP for `/admin/import`.

## Build ZIP (PowerShell)

From this folder:

```powershell
Compress-Archive -Path manifest.json,lesson.json,vocabulary.json,quiz.json -DestinationPath korean-pre01-example.zip -Force
```

## Optional audio folder

To test media upload, add:

```
audio/
  sample.mp3
```

Set in `lesson.json`:

```json
"audioFile": "audio/sample.mp3",
"mediaStatus": "pending"
```

Re-zip including the `audio` folder.

## After import

1. `/admin/import` → upload ZIP → Parse → Import as draft
2. Preview `/lessons/k-pre-01?preview=admin`
3. Publish when QA passes

If audio is missing, learners can use **TTS speaker buttons** (see [TTS_PRONUNCIATION_SYSTEM.md](../../../TTS_PRONUNCIATION_SYSTEM.md)).
