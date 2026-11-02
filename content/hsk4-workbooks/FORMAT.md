# HSK4 workbook.json формат (апп энэ бүтцийг л уншина — lib/lesson/build-exercise-questions.ts)
{
  "source": "HSK标准教程4上 练习册 第1课 + 教师用书 答案",
  "listening": { "parts": [
    { "instruction_mn": "Сонсоод ★ өгүүлбэр зөв (Үнэн) эсэх", "items": [
      { "n": 1, "statement_zh": "★他打算下午去银行。", "answer": "true", "script_zh": "我想去办个信用卡…", "explanation_mn": "Бичвэрт «陪我去一趟银行» — банк руу явах гэж байна → Үнэн." } ] },
    { "instruction_mn": "Сонсоод зөв хариуг сонго", "items": [
      { "n": 6, "question_zh": "男的是什么意思？", "options": {"A":"…","B":"…","C":"…","D":"…"}, "answer": "B", "script_zh": "…", "explanation_mn": "…" } ] }
  ]},
  "reading": {
    "select_word": [ { "bank": {"A":"自然","B":"缺点","C":"互相","D":"坚持","E":"生活"}, "items": [ { "n": 23, "q": "她每天都（　）走路上下班。", "answer": "D", "explanation_mn": "…" } ] } ],
    "ordering":   [ { "n": 31, "parts": {"A":"…","B":"…","C":"…"}, "answer": "BAC", "explanation_mn": "…" } ],
    "comprehension": [ { "n": 35, "passage_zh": "…", "q_zh": "★ 根据这段话，可以知道什么？", "options": {"A":"…","B":"…","C":"…","D":"…"}, "answer": "C", "explanation_mn": "…" } ]
  },
  "writing": { "instruction_mn": "Үгсийг зөв дарааллаар эвлүүлж өгүүлбэр болго", "items": [ { "n": 44, "words": ["他们俩","法律","学的是","都"], "answer": "他们俩学的都是法律。", "explanation_mn": "…" } ] }
}
Дүрэм: answer нь options/bank/parts-ийн ТҮЛХҮҮР (A/B/C…), statement-д "true"/"false". Жишээ (例) item-үүдийг ОРУУЛАХГҮЙ. n = номын дугаар. Бүх item-д explanation_mn заавал (1–2 өгүүлбэр, монголоор, яагаад зөв/бусад нь яагаад буруу). script_zh = transcript_zh яг хэвээр. Орос галиг хориотой (студент→оюутан, класс→анги, г.м.).
