Чи «Бөөндөө Сурцгаая» апп-ын HSK3 N-р хичээлийн `texts.json` файлыг бичнэ.

1. Эхлээд `/home/claude/hsk3build/INSTRUCTIONS-L0N.md`-г бүтнээр унш (баримт, дүрэм, файлын байршил бүгд тэнд; замууд `L0N/src/…`, `L0N/img/…`).
2. Загварыг унш: `/home/claude/hsk3build/ref/l01_texts.json` (1-р хичээлийн texts — БҮТЦИЙГ яг ийм байлга: unit, warmup, mainText, wordExplanation, collocations, wordComparison, textExercises, expansionVocabulary, applicationDiscussionOrWriting, shortTexts, commonSaying, lessonIntro, grammarNotes, culture, workbookListening/Reading/Writing/Review — бүх түлхүүр, дотоод бүтэц, төрөл ижил). Мөн `/home/claude/hsk3build/zip/texts.json` (2-р хичээлийн бэлэн болсон файл — сайн жишээ, гэхдээ текстийг нь хуулахгүй).
3. Эх сурвалж: `L0N/src/textbook_L0N.txt`, `L0N/src/teacher_L0N.txt` (багшийн номын заах алхам, дүрмийн задлан, нэмэлт жишээ — wordExplanation, grammarNotes, teacher_notes-д ашигла), `L0N/src/teacher_appendix_L0N.txt`, `L0N/src/workbook_L0N.txt`. OCR эвдэрсэн газрыг `L0N/img/*.png` зургуудыг Read-ээр харж шалга (拼音课文, дүрэм/дасгал, 汉字, дасгалын ном).

Хичээлийн бүтэц: mainText = 课文1 (audio/hsk3-textbook-0N01.mp3); shortTexts = 课文2, 3, 4 (0N02–0N04) — L01-ийн shortTexts бүтэцтэй (id, title, mongolianTitle, audioFile, sentences[zh,pinyin,mn,tokens,note,key_structures]); readAloud = 朗读 дасгал (0N05). Өгүүлбэр бүрт tokens (zh+py, хөгийн тэмдэгтэй, токенуудын нийлбэр = zh), mn орчуулга, note (монголоор), key_structures.
wordExplanation: багшийн номд онцолсон гол үгс (хамгийн багадаа 8) L01-ийн бүтцээр. wordComparison: багшийн номд байгаа харьцуулалт (хамгийн багадаа 2, байгаагаа л). workbookListening/Reading/Writing/Review-г L01-ийн бүтцээр бүтэн (50 асуулт + 复习), хариулт INSTRUCTIONS-ийн дагуу. culture: албан ёсны соёлын цэг байвал түүнийг, үгүй бол 俗语-ийн тухай; зохиомол баримт хэрэглэхгүй.

Дүрэм: монголоор, найрсаг багшийн хэлээр; пиньинь заавал хөгийн тэмдэгтэй; юу ч зохиохгүй — эх сурвалжид байгааг л; L01/L02-ийн текстийг хуулахгүй.

Гаралт: `/home/claude/hsk3build/L0N/zip/texts.json` (UTF-8, ensure_ascii=False, indent 1). Python-оор бичиж, json.load-оор баталгаажуул, ref/l01_texts.json-ийн дээд түвшний түлхүүрүүд бүгд байгаа эсэхийг шалга. Тайлан: файлын хэмжээ, өгүүлбэрийн тоо, wordExplanation тоо, эргэлзсэн зүйлс.
