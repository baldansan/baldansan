# Сурталчилгааны богино бичлэг (9:16, ~15–19 сек)

Загвар: асуулт (тэмээ) → аппын жинхэнэ дэлгэц утасны хүрээнд, дээр нь шошго + гарчиг → төгсгөлийн карт. Өнгө: ягаан суурь, пинк шошго. Тэмээг `public/temee/v2/*.webp`-ээс авна (өөрчлөхгүй).

- `make_ad.py` — hook / overlay / endcard зураг, still / clip / finish (ffmpeg). Фонт: `npm pack @expo-google-fonts/nunito` → `package/…/Nunito_900Black.ttf`; ханз: NotoSansCJK.
- Дэлгэц бичих: Playwright (proxy = `$HTTPS_PROXY`), viewport 390×800, DSF 2, алхам бүрт JPEG screenshot → ffconcat. (record_video бүү ашигла — 390px л бичдэг.)
- `capture_tone.py <level> <tag>` — «Хөг» горим (`/games/learn?preset=tone`), зөв хариуг `w<level>.json` (hsk_words, anon REST)-оос олно.
- `capture_pairs.py <үгс> <tag>` — хос үгс (`?preset=tonepairs&words=熊猫,睡觉,眼镜`), эхнийхийг зориуд буруу сонгоно.
- `render_tone.py` / `render_pairs.py` — эхлэлд 2 жишээ үг (өнгөт пиньинь), үгийн дуудлага (jsdelivr audio-cmn / HSK-3.0) + `music.mp3` (Higgsfield ElevenLabs Music) холино.
- Бэлэн бичлэгүүд: гараар бичих, сонсгол (HSK2, HSK4, HSK4+жинхэнэ яриа), тоглоом, хөг (амархан, HSK4), хос үгс.
