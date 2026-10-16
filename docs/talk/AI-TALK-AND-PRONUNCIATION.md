# 💬 Ярилцах (AI ролийн яриа) + 🎤 Дуудлагын үнэлгээ

1. **Дуудлага** — `components/pronunciation/pronunciation-check.tsx`: Web Speech API (`zh-CN`) хэрэглэгчийн хэлснийг таниад `lib/pronunciation/score.ts` ханз тус бүрээр (Levenshtein alignment) + пиньинь/хөг (`pinyin-pro`, lazy import) харьцуулна. Ногоон = зөв/омоним, шар = хөг зөрсөн, улаан = буруу/дутуу.
2. Холбосон газрууд: үгийн карт (VocabularyCard), 课文 мөр бүр (LiveTextReader), яриа мөр бүр (DialoguesModule), бичлэг (desktop «Дуудлага шалгах» чип, mobile 🎤 товч).
3. Оноо: 80%+ → `awardPoints("game", "speak:<текст>:<өдөр>", 10/15/20)` — SQL өөрчлөлт хэрэггүй (`lib/pronunciation/award.ts`).
4. Дэмжлэг: Chrome (PC/Android), iOS Safari. Firefox, WeChat/Facebook доторх хөтөч → ээлтэй мессеж, товч нуугдана. Гадны API түлхүүр хэрэггүй.
5. **Ярилцах** — `/talk` хуудас, 7 сценар (`content/talk-scenarios/*.json`: дэлгүүр, байр, гуанз, такси, эмнэлэг, бүртгэл, багш; HSK1–3), сценар бүр 9–14 node, 3 сонголт, салаалсан.
6. `AI_API_KEY` байхгүй (одоогийн байдал) → **скрипт горим**: сонголт дарах эсвэл микрофоноор хэлэх (хамгийн ойр сонголтыг таана).
7. `AI_API_KEY` тохируулбал → **AI горим**: `app/api/talk/route.ts` (нэвтэрсэн хэрэглэгч, минутад 20 хүсэлт) → `lib/ai/chat-provider.ts` (OpenAI-compatible; `AI_BASE_URL`, `AI_MODEL` — DeepSeek ч болно). AI хариу JSON: `{zh, pinyin, mn, correction, done}`.
8. UI: чат, AI реплик дээр 🔊 (төхөөрөмжийн TTS), пиньинь/орчуулга харуулах/нуух (localStorage), зөөлөн засвар ✏️.
9. Дуусахад: оноо `game`/`talk:<id>:<өдөр>` (10 + 2×алхам, ≤30), сценарын шинэ үгсийг «Миний үгс»-д хадгалах (`saveLessonWordsBatch`).
10. Навигаци: /review «Ярилцах» карт, нүүрний жижиг блок, хичээлийн Дүгнэлт дэх «Ярилцъя» (түвшинд тохирсон сценар). Шинэ сценар нэмэх: JSON бичээд `lib/talk/scenarios.ts`-д import.
