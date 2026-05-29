import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..");

const META = {
  source: "draft",
  needsSourceAudit: true,
  sourceStatus: "needs_source_upload",
  sourceFileExpected: "Солонгос_Ном_PreLesson_Hangul_한글_Premium_Package.html",
  note: "Korean in chinese fields; romanization in pinyin. No HTML source in repo — draft from standard Hangul curriculum.",
};

function vocab(id, chinese, pinyin, mongolian, exampleChinese, exampleMongolian) {
  return {
    id,
    chinese,
    pinyin,
    mongolian,
    hskLevel: "KR1",
    exampleChinese,
    exampleMongolian,
  };
}

function sub(start, end, chinese, pinyin, mongolian) {
  return { start, end, chinese, pinyin, mongolian };
}

function mc(id, question, options, correctAnswer, explanation) {
  return { id, type: "multiple_choice", question, options, correctAnswer, explanation };
}

function cloze(id, question, options, correctAnswer, explanation) {
  return { id, type: "cloze", question, options, correctAnswer, explanation };
}

/** 3 recognition + 3 reading + 2 combining + 2 meaning */
function standardQuiz(prefix, recognition, reading, combining, meaning) {
  return [...recognition, ...reading, ...combining, ...meaning];
}

const pre01 = {
  _meta: META,
  lesson: {
    id: "k-pre-01",
    courseId: "korean-1",
    title: "PreLesson 01 — Үндсэн эгшиг",
    chineseTitle: "기본 모음",
    subtitle: "Солонгосын 6 үндсэн эгшиг — а, eo, o, u, eu, i",
    description:
      "ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ эгшгийг таних, унших, romanization-тай холбох. Эхний өдрийн хангылийн суурь.",
    duration: "10 min",
    status: "draft",
    orderIndex: 0,
    mediaStatus: "missing",
    sourceNote: "Korean Book 1 PreLesson 01 — audio pending.",
  },
  subtitles: [
    sub("00:00", "00:06", "기본 모음을 배웁시다.", "Gibon moeum-eul baeupsida.", "Үндсэн эгшгийг суръя."),
    sub("00:07", "00:14", "ㅏ, ㅓ, ㅗ, ㅜ, ㅡ, ㅣ", "a, eo, o, u, eu, i", "Зургаан үндсэн эгшиг."),
    sub("00:15", "00:22", "아, 어, 오, 우, 으, 이", "a, eo, o, u, eu, i", "Эгшиг дангаараа бичигдэх жишээ."),
    sub("00:23", "00:30", "ㅏ는 'a' 소리입니다.", "A-neun 'a' sori-imnida.", "ㅏ нь «а» авиатай."),
    sub("00:31", "00:38", "ㅓ는 'eo' 소리입니다. 몽골어 'ө'와 비슷합니다.", "Eo-neun 'eo' sori-imnida.", "ㅓ нь «eo» — монгол «ө»-тэй ойр."),
  ],
  vocabulary: [
    vocab("kr_p01_a", "ㅏ", "a", "эгшиг «а»", "아", "а"),
    vocab("kr_p01_eo", "ㅓ", "eo", "эгшиг «eo» — ө/о завсрын авиа", "어", "eo"),
    vocab("kr_p01_o", "ㅗ", "o", "эгшиг «о»", "오", "о"),
    vocab("kr_p01_u", "ㅜ", "u", "эгшиг «у»", "우", "у"),
    vocab("kr_p01_eu", "ㅡ", "eu", "эгшиг «eu» — ы/үгүй эгшигтэй төстэй", "으", "eu"),
    vocab("kr_p01_i", "ㅣ", "i", "эгшиг «и»", "이", "и"),
    vocab("kr_p01_ex_a", "아", "a", "эгшиг ㅏ-ийн жишээ", "아!", "а!"),
    vocab("kr_p01_ex_eo", "어", "eo", "эгшиг ㅓ-ийн жишээ", "어?", "eo?"),
    vocab("kr_p01_ex_o", "오", "o", "эгшиг ㅗ-ийн жишээ", "오!", "о!"),
    vocab("kr_p01_ex_u", "우", "u", "эгшиг ㅜ-ийн жишээ", "우리", "бид"),
    vocab("kr_p01_ex_eu", "으", "eu", "эгшиг ㅡ-ийн жишээ", "음", "хм"),
    vocab("kr_p01_ex_i", "이", "i", "эгшиг ㅣ-ийн жишээ", "이름", "нэр"),
  ],
  quizQuestions: standardQuiz(
    "p01",
    [
      mc("p01_r1", "「ㅏ」-ийн romanization аль вэ?", ["a", "o", "u", "i"], "a", "ㅏ → a"),
      mc("p01_r2", "「ㅓ」-ийн romanization аль вэ?", ["eo", "a", "o", "u"], "eo", "ㅓ → eo"),
      mc("p01_r3", "「ㅡ」-ийн romanization аль вэ?", ["eu", "u", "i", "a"], "eu", "ㅡ → eu"),
    ],
    [
      mc("p01_rd1", "「아」-ийг уншвал:", ["a", "o", "eo", "i"], "a", "아 = ㅏ эгшиг"),
      mc("p01_rd2", "「우」-ийг уншвал:", ["u", "o", "eu", "a"], "u", "우 = ㅜ эгшиг"),
      mc("p01_rd3", "「이」-ийг уншвал:", ["i", "eu", "a", "o"], "i", "이 = ㅣ эгшиг"),
    ],
    [
      mc("p01_c1", "Romanization «o» — аль Hangul эгшиг вэ?", ["ㅗ", "ㅜ", "ㅏ", "ㅣ"], "ㅗ", "o = ㅗ"),
      mc("p01_c2", "Romanization «u» — аль Hangul эгшиг вэ?", ["ㅜ", "ㅗ", "ㅡ", "ㅓ"], "ㅜ", "u = ㅜ"),
    ],
    [
      mc("p01_m1", "「ㅓ」-ийн монгол тайлбар хамгийн ойрхон:", ["ө/о завсрын авиа", "огтлол «а»", "«у» авиа", "«и» авиа"], "ө/о завсрын авиа", "ㅓ ≈ eo"),
      mc("p01_m2", "「ㅡ」-ийн монгол тайлбар:", ["ы/үгүй эгшигтэй төстэй", "«о» авиа", "«а» авиа", "«и» авиа"], "ы/үгүй эгшигтэй төстэй", "ㅡ = eu"),
    ],
  ),
};

const pre02 = {
  _meta: META,
  lesson: {
    id: "k-pre-02",
    courseId: "korean-1",
    title: "PreLesson 02 — Нэмэлт эгшиг",
    chineseTitle: "이중 모음과 야/여/요/유",
    subtitle: "Y-эгшиг ба нийлмэл эгшиг — ya, yeo, yo, yu, ae, e",
    description: "ㅑ ㅕ ㅛ ㅠ ㅐ ㅔ ㅒ ㅖ эгшгийг таних, унших, romanization-тай холбох.",
    duration: "12 min",
    status: "draft",
    orderIndex: 1,
    mediaStatus: "missing",
    sourceNote: "Korean Book 1 PreLesson 02 — audio pending.",
  },
  subtitles: [
    sub("00:00", "00:06", "이중 모음과 야/여/요/유를 배웁시다.", "Idong moeum-gwa ya/yeo/yo/yu-reul baeupsida.", "Y-эгшиг ба нийлмэл эгшгийг суръя."),
    sub("00:07", "00:14", "ㅑ ya, ㅕ yeo, ㅛ yo, ㅠ yu", "ya, yeo, yo, yu", "Дөрвөн Y-эгшиг."),
    sub("00:15", "00:22", "ㅐ ae, ㅔ e, ㅒ yae, ㅖ ye", "ae, e, yae, ye", "Дөрвөн нийлмэл эгшиг."),
    sub("00:23", "00:30", "야, 여, 요, 유", "ya, yeo, yo, yu", "Y-эгшгийн жишээ үе."),
    sub("00:31", "00:38", "애, 에, 얘, 예", "ae, e, yae, ye", "Нийлмэл эгшгийн жишээ."),
  ],
  vocabulary: [
    vocab("kr_p02_ya", "ㅑ", "ya", "эгшиг «ya»", "야", "ya"),
    vocab("kr_p02_yeo", "ㅕ", "yeo", "эгшиг «yeo»", "여", "yeo"),
    vocab("kr_p02_yo", "ㅛ", "yo", "эгшиг «yo»", "요", "yo"),
    vocab("kr_p02_yu", "ㅠ", "yu", "эгшиг «yu»", "유", "yu"),
    vocab("kr_p02_ae", "ㅐ", "ae", "эгшиг «ae»", "애", "ae"),
    vocab("kr_p02_e", "ㅔ", "e", "эгшиг «e»", "에", "e"),
    vocab("kr_p02_yae", "ㅒ", "yae", "эгшиг «yae»", "얘", "yae"),
    vocab("kr_p02_ye", "ㅖ", "ye", "эгшиг «ye»", "예", "ye"),
    vocab("kr_p02_ex_ya", "야", "ya", "ㅑ + ㅇ = ya", "야!", "ya!"),
    vocab("kr_p02_ex_yeo", "여", "yeo", "ㅕ + ㅇ = yeo", "여기", "энд"),
    vocab("kr_p02_ex_yo", "요", "yo", "ㅛ + ㅇ = yo", "오늘", "өнөөдөр"),
    vocab("kr_p02_ex_yu", "유", "yu", "ㅠ + ㅇ = yu", "유학", "гадуур суралцах"),
    vocab("kr_p02_ex_ae", "애", "ae", "ㅐ + ㅇ = ae", "애", "хүүхэд"),
    vocab("kr_p02_ex_e", "에", "e", "ㅔ + ㅇ = e", "에", "-д/-т"),
  ],
  quizQuestions: standardQuiz(
    "p02",
    [
      mc("p02_r1", "「ㅑ」-ийн romanization:", ["ya", "yeo", "yo", "a"], "ya", "ㅑ → ya"),
      mc("p02_r2", "「ㅛ」-ийн romanization:", ["yo", "yu", "o", "yeo"], "yo", "ㅛ → yo"),
      mc("p02_r3", "「ㅔ」-ийн romanization:", ["e", "ae", "ye", "eo"], "e", "ㅔ → e"),
    ],
    [
      mc("p02_rd1", "「여」-ийг уншвал:", ["yeo", "yo", "ya", "yu"], "yeo", "여 = ㅕ"),
      mc("p02_rd2", "「요」-ийг уншвал:", ["yo", "yeo", "yu", "ya"], "yo", "요 = ㅛ"),
      mc("p02_rd3", "「예」-ийг уншвал:", ["ye", "yae", "e", "ae"], "ye", "예 = ㅖ"),
    ],
    [
      mc("p02_c1", "Romanization «yu» — аль эгшиг?", ["ㅠ", "ㅜ", "ㅛ", "ㅕ"], "ㅠ", "yu = ㅠ"),
      mc("p02_c2", "Romanization «ae» — аль эгшиг?", ["ㅐ", "ㅔ", "ㅒ", "ㅖ"], "ㅐ", "ae = ㅐ"),
    ],
    [
      mc("p02_m1", "「ㅕ」-ийн утга хамгийн ойрхон romanization:", ["yeo", "yo", "ya", "eo"], "yeo", "ㅕ = yeo"),
      mc("p02_m2", "「ㅒ」 бол 「ㅐ」-ийн Y хувилбар. Romanization:", ["yae", "ye", "ae", "e"], "yae", "ㅒ → yae"),
    ],
  ),
};

const pre03 = {
  _meta: META,
  lesson: {
    id: "k-pre-03",
    courseId: "korean-1",
    title: "PreLesson 03 — Үндсэн гийгүүлэгч",
    chineseTitle: "기본 자음",
    subtitle: "10 үндсэн гийгүүлэгч — ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅎ",
    description: "Үндсэн гийгүүлэгчийг таних, үеэ унших (가 나 다 라 마 바 사 아 자 하).",
    duration: "15 min",
    status: "draft",
    orderIndex: 2,
    mediaStatus: "missing",
    sourceNote: "Korean Book 1 PreLesson 03 — audio pending.",
  },
  subtitles: [
    sub("00:00", "00:06", "기본 자음을 배웁시다.", "Gibon jaeum-eul baeupsida.", "Үндсэн гийгүүлэгчийг суръя."),
    sub("00:07", "00:14", "ㄱ g/k, ㄴ n, ㄷ d/t, ㄹ r/l", "g/k, n, d/t, r/l", "Эхний дөрвөн гийгүүлэгч."),
    sub("00:15", "00:22", "ㅁ m, ㅂ b/p, ㅅ s, ㅇ ng/-", "m, b/p, s, ng/-", "Дараагийн дөрвөн."),
    sub("00:23", "00:30", "ㅈ j, ㅎ h", "j, h", "ㅈ, ㅎ."),
    sub("00:31", "00:38", "가, 나, 다, 라, 마, 바, 사, 아, 자, 하", "ga, na, da, ra, ma, ba, sa, a, ja, ha", "Гийгүүлэгч + ㅏ = үе."),
  ],
  vocabulary: [
    vocab("kr_p03_g", "ㄱ", "g/k", "гийгүүлэгч «г/к»", "가", "ga"),
    vocab("kr_p03_n", "ㄴ", "n", "гийгүүлэгч «н»", "나", "na"),
    vocab("kr_p03_d", "ㄷ", "d/t", "гийгүүлэгч «д/т»", "다", "da"),
    vocab("kr_p03_r", "ㄹ", "r/l", "гийгүүлэгч «р/л»", "라", "ra"),
    vocab("kr_p03_m", "ㅁ", "m", "гийгүүлэгч «м»", "마", "ma"),
    vocab("kr_p03_b", "ㅂ", "b/p", "гийгүүлэгч «б/п»", "바", "ba"),
    vocab("kr_p03_s", "ㅅ", "s", "гийгүүлэгч «с»", "사", "sa"),
    vocab("kr_p03_ng", "ㅇ", "ng/-", "гийгүүлэгч «нг» эсвэл эхний дутuu", "아", "a (ㅇ+ㅏ)"),
    vocab("kr_p03_j", "ㅈ", "j", "гийгүүлэгч «ж»", "자", "ja"),
    vocab("kr_p03_h", "ㅎ", "h", "гийгүүлэгч «х»", "하", "ha"),
    vocab("kr_p03_ga", "가", "ga", "ㄱ + ㅏ", "가방", "цүнх"),
    vocab("kr_p03_na", "나", "na", "ㄴ + ㅏ", "나라", "улс"),
    vocab("kr_p03_da", "다", "da", "ㄷ + ㅏ", "다리", "хөл"),
    vocab("kr_p03_ba", "바", "ba", "ㅂ + ㅏ", "바다", "далай"),
    vocab("kr_p03_sa", "사", "sa", "ㅅ + ㅏ", "사람", "хүн"),
    vocab("kr_p03_ja", "자", "ja", "ㅈ + ㅏ", "자동차", "машин"),
  ],
  quizQuestions: standardQuiz(
    "p03",
    [
      mc("p03_r1", "「ㄱ」-ийн romanization:", ["g/k", "n", "d/t", "s"], "g/k", "ㄱ → g/k"),
      mc("p03_r2", "「ㅅ」-ийн romanization:", ["s", "j", "h", "m"], "s", "ㅅ → s"),
      mc("p03_r3", "「ㅇ」 үеийн эхэнд:", ["дуугүй (дутuu)", "х", "н", "м"], "дуугүй (дутuu)", "ㅇ эхэнд = silent"),
    ],
    [
      mc("p03_rd1", "「가」-ийг уншвал:", ["ga", "na", "da", "ba"], "ga", "가 = ㄱ+ㅏ"),
      mc("p03_rd2", "「사」-ийг уншвал:", ["sa", "ja", "ha", "ma"], "sa", "사 = ㅅ+ㅏ"),
      mc("p03_rd3", "「하」-ийг уншвал:", ["ha", "ga", "ja", "ba"], "ha", "하 = ㅎ+ㅏ"),
    ],
    [
      mc("p03_c1", "「ㄴ + ㅏ」 = ?", ["나", "다", "라", "마"], "나", "ㄴ+ㅏ=나"),
      mc("p03_c2", "「ㅂ + ㅏ」 = ?", ["바", "파", "사", "마"], "바", "ㅂ+ㅏ=바"),
    ],
    [
      mc("p03_m1", "「ㄹ」-ийн romanization:", ["r/l", "n", "g/k", "d/t"], "r/l", "ㄹ → r/l"),
      mc("p03_m2", "「ㅈ」-ийн romanization:", ["j", "ch", "s", "h"], "j", "ㅈ → j"),
    ],
  ),
};

const pre04 = {
  _meta: META,
  lesson: {
    id: "k-pre-04",
    courseId: "korean-1",
    title: "PreLesson 04 — Хүчтэй ба амьсгалтай гийгүүлэгч",
    chineseTitle: "쌍자음과 격음",
    subtitle: "ㄲ ㄸ ㅃ ㅆ ㅉ ба ㅋ ㅌ ㅍ ㅊ",
    description: "Хүчтэй (쌍자음) болон амьсгалтай (격음) гийгүүлэгчийг таних, унших.",
    duration: "12 min",
    status: "draft",
    orderIndex: 3,
    mediaStatus: "missing",
    sourceNote: "Korean Book 1 PreLesson 04 — audio pending.",
  },
  subtitles: [
    sub("00:00", "00:06", "쌍자음과 격음을 배웁시다.", "Ssangjaeum-gwa gyeogeum-eul baeupsida.", "Хүчтэй ба амьсгалтай гийгүүлэгч."),
    sub("00:07", "00:14", "ㅋ ㅌ ㅍ ㅊ — 격음 (амьсгалтай)", "k, t, p, ch", "Амьсгалтай: ㅋ ㅌ ㅍ ㅊ"),
    sub("00:15", "00:22", "ㄲ ㄸ ㅃ ㅆ ㅉ — 쌍자음 (хүчтэй)", "kk, tt, pp, ss, jj", "Хүчтэй: ㄲ ㄸ ㅃ ㅆ ㅉ"),
    sub("00:23", "00:30", "카, 타, 파, 차", "ka, ta, pa, cha", "Амьсгалтай жишээ."),
    sub("00:31", "00:38", "까, 따, 빠, 싸, 짜", "kka, tta, ppa, ssa, jja", "Хүчтэй жишээ."),
  ],
  vocabulary: [
    vocab("kr_p04_k", "ㅋ", "k", "амьсгалтай «к»", "카", "ka"),
    vocab("kr_p04_t", "ㅌ", "t", "амьсгалтай «т»", "타", "ta"),
    vocab("kr_p04_p", "ㅍ", "p", "амьсгалтай «п»", "파", "pa"),
    vocab("kr_p04_ch", "ㅊ", "ch", "амьсгалтай «ч»", "차", "cha"),
    vocab("kr_p04_kk", "ㄲ", "kk", "хүчтэй «кк»", "까", "kka"),
    vocab("kr_p04_tt", "ㄸ", "tt", "хүчтэй «тт»", "따", "tta"),
    vocab("kr_p04_pp", "ㅃ", "pp", "хүчтэй «пп»", "빠", "ppa"),
    vocab("kr_p04_ss", "ㅆ", "ss", "хүчтэй «сс»", "싸", "ssa"),
    vocab("kr_p04_jj", "ㅉ", "jj", "хүчтэй «жж»", "짜", "jja"),
    vocab("kr_p04_ka", "카", "ka", "ㅋ + ㅏ", "커피", "кофе"),
    vocab("kr_p04_cha", "차", "cha", "ㅊ + ㅏ", "차", "цай"),
    vocab("kr_p04_kka", "까", "kka", "ㄲ + ㅏ", "까만", "хар"),
    vocab("kr_p04_ssa", "싸", "ssa", "ㅆ + ㅏ", "싸다", "хямд"),
  ],
  quizQuestions: standardQuiz(
    "p04",
    [
      mc("p04_r1", "「ㅋ」-ийн romanization:", ["k", "g", "kk", "ch"], "k", "ㅋ → k (aspirated)"),
      mc("p04_r2", "「ㄲ」-ийн romanization:", ["kk", "k", "g", "t"], "kk", "ㄲ → kk (tense)"),
      mc("p04_r3", "「ㅊ」-ийн romanization:", ["ch", "j", "s", "k"], "ch", "ㅊ → ch"),
    ],
    [
      mc("p04_rd1", "「파」-ийг уншвал:", ["pa", "ba", "ppa", "ha"], "pa", "파 = ㅍ+ㅏ"),
      mc("p04_rd2", "「짜」-ийг уншвал:", ["jja", "ja", "cha", "ssa"], "jja", "짜 = ㅉ+ㅏ"),
      mc("p04_rd3", "「싸」-ийг уншвал:", ["ssa", "sa", "cha", "ta"], "ssa", "싸 = ㅆ+ㅏ"),
    ],
    [
      mc("p04_c1", "Амьсгалтай «t» — аль үсэг?", ["ㅌ", "ㄷ", "ㄸ", "ㅅ"], "ㅌ", "ㅌ = aspirated t"),
      mc("p04_c2", "Хүчтэй «pp» — аль үсэг?", ["ㅃ", "ㅂ", "ㅍ", "ㅁ"], "ㅃ", "ㅃ = tense p"),
    ],
    [
      mc("p04_m1", "「쌍자음」 гэдэг нь:", ["хүчтэй гийгүүлэгч", "амьсгалтай", "эгшиг", "батчим"], "хүчтэй гийгүүлэгч", "쌍자음 = double consonant"),
      mc("p04_m2", "「격음」 гэдэг нь:", ["амьсгалтай гийгүүлэгч", "хүчтэй", "эгшиг", "үе"], "амьсгалтай гийгүүлэгч", "격음 = aspirated"),
    ],
  ),
};

const pre05 = {
  _meta: META,
  lesson: {
    id: "k-pre-05",
    courseId: "korean-1",
    title: "PreLesson 05 — Үе бүтээх",
    chineseTitle: "음절 만들기",
    subtitle: "Гийгүүлэгч + эгшиг = үе (가 나 다 무 바 …)",
    description:
      "Солонгос үсэг дангаараа биш, ихэвчлэн үеэр бичигддэг. Гийгүүлэгч + эгшиг хослолыг бүтээж, унш.",
    duration: "15 min",
    status: "draft",
    orderIndex: 4,
    mediaStatus: "missing",
    sourceNote: "Korean Book 1 PreLesson 05 — audio pending.",
  },
  subtitles: [
    sub("00:00", "00:08", "한국어는 음절로 씁니다.", "Hangugeo-neun eumjeol-lo sseumnida.", "Солонгос хэл үеээр бичигддэг."),
    sub("00:09", "00:16", "자음 + 모음 = 음절", "Jaeum + moeum = eumjeol", "Гийгүүлэгч + эгшиг = үе."),
    sub("00:17", "00:24", "ㄱ + ㅏ = 가", "g + a = ga", "ㄱ + ㅏ = 가"),
    sub("00:25", "00:32", "ㄴ + ㅏ = 나, ㄷ + ㅏ = 다", "n + a = na, d + a = da", "나, 다 үе."),
    sub("00:33", "00:40", "ㅁ + ㅜ = 무, ㅂ + ㅏ = 바", "m + u = mu, b + a = ba", "무, 바 үе."),
  ],
  vocabulary: [
    vocab("kr_p05_rule", "음절", "eumjeol", "үе — гийгүүлэгч + эгшигийн багц", "한 음절", "нэг үе"),
    vocab("kr_p05_ga", "가", "ga", "ㄱ + ㅏ", "가방", "цүнх"),
    vocab("kr_p05_na", "나", "na", "ㄴ + ㅏ", "나라", "улс"),
    vocab("kr_p05_da", "다", "da", "ㄷ + ㅏ", "다리", "хөл"),
    vocab("kr_p05_mu", "무", "mu", "ㅁ + ㅜ", "무엇", "юу"),
    vocab("kr_p05_ba", "바", "ba", "ㅂ + ㅏ", "바다", "далай"),
    vocab("kr_p05_go", "고", "go", "ㄱ + ㅗ", "고기", "мах"),
    vocab("kr_p05_no", "노", "no", "ㄴ + ㅗ", "노래", "дуу"),
    vocab("kr_p05_du", "두", "du", "ㄷ + ㅜ", "두", "хоёр"),
    vocab("kr_p05_su", "수", "su", "ㅅ + ㅜ", "수", "ус/тоо"),
    vocab("kr_p05_ha", "하", "ha", "ㅎ + ㅏ", "하다", "хийх"),
    vocab("kr_p05_ji", "지", "ji", "ㅈ + ㅣ", "지금", "одоо"),
    vocab("kr_p05_mi", "미", "mi", "ㅁ + ㅣ", "미", "америк/үгүй"),
    vocab("kr_p05_bi", "비", "bi", "ㅂ + ㅣ", "비", "бороо"),
    vocab("kr_p05_si", "시", "si", "ㅅ + ㅣ", "시", "цаг/хот"),
  ],
  quizQuestions: [
    ...standardQuiz(
      "p05",
      [
        mc("p05_r1", "「음절」 гэдэг нь:", ["үе (CV багц)", "эгшиг", "асуулт", "орчуулга"], "үе (CV багц)", "음절 = syllable"),
        mc("p05_r2", "「가」-ийг бүтээх:", ["ㄱ + ㅏ", "ㄴ + ㅏ", "ㄱ + ㅗ", "ㅁ + ㅏ"], "ㄱ + ㅏ", "가 = ㄱ+ㅏ"),
        mc("p05_r3", "「무」-ийг бүтээх:", ["ㅁ + ㅜ", "ㅂ + ㅜ", "ㅁ + ㅡ", "ㄴ + ㅜ"], "ㅁ + ㅜ", "무 = ㅁ+ㅜ"),
      ],
      [
        mc("p05_rd1", "「바」-ийг уншвал:", ["ba", "pa", "ma", "da"], "ba", "바 = ㅂ+ㅏ"),
        mc("p05_rd2", "「수」-ийг уншвал:", ["su", "si", "so", "sa"], "su", "수 = ㅅ+ㅜ"),
        mc("p05_rd3", "「지」-ийг уншвал:", ["ji", "gi", "hi", "bi"], "ji", "지 = ㅈ+ㅣ"),
      ],
      [
        mc("p05_c1", "「ㄷ + ㅏ」 = ?", ["다", "나", "라", "가"], "다", "ㄷ+ㅏ=다"),
        mc("p05_c2", "「ㅎ + ㅏ」 = ?", ["하", "가", "바", "자"], "하", "ㅎ+ㅏ=하"),
      ],
      [
        mc("p05_m1", "Солонгос үсэг ихэвчлэн:", ["үеэр бичигддэг", "дангаараа", "латин үсгээр", "зурагтай"], "үеэр бичигддэг", "CV syllable blocks"),
        mc("p05_m2", "「고」 = ㄱ + ?", ["ㅗ", "ㅏ", "ㅜ", "ㅣ"], "ㅗ", "고 = ㄱ+ㅗ"),
      ],
    ),
    mc("p05_x1", "「비」-ийг бүтээх:", ["ㅂ + ㅣ", "ㅍ + ㅣ", "ㅁ + ㅣ", "ㅅ + ㅣ"], "ㅂ + ㅣ", "비 = ㅂ+ㅣ"),
    cloze("p05_x2", "ㄴ + ㅗ = ____", ["노", "나", "누", "너"], "노", "ㄴ+ㅗ=노"),
  ],
};

const pre06 = {
  _meta: META,
  lesson: {
    id: "k-pre-06",
    courseId: "korean-1",
    title: "PreLesson 06 — 받침",
    chineseTitle: "받침",
    subtitle: "Төгсгөлийн гийгүүлэгч — 한국, 몽골, 밥, 물, 집 …",
    description: "받침 гэдэг нь үеийн доор байрлах төгсгөлийн гийгүүлэгч юм. Үг унших дасгал.",
    duration: "15 min",
    status: "draft",
    orderIndex: 5,
    mediaStatus: "missing",
    sourceNote: "Korean Book 1 PreLesson 06 — audio pending.",
  },
  subtitles: [
    sub("00:00", "00:08", "받침은 음절 아래 자음입니다.", "Batchim-eun eumjeol arae jaeum-imnida.", "받침 = үеийн доод гийгүүлэгч."),
    sub("00:09", "00:16", "한국, 몽골", "Hanguk, Monggol", "한국, 몽골 — батчимтай үг."),
    sub("00:17", "00:24", "밥, 물, 집", "Bap, mul, jip", "밥 (хоол), 물 (ус), 집 (байр)."),
    sub("00:25", "00:32", "일, 손, 문", "Il, son, mun", "일 (нэг/ажил), 손 (гар), 문 (хаалга)."),
    sub("00:33", "00:40", "받침이 있으면 끝소리가 달라집니다.", "Batchim-i isseumyeon kkeut-sori-ga dallajimnida.", "Батчимтай үеийн төгсгөл өөр сонсогдоно."),
  ],
  vocabulary: [
    vocab("kr_p06_batchim", "받침", "batchim", "төгсгөлийн гийгүүлэгч (үеийн доор)", "받침이 있어요.", "Батчимтай байна."),
    vocab("kr_p06_hanguk", "한국", "hanguk", "Солонгос (улс/хэл)", "한국 사람", "солонгос хүн"),
    vocab("kr_p06_monggol", "몽골", "monggol", "Монгол", "몽골 사람", "монгол хүн"),
    vocab("kr_p06_bap", "밥", "bap", "хоол / будаа", "밥을 먹어요.", "Хоол идье."),
    vocab("kr_p06_mul", "물", "mul", "ус", "물을 마셔요.", "Ус уу."),
    vocab("kr_p06_jip", "집", "jip", "байр, гэр", "집에 가요.", "Гэртээ явъя."),
    vocab("kr_p06_il", "일", "il", "нэг / ажил", "일을 해요.", "Ажил хий."),
    vocab("kr_p06_son", "손", "son", "гар", "손을 씻어요.", "Гараа уга."),
    vocab("kr_p06_mun", "문", "mun", "хаалга", "문을 열어요.", "Хаалга нээ."),
    vocab("kr_p06_han", "한", "han", "нэг / солонгос (한)", "한국", "Солонгос"),
    vocab("kr_p06_guk", "국", "guk", "улс", "한국", "Солонгос"),
    vocab("kr_p06_gol", "골", "gol", "гол (몽골)", "몽골", "Монгол"),
  ],
  quizQuestions: [
    ...standardQuiz(
      "p06",
      [
        mc("p06_r1", "「받침」 гэдэг нь:", ["үеийн доод гийгүүлэгч", "эгшиг", "эхний гийгүүлэгч", "асуулт"], "үеийн доод гийгүүлэгч", "받침 = final consonant"),
        mc("p06_r2", "「한국」-д батчимтай үе:", ["한, 국", "없음", "한만", "국만"], "한, 국", "한(ㄴ), 국(ㄱ)"),
        mc("p06_r3", "「물」-ийн батчим:", ["ㄹ", "ㄴ", "ㅁ", "ㅂ"], "ㄹ", "물 = ㅁ+ㅜ+ㄹ"),
      ],
      [
        mc("p06_rd1", "「밥」-ийг уншвал:", ["bap", "baba", "pap", "bal"], "bap", "밥 = bap"),
        mc("p06_rd2", "「집」-ийг уншвал:", ["jip", "jibe", "jib", "chip"], "jip", "집 = jip"),
        mc("p06_rd3", "「문」-ийг уншвал:", ["mun", "munh", "mon", "man"], "mun", "문 = mun"),
      ],
      [
        mc("p06_c1", "「몽골」 romanization:", ["monggol", "hanguk", "hakgyo", "saram"], "monggol", "몽골 = monggol"),
        mc("p06_c2", "Батчимтай үг сонго:", ["물", "아", "오", "야"], "물", "물 has batchim ㄹ"),
      ],
      [
        mc("p06_m1", "「물」-ийн утга:", ["ус", "хоол", "байр", "гар"], "ус", "물 = water"),
        mc("p06_m2", "「일」-ийн утга (энэ хичээлд):", ["нэг / ажил", "ус", "хаалга", "Солонгос"], "нэг / ажил", "일 = one/work"),
      ],
    ),
    mc("p06_x1", "「손」-ийн утга:", ["гар", "хөл", "ус", "хоол"], "гар", "손 = hand"),
    cloze("p06_x2", "한____ (Солонгос)", ["국", "글", "사", "교"], "국", "한국 = Korea"),
  ],
};

const pre07 = {
  _meta: META,
  lesson: {
    id: "k-pre-07",
    courseId: "korean-1",
    title: "PreLesson 07 — Унших дасгал",
    chineseTitle: "읽기 연습",
    subtitle: "가나다라, 한국, 학교, 사람 — унших дасгал",
    description: "Хангылийн бүх суурь мэдлэгийг ашиглан үг, мөр унших. Romanization болон монгол утга сонгох.",
    duration: "15 min",
    status: "draft",
    orderIndex: 6,
    mediaStatus: "missing",
    sourceNote: "Korean Book 1 PreLesson 07 — audio pending.",
  },
  subtitles: [
    sub("00:00", "00:08", "읽기 연습을 합니다.", "Ilgi yeonseup-eul hamnida.", "Унших дасгал хийе."),
    sub("00:09", "00:16", "가나다라 마바사", "ganadara mabasa", "Эхний мөрүүд."),
    sub("00:17", "00:24", "아자차카타파하", "ajachakata paha", "Гийгүүлэгчийн мөр."),
    sub("00:25", "00:32", "한국, 몽골, 사람, 학교", "Hanguk, Monggol, saram, hakgyo", "Эхний үгс."),
    sub("00:33", "00:40", "소리 내어 읽으세요.", "Sori naeeo ilgeuseyo.", "Дуугаар унш."),
  ],
  vocabulary: [
    vocab("kr_p07_ganadara", "가나다라", "ganadara", "унших мөр (ga na da ra)", "가나다라", "ga na da ra"),
    vocab("kr_p07_mabasa", "마바사", "mabasa", "унших мөр (ma ba sa)", "마바사", "ma ba sa"),
    vocab("kr_p07_ajacha", "아자차카타파하", "ajachakata paha", "гийгүүлэгчийн мөр", "아자차카", "a ja cha ka …"),
    vocab("kr_p07_hanguk", "한국", "hanguk", "Солонгос", "한국어", "солонгос хэл"),
    vocab("kr_p07_monggol", "몽골", "monggol", "Монгол", "몽골 사람", "монгол хүн"),
    vocab("kr_p07_saram", "사람", "saram", "хүн", "한 사람", "нэг хүн"),
    vocab("kr_p07_ireum", "이름", "ireum", "нэр", "이름이 뭐예요?", "Нэр хэн бэ?"),
    vocab("kr_p07_hakgyo", "학교", "hakgyo", "сургууль", "학교에 가요.", "Сургууль руу яв."),
    vocab("kr_p07_il", "일", "il", "нэг / ажил", "하루", "нэг өдөр"),
    vocab("kr_p07_mul", "물", "mul", "ус", "물 주세요.", "Ус өгнө үү."),
    vocab("kr_p07_bap", "밥", "bap", "хоол", "밥 먹었어요?", "Хоол идсэн үү?"),
    vocab("kr_p07_hangul", "한글", "hangeul", "хангыль", "한글을 배워요.", "Хангыль суръя."),
    vocab("kr_p07_annyeong", "안녕", "annyeong", "сайн уу (энгийн)", "안녕!", "Сайн уу!"),
    vocab("kr_p07_ne", "네", "ne", "тийм", "네, 맞아요.", "Тийм, зөв."),
    vocab("kr_p07_aniyo", "아니요", "aniyo", "үгүй", "아니요.", "Үгүй."),
  ],
  quizQuestions: [
    ...standardQuiz(
      "p07",
      [
        mc("p07_r1", "「가나다라」-ийн romanization:", ["ganadara", "mabasa", "hanguk", "hakgyo"], "ganadara", "Reading row"),
        mc("p07_r2", "「학교」-ийн romanization:", ["hakgyo", "hanguk", "saram", "ireum"], "hakgyo", "학교 = school"),
        mc("p07_r3", "「사람」-ийн romanization:", ["saram", "mul", "bap", "il"], "saram", "사람 = person"),
      ],
      [
        mc("p07_rd1", "「한국」-ийг унш:", ["hanguk", "monggol", "hakgyo", "hangeul"], "hanguk", "한국"),
        mc("p07_rd2", "「이름」-ийг унш:", ["ireum", "il", "mul", "bap"], "ireum", "이름"),
        mc("p07_rd3", "「아자차카타파하」 эхний үе:", ["아 (a)", "가 (ga)", "하 (ha)", "자 (ja)"], "아 (a)", "Starts with 아"),
      ],
      [
        mc("p07_c1", "「몽골」 = romanization?", ["monggol", "hanguk", "saram", "ne"], "monggol", "몽골"),
        mc("p07_c2", "「물」 = romanization?", ["mul", "bap", "il", "mun"], "mul", "물"),
      ],
      [
        mc("p07_m1", "「학교」-ийн утга:", ["сургууль", "Солонгос", "хүн", "ус"], "сургууль", "학교 = school"),
        mc("p07_m2", "「사람」-ийн утга:", ["хүн", "нэр", "хоол", "гар"], "хүн", "사람 = person"),
      ],
    ),
    mc("p07_x1", "「네」-ийн утга:", ["тийм", "үгүй", "сайн уу", "баяртай"], "тийм", "네 = yes"),
    cloze("p07_x2", "____을 배워요. (Хангыль суръя)", ["한글", "학교", "물", "밥"], "한글", "한글을 배워요"),
  ],
};

const pre08Quiz = [
  mc("p08_1", "「ㅏ」 romanization:", ["a", "o", "u", "i"], "a", "Basic vowel"),
  mc("p08_2", "「ㅓ」 romanization:", ["eo", "a", "e", "u"], "eo", "Basic vowel"),
  mc("p08_3", "「ㅑ」 romanization:", ["ya", "yeo", "yo", "a"], "ya", "Y vowel"),
  mc("p08_4", "「ㅔ」 romanization:", ["e", "ae", "ye", "eo"], "e", "Compound vowel"),
  mc("p08_5", "「ㄱ」 romanization:", ["g/k", "n", "d/t", "s"], "g/k", "Consonant"),
  mc("p08_6", "「ㅊ」 romanization:", ["ch", "j", "k", "s"], "ch", "Aspirated"),
  mc("p08_7", "「ㄲ」 romanization:", ["kk", "k", "g", "t"], "kk", "Tense"),
  mc("p08_8", "「가」 = ?", ["ㄱ + ㅏ", "ㄴ + ㅏ", "ㄱ + ㅗ", "ㅁ + ㅏ"], "ㄱ + ㅏ", "Syllable"),
  mc("p08_9", "「무」 = ?", ["ㅁ + ㅜ", "ㅂ + ㅜ", "ㅁ + ㅡ", "ㄴ + ㅜ"], "ㅁ + ㅜ", "Syllable"),
  mc("p08_10", "「바」-ийг унш:", ["ba", "pa", "ma", "da"], "ba", "Reading"),
  mc("p08_11", "「한국」 romanization:", ["hanguk", "monggol", "hakgyo", "hangeul"], "hanguk", "Word"),
  mc("p08_12", "「받침」 гэдэг нь:", ["үеийн доод гийгүүлэгч", "эгшиг", "асуулт", "орчуулга"], "үеийн доод гийгүүлэгч", "Batchim"),
  mc("p08_13", "「물」-ийн утга:", ["ус", "хоол", "байр", "гар"], "ус", "Meaning"),
  mc("p08_14", "「짜」-ийг унш:", ["jja", "ja", "cha", "ssa"], "jja", "Tense syllable"),
  mc("p08_15", "「파」-ийг унш:", ["pa", "ba", "ppa", "ha"], "pa", "Aspirated syllable"),
  mc("p08_16", "Romanization «yeo» — аль эгшиг?", ["ㅕ", "ㅓ", "ㅔ", "ㅑ"], "ㅕ", "Vowel match"),
  mc("p08_17", "「ㅇ」 эхэнд:", ["дуугүй", "н", "м", "х"], "дуугүй", "Initial ㅇ"),
  cloze("p08_18", "ㄷ + ㅏ = ____", ["다", "나", "라", "가"], "다", "Syllable build"),
  mc("p08_19", "「사람」-ийн утга:", ["хүн", "сургууль", "Солонгос", "нэр"], "хүн", "Meaning"),
  mc("p08_20", "「한글」-ийн утга:", ["солонгос үсэг, хангыль", "сургууль", "хүн", "ус"], "солонгос үсэг, хангыль", "Final review"),
];

const pre08 = {
  _meta: META,
  lesson: {
    id: "k-pre-08",
    courseId: "korean-1",
    title: "PreLesson 08 — 한글 Final Test",
    chineseTitle: "한글 종합 테스트",
    subtitle: "Хангылийн нэгтгэсэн шалгалт — эгшиг, гийгүүлэгч, үе, батчим",
    description: "PreLesson 01–07-ийн нэгтгэсэн шалгалт. 20 асуулт — vowels, consonants, syllables, batchim, reading.",
    duration: "20 min",
    status: "draft",
    orderIndex: 7,
    mediaStatus: "missing",
    sourceNote: "Korean Book 1 PreLesson 08 — final Hangul test, audio pending.",
  },
  subtitles: [
    sub("00:00", "00:08", "한글 종합 테스트입니다.", "Hangeul jonghap teseuteu-imnida.", "Хангылийн нэгтгэсэн шалгалт."),
    sub("00:09", "00:16", "모음, 자음, 음절, 받침을 확인합니다.", "Moeum, jaeum, eumjeol, batchim-eul hwaginhamnida.", "Эгшиг, гийгүүлэгч, үе, батчим шалгана."),
    sub("00:17", "00:24", "천천히 읽고 답하세요.", "Cheoncheonhi ilgo daphaseyo.", "Удаан уншаад хариул."),
  ],
  vocabulary: [
    vocab("kr_p08_hangeul", "한글", "hangeul", "хангыль (шалгалтын тойм)", "한글 테스트", "хангылийн шалгалт"),
    vocab("kr_p08_test", "테스트", "teseuteu", "шалгалт", "종합 테스트", "нэгтгэсэн шалгалт"),
  ],
  quizQuestions: pre08Quiz,
};

const files = [
  ["prelesson-01-vowels-basic.json", pre01],
  ["prelesson-02-vowels-y-compound.json", pre02],
  ["prelesson-03-consonants-basic.json", pre03],
  ["prelesson-04-consonants-strong-aspirated.json", pre04],
  ["prelesson-05-syllable-building.json", pre05],
  ["prelesson-06-batchim.json", pre06],
  ["prelesson-07-reading-practice.json", pre07],
  ["prelesson-08-final-test.json", pre08],
];

for (const [name, data] of files) {
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Wrote ${name} — vocab: ${data.vocabulary.length}, quiz: ${data.quizQuestions.length}`);
}
