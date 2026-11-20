# HSK 3.0 全真模拟 — extract spec (one test per run)

Working dir: `/home/claude/work/m30`. Everything here is a scanned book (no text layer).
You get: page images (110 dpi) `src/L<n>/<pdf>_pages/p-NN.png`, OCR text (tesseract, ERROR-PRONE — treat as a hint only)
`src/L<n>/<pdf>_pages/hi-NN.txt` (per page) and `src/L<n>/<pdf>.ocr.txt` (whole file), the listening script OCR
`src/L<n>/scriptK.ocr.txt`, the answer key OCR `src/L<n>/ans_*.ocr.txt` (L5/L6 keys are JPGs `src/L<n>/ans_*参考答案.jpg` — Read the image),
and, from level 3 up, the official answer explanations `ans_*答案解析.ocr.txt`.

**The page image is the source of truth.** Read EVERY page of the test with the Read tool and transcribe the questions from the image;
use OCR text only to speed up typing. Chinese must be exact (no OCR garbage like `la]`, `WAIL`). Check every answer against the key.

## Output: `out/<TID>/extract.json`

```json
{
  "test_id": "M32601",            // M + level digit + "26" + serial (01, 02 …). Level 7–9 uses level digit 7.
  "hsk_level": 3,
  "title": "HSK 3 · HSK 3.0 全真模拟 · Загвар шалгалт №1",
  "total_questions": 70,
  "time_limit_min": 0,            // leave 0 — computed later from sections
  "sections": [
    {"skill":"listening","time_min":23,"parts":[{"part":1,"range":[1,10],"q_type":"match","desc":"Яриа ↔ зураг"}, …]},
    {"skill":"reading","time_min":30,"parts":[…]},
    {"skill":"writing","time_min":20,"parts":[…]}
  ],
  "questions": [
    {
      "q_no": 1, "skill": "listening", "part": 1, "q_type": "match",
      "stem": "Сонсоод тохирох зургийг сонго:",
      "options": [{"key":"A","image":"img/q01A.webp"},{"key":"B","image":"img/q01B.webp"},{"key":"C","image":"img/q01C.webp"}],
      "correct_answer": "B",
      "autograde": "auto",         // auto | strict (exact text) | manual (essay etc.)
      "points": 1,
      "script": [{"spk":"女","zh":"请坐！"},{"spk":"男","zh":"谢谢！"}],   // listening only: exactly what the recording says, from the 听力文本 (verified against page image of the script)
      "question_zh": "说话人下午去哪里？",   // listening only, if the recording asks a question (问：…); else omit
      "page": 8                     // page number in the PDF where the question is printed
    }
  ]
}
```

Take the exam structure (parts, question ranges, minutes) from the test's own 考试结构 page (the page right after the
答题卡). Section `time_min`: use the book's minutes for listening (约 N 分钟 → N) / reading / writing.

### q_type → how to fill (the app only renders these)
- `choice` — options `[{"key":"A","text":"…"},…]` (A–C or A–D). stem = question text printed on paper (for listening with nothing printed: stem `""`).
  Reading passage + question: stem = `"<passage>\n★ <question>"` (one passage shared by several questions → repeat the passage in each).
- `match` — options are the shared pool (A–F) for the part, each question repeats the full pool; stem = the item text (or the Mongolian prompt for picture items). Picture options use `"image"` (relative path) instead of `"text"`.
  Image-choice listening items (pick the picture): also `match`, 3 picture options, stem `"Сонсоод тохирох зургийг сонго:"`.
- `judge` — √/× items; stem = the printed statement, correct_answer `"√"` or `"×"`.
- `fill_word` — 选词填空: options = the word pool A–F of the part (repeat in every question), stem = sentence with `（     ）` kept, correct_answer = key letter.
- `fill_char` — write the hanzi for a pinyin: stem `"Пиньинь [xué] — тохирох ханзыг бич: 我在___校。"`, correct_answer = the character(s), autograde `strict`.
- `complete` — 连词成句 (arrange words): stem `"Үгсийг эрэмбэлж зөв өгүүлбэр зохио: 很 / 我 / 高兴"` (tokens separated by ` / `, in printed order), correct_answer = the full correct sentence, autograde `strict`.
- Paragraph ordering 排序 (one group of 5 paragraphs = 5 questions, one per position): use `q_type` **`order`** on EVERY question of the group with options A–E = the full paragraph texts (same in each question), `"position": 1..5`, `"position_answer": "B"` (the key's letter for that position) and `correct_answer` = the whole sequence (e.g. `"BAEDC"`); stem = the printed instruction. The build step converts this into per-position choice questions automatically.
- `picture_sentence` — write a sentence from a word/picture: stem = Mongolian instruction + the given word; correct_answer = a model answer; autograde `manual`.
- `essay`, `essay_picture` — longer writing / chart description / translation; stem = full prompt (Chinese prompt kept verbatim, add one Mongolian line of instruction), correct_answer = model answer from the book's 范文 if printed (else null), autograde `manual`. If the prompt needs a picture/chart, crop it to `img/` and set `"image": "img/q88.webp"` on the question (top-level, not in options).
- Short-answer reading questions (HSK 7–9 阅读 part 3 "回答问题", answer ≤10 chars) → `essay`, autograde `manual`, correct_answer = model answer from the key.
- Fill-in listening items (HSK 7–9 听力 "填空") → `fill_char`, autograde `strict`, correct_answer = the key's text.
- Anything not covered → use the closest type above and add `"note": "…"` on the question.

stem language: Chinese content verbatim; Mongolian instruction prefixes exactly as given above (do not invent other Mongolian text).
Listening: every listening question MUST have `script` (lines in the order spoken) and, if asked, `question_zh`; if options are printed on paper include them in `options`; if the recording reads the options (e.g. "A… B… C…") put them in `options` too. Do NOT include the "例如" examples.
For a listening passage with several questions, each question gets the full passage in `script` (same lines repeated) and its own `question_zh`.

### Pictures
When an item/option is a picture: run `python3 grid.py src/L<n>/<pdf>_pages/p-NN.png` → Read the `.grid.png` (coordinate rulers),
then `python3 crop.py src/L<n>/<pdf> <page> x0 y0 x1 y1 out/<TID>/img/q01A.webp` (coordinates in the gridded image space, exclude the option letter
and the cell borders). Read a couple of crops to verify they're right. Name files `q<NN><KEY>.webp` (option) or `q<NN>.webp` (question picture).
Never use the 例如 row.

### Workflow
1. Read the 考试结构 page → write `sections`. Read the answer key → list of correct answers.
2. Go part by part: Read the page image(s), write the questions. For listening, open the script OCR (and its page images when OCR is garbled) and attach `script` lines.
3. Save `out/<TID>/extract.json` (UTF-8). Run `python3 check_extract.py <TID>` and fix until it prints `OK`.
4. Report: question count, anything uncertain (list q_no + reason), and the structure.

Do not write Mongolian explanations — a later step does that. Do not modify files outside `out/<TID>/`.

## HSK 7–9 (M72601…M72605) specifics
Source: `src/L7/test1.pdf` holds 5 tests (第1套 pages 8–33, 第2套 34–59, 第3套 60–84, 第4套 85–110, 第5套 111–136); script `src/L7/script1.pdf` (第1套 pages 1–8, 第2套 9–17, 第3套 18–25, 第4套 26–33, 第5套 34–41; each has 一、听力文本 then 五、口语文本 — ignore 口语); answer key `src/L7/ans_HSK七—九级全真模拟题集(参考答案）.pdf` (5 pages per test: 1–5, 6–10, 11–15, 16–20, 21–25).
Import only the written exam: 听力 1–40, 阅读 41–87, 书写 88–89, 翻译 (笔译) 90–91. Skip 口语 (incl. oral translation) entirely. `hsk_level` = 7, total 91 questions.
- 听力 part 1 (1–10): `judge` (√/×), stem = printed statement; `script` = the news item (one item serves several questions — repeat it).
- 听力 parts 2–3 (11–22, 23–40): per the key some items are letters (→ `choice`, options printed on paper) and some are fill-ins (→ `fill_char`, autograde `strict`, stem = the printed sentence with `____`, correct_answer = key text). Each passage/lecture repeated in `script` for each of its questions, with `question_zh` where the recording asks one (the fill-in items are printed, so no question_zh needed).
- 阅读 part 1 (41–68): `choice`, stem = passage + `\n★ <question>` (4 passages × 7).
- 阅读 part 2 (69–73): sentence ordering with a pool A–G filling 5 gaps → `order` rule: options A–G (pool sentences), `position` 1..5, `position_answer`, correct_answer = the 5-letter sequence; stem = the passage with the gaps marked `（69）…（73）`.
- 阅读 part 3 (74–87): short answer → `essay`, autograde `manual`, stem = passage + `\n★ <question>`, correct_answer = key's model answer.
- 书写 88: `essay_picture` (chart/graph — crop to `img/q88.webp`, set `"image"`), 89: `essay`; 翻译 90–91: `essay` (stem = the printed source text + `Хятад хэл рүү орчуул:` prefix). correct_answer = 范文 from the key if printed, else null. All `manual`.
- Sections: listening (minutes from 考试结构), reading, writing (书写 + 翻译 together as the writing skill, parts 1–3).
