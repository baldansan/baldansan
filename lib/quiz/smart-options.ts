import { shuffleArray } from "@/lib/games/game-data-core";
import type { QuizQuestion, VocabularyWord } from "@/types/lesson";

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizOptionCategory =
  | "hangul_vowel_romanization"
  | "hangul_vowel_char"
  | "hangul_vowel_mongolian"
  | "hangul_consonant_char"
  | "hangul_consonant_romanization"
  | "hangul_syllable_romanization"
  | "profession"
  | "country"
  | "language"
  | "grammar_sentence"
  | "particle"
  | "copula"
  | "greeting_phrase"
  | "vocabulary_mongolian"
  | "vocabulary_korean"
  | "cloze_korean"
  | "cloze_chinese"
  | "vocabulary_chinese"
  | "true_false"
  | "unknown";

/** Mongolian / boolean labels reserved for true–false items only. */
const TRUE_FALSE_LABELS_NORMALIZED = new Set([
  "үнэн",
  "худал",
  "буруу",
  "зөв",
  "true",
  "false",
  "t",
  "f",
  "yes",
  "no",
]);

const HAN_SCRIPT_REGEX = /[\u4e00-\u9fff]/;

const ROMANIZATION_VOWELS = [
  "a",
  "eo",
  "o",
  "u",
  "eu",
  "i",
  "ae",
  "e",
  "ya",
  "yeo",
  "yo",
  "yu",
  "yae",
  "ye",
] as const;

const ROMANIZATION_CONFUSIONS: Record<string, string[]> = {
  a: ["o", "u", "eo", "i"],
  eo: ["o", "u", "eu", "a"],
  o: ["u", "eo", "a", "eu"],
  u: ["eu", "o", "eo", "i"],
  eu: ["u", "i", "eo", "a"],
  i: ["eu", "a", "eo", "u"],
  ae: ["e", "a", "ya", "ye"],
  e: ["ae", "ye", "eo", "i"],
  ya: ["yeo", "yo", "yu", "a"],
  yeo: ["yo", "ya", "eo", "o"],
  yo: ["yu", "o", "yeo", "u"],
  yu: ["u", "yo", "eu", "i"],
  yae: ["ye", "ae", "e", "ya"],
  ye: ["yae", "e", "yeo", "i"],
};

const HANGUL_VOWEL_CHARS = [
  "ㅏ",
  "ㅓ",
  "ㅗ",
  "ㅜ",
  "ㅡ",
  "ㅣ",
  "ㅑ",
  "ㅕ",
  "ㅛ",
  "ㅠ",
  "ㅐ",
  "ㅔ",
  "ㅒ",
  "ㅖ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅢ",
];

const VOWEL_CHAR_CONFUSIONS: Record<string, string[]> = {
  "ㅏ": ["ㅓ", "ㅗ", "ㅜ", "ㅣ"],
  "ㅓ": ["ㅗ", "ㅜ", "ㅡ", "ㅏ"],
  "ㅗ": ["ㅜ", "ㅡ", "ㅓ", "ㅏ"],
  "ㅜ": ["ㅡ", "ㅗ", "ㅓ", "ㅣ"],
  "ㅡ": ["ㅜ", "ㅣ", "ㅓ", "ㅗ"],
  "ㅣ": ["ㅡ", "ㅏ", "ㅓ", "ㅜ"],
  "ㅑ": ["ㅕ", "ㅛ", "ㅠ", "ㅏ"],
  "ㅕ": ["ㅑ", "ㅛ", "ㅓ", "ㅠ"],
  "ㅛ": ["ㅠ", "ㅗ", "ㅑ", "ㅕ"],
  "ㅠ": ["ㅛ", "ㅜ", "ㅕ", "ㅑ"],
  "ㅐ": ["ㅔ", "ㅒ", "ㅖ", "ㅏ"],
  "ㅔ": ["ㅐ", "ㅖ", "ㅒ", "ㅓ"],
  "ㅒ": ["ㅖ", "ㅐ", "ㅔ", "ㅑ"],
  "ㅖ": ["ㅔ", "ㅐ", "ㅒ", "ㅕ"],
};

const CONSONANT_GROUPS = [
  ["ㄱ", "ㅋ", "ㄲ"],
  ["ㄷ", "ㅌ", "ㄸ"],
  ["ㅂ", "ㅍ", "ㅃ"],
  ["ㅈ", "ㅊ", "ㅉ"],
  ["ㄹ", "ㄴ"],
  ["ㅁ", "ㅂ"],
  ["ㅅ", "ㅆ"],
  ["ㅎ", "ㅋ", "ㅌ", "ㅍ", "ㅊ"],
];

const CONSONANT_ROMANIZATION_GROUPS = [
  ["g", "k", "kk", "ga", "ka"],
  ["d", "t", "tt", "da", "ta"],
  ["b", "p", "pp", "ba", "pa"],
  ["j", "ch", "jj", "ja", "cha"],
  ["r", "l", "n", "ra", "na"],
];

const PROFESSION_MN = [
  "багш",
  "эмч",
  "компанийн ажилтан",
  "оффисын ажилтан",
  "оюутан",
  "банкны ажилтан",
  "найз",
  "хүүхэд",
];

const PROFESSION_KO = [
  "선생님",
  "의사",
  "회사원",
  "학생",
  "은행원",
  "친구",
  "아이",
];

const COUNTRY_MN = [
  "Монгол",
  "Солонгос",
  "Хятад",
  "Япон",
  "монгол хүн",
  "солонгос хэл",
  "монгол хэл",
  "хятад хэл",
  "англи хэл",
];

const COUNTRY_KO = ["몽골", "한국", "중국", "일본", "사람", "나라"];

const GREETING_PHRASES = [
  "Сайн байна уу",
  "Баяртай",
  "Баярлалаа",
  "Уучлаарай",
  "네, 한국 사람입니다.",
  "아니요, 이름입니다.",
  "감사합니다.",
  "안녕히 가세요.",
];

const GRAMMAR_SENTENCE_POOL = [
  "저는 학생입니다.",
  "저는 학생입니까?",
  "제가 학생입니다.",
  "저는 학생이 아닙니다.",
  "저는 회사원입니다.",
  "저는 선생님입니다.",
  "저는 한국 사람입니다.",
  "저는 몽골 사람입니다.",
  "Bi оффисын ажилтан.",
  "Bi оюутан.",
  "Bi багш.",
  "Bi монгол хүн.",
];

const PARTICLE_OPTIONS = [
  "topic (хэлэх сэдэв)",
  "байршил",
  "тоо",
  "зай",
  "object marker",
  "subject marker",
];

const COPULA_OPTIONS = [
  "… байна (албан ёсны)",
  "… үү?",
  "… байсан",
  "… хийх",
  "… биш",
  "formal statement",
];

const HANGUL_MN_DESCRIPTION_PREFIX = "Солонгос үндсэн эгшиг:";

function isSingleHangulJamo(value: string): boolean {
  return /^[\u3131-\u318E]$/.test(value.trim());
}

function isRomanizationToken(value: string): boolean {
  return /^[a-z]{1,4}$/i.test(value.trim());
}

function isLatinSyllable(value: string): boolean {
  return /^[a-z]{2,4}$/i.test(value.trim());
}

function normalizeMn(value: string): string {
  return value.trim().toLowerCase();
}

function hasHanScript(value: string): boolean {
  return HAN_SCRIPT_REGEX.test(value);
}

export function isTrueFalseOptionLabel(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^[✓✗]\s*(үнэн|худал)/i.test(trimmed)) return true;
  const key = normalizeMn(trimmed).replace(/[^a-z0-9\u0400-\u04ff]/g, "");
  return TRUE_FALSE_LABELS_NORMALIZED.has(key);
}

export function isTrueFalseQuestion(question: QuizQuestion): boolean {
  if (question.skillTags?.includes("true_false")) return true;

  const options = question.options.map((o) => o.trim()).filter(Boolean);
  if (options.length >= 2 && options.every(isTrueFalseOptionLabel)) {
    return true;
  }

  const correct = question.correctAnswer.trim();
  if (/^(true|false)$/i.test(correct)) return true;
  return isTrueFalseOptionLabel(correct);
}

function filterOutTrueFalseLabels(values: string[]): string[] {
  return values.filter((value) => !isTrueFalseOptionLabel(value));
}

function hasChineseOptionBank(question: QuizQuestion): boolean {
  const hanOptions = question.options.filter((o) => hasHanScript(o));
  return (
    (question.type === "cloze" || question.type === "multiple_choice") &&
    hanOptions.length >= 2
  );
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function pickFromPool(
  pool: string[],
  correct: string,
  count: number,
  prefer: string[] = []
): string[] {
  const correctKey = correct.trim().toLowerCase();
  const ordered = uniqueStrings([
    ...prefer.filter((v) => v.trim().toLowerCase() !== correctKey),
    ...shuffleArray(pool.filter((v) => v.trim().toLowerCase() !== correctKey)),
  ]);
  return ordered.slice(0, count);
}

function confusionForKey(
  map: Record<string, string[]>,
  key: string,
  fallbackPool: string[]
): string[] {
  const direct = map[key] ?? map[key.toLowerCase()];
  if (direct?.length) return direct;
  return fallbackPool;
}

function vowelMongolianDescription(reading: string, mongolian: string): string {
  const readingLabel = reading.trim() || mongolian.match(/«([^»]+)»/)?.[1] || "";
  if (mongolian.includes(HANGUL_MN_DESCRIPTION_PREFIX)) {
    return mongolian.trim();
  }
  if (mongolian.includes("эгшиг") || mongolian.includes("авиа")) {
    return `${HANGUL_MN_DESCRIPTION_PREFIX} ${readingLabel} авиа`.trim();
  }
  return mongolian.trim();
}

function buildVowelMongolianPool(vocabulary: VocabularyWord[]): string[] {
  const fromVocab = vocabulary
    .filter(
      (w) =>
        isSingleHangulJamo(w.chinese) ||
        w.mongolian.includes("эгшиг") ||
        w.mongolian.includes("авиа")
    )
    .map((w) => vowelMongolianDescription(w.pinyin, w.mongolian));

  return uniqueStrings([
    ...fromVocab,
    `${HANGUL_MN_DESCRIPTION_PREFIX} a авиа`,
    `${HANGUL_MN_DESCRIPTION_PREFIX} eo авиа`,
    `${HANGUL_MN_DESCRIPTION_PREFIX} o авиа`,
    `${HANGUL_MN_DESCRIPTION_PREFIX} u авиа`,
    `${HANGUL_MN_DESCRIPTION_PREFIX} eu авиа`,
    `${HANGUL_MN_DESCRIPTION_PREFIX} i авиа`,
    "ө/о завсрын авиа",
    "огтлол «а»",
    "«у» авиа",
    "«и» авиа",
    "«о» авиа",
    "«а» авиа",
    "ы/үгүй эгшигтэй төстэй",
  ]);
}

function buildProfessionPool(
  vocabulary: VocabularyWord[],
  useKorean: boolean
): string[] {
  const base = useKorean ? PROFESSION_KO : PROFESSION_MN;
  const fromVocab = vocabulary
    .map((w) => (useKorean ? w.chinese : w.mongolian))
    .filter((v) => {
      const lower = normalizeMn(v);
      return (
        lower.includes("багш") ||
        lower.includes("эмч") ||
        lower.includes("ажилтан") ||
        lower.includes("оюутан") ||
        lower.includes("회사") ||
        lower.includes("선생") ||
        lower.includes("의사") ||
        lower.includes("학생")
      );
    });
  return uniqueStrings([...fromVocab, ...base]);
}

function buildCountryPool(
  vocabulary: VocabularyWord[],
  useKorean: boolean
): string[] {
  const base = useKorean ? COUNTRY_KO : COUNTRY_MN;
  const fromVocab = vocabulary
    .map((w) => (useKorean ? w.chinese : w.mongolian))
    .filter((v) => {
      const lower = normalizeMn(v);
      return (
        lower.includes("монгол") ||
        lower.includes("солонгос") ||
        lower.includes("хятад") ||
        lower.includes("япон") ||
        lower.includes("한국") ||
        lower.includes("몽골") ||
        lower.includes("중국")
      );
    });
  return uniqueStrings([...fromVocab, ...base]);
}

function collectCategoryAnswers(
  questions: QuizQuestion[],
  category: QuizOptionCategory
): string[] {
  return uniqueStrings(
    questions.flatMap((q) => {
      if (detectQuizCategory(q) !== category) return [];
      return [q.correctAnswer, ...q.options];
    })
  );
}

export function inferQuizDifficulty(
  question: QuizQuestion,
  category: QuizOptionCategory
): QuizDifficulty {
  if (question.difficulty === "easy" || question.difficulty === "medium") {
    return question.difficulty;
  }
  if (question.difficulty === "hard") return "hard";

  if (
    category === "hangul_vowel_romanization" ||
    category === "hangul_vowel_char" ||
    category === "hangul_consonant_char"
  ) {
    return "hard";
  }
  if (category === "grammar_sentence") return "hard";
  return "medium";
}

export function detectQuizCategory(question: QuizQuestion): QuizOptionCategory {
  const q = question.question;
  const correct = question.correctAnswer.trim();
  const options = question.options.map((o) => o.trim());
  const joined = `${q} ${options.join(" ")} ${correct}`.toLowerCase();

  if (question.skillTags?.includes("hangul_vowel")) {
    if (options.every(isRomanizationToken)) return "hangul_vowel_romanization";
    if (options.every(isSingleHangulJamo)) return "hangul_vowel_char";
    return "hangul_vowel_mongolian";
  }
  if (question.skillTags?.includes("hangul_consonant")) {
    if (options.every(isSingleHangulJamo)) return "hangul_consonant_char";
    return "hangul_consonant_romanization";
  }
  if (question.skillTags?.includes("profession")) return "profession";
  if (question.skillTags?.includes("country")) return "country";
  if (question.skillTags?.includes("grammar")) return "grammar_sentence";

  if (q.includes("romanization") || q.includes("Romanization")) {
    if (options.every(isRomanizationToken)) return "hangul_vowel_romanization";
    if (options.every(isSingleHangulJamo)) return "hangul_vowel_char";
  }

  if (/「[\u3131-\u318E]」/.test(q) && options.every(isRomanizationToken)) {
    return "hangul_vowel_romanization";
  }

  if (/「[가-힣]+」-ийг уншвал/.test(q) && options.every(isRomanizationToken)) {
    return "hangul_vowel_romanization";
  }

  if (options.every(isSingleHangulJamo)) {
    if (CONSONANT_GROUPS.some((g) => g.includes(correct))) {
      return "hangul_consonant_char";
    }
    return "hangul_vowel_char";
  }

  if (
    correct.includes("авиа") ||
    correct.includes("эгшиг") ||
    q.includes("монгол тайлбар") ||
    options.some((o) => o.includes("авиа"))
  ) {
    return "hangul_vowel_mongolian";
  }

  if (options.every(isLatinSyllable) && !options.every(isRomanizationToken)) {
    return "hangul_syllable_romanization";
  }

  if (
    joined.includes("회사원") ||
    joined.includes("선생님") ||
    joined.includes("의사") ||
    joined.includes("학생") ||
    PROFESSION_MN.some((p) => normalizeMn(correct).includes(normalizeMn(p)))
  ) {
    if (/[가-힣]/.test(correct) && options.every((o) => /[가-힣]/.test(o))) {
      return "profession";
    }
    return "profession";
  }

  if (
    joined.includes("몽골") ||
    joined.includes("монгол") ||
    joined.includes("한국") ||
    joined.includes("солонгос") ||
    joined.includes("나라") ||
    joined.includes("хятад")
  ) {
    if (q.includes("한국어") || q.includes("хэл")) return "language";
    return "country";
  }

  if (q.includes("particle") || q.includes("은/는")) return "particle";
  if (q.includes("입니다") && options.some((o) => o.includes("байна"))) {
    return "copula";
  }

  if (
    options.some((o) => o.includes("입니다") || o.includes("입니까")) ||
    correct.startsWith("저는") ||
    correct.startsWith("Bi ")
  ) {
    return "grammar_sentence";
  }

  if (
    GREETING_PHRASES.some(
      (p) => normalizeMn(p) === normalizeMn(correct) || q.includes("안녕")
    )
  ) {
    return "greeting_phrase";
  }

  if (question.type === "cloze" && options.every((o) => /[가-힣]/.test(o))) {
    return "cloze_korean";
  }

  if (isTrueFalseQuestion(question)) {
    return "true_false";
  }

  const usesHan = hasHanScript(correct) || options.some((o) => hasHanScript(o));
  if (usesHan) {
    if (question.type === "cloze") return "cloze_chinese";
    return "vocabulary_chinese";
  }

  if (options.every((o) => /[가-힣]/.test(o))) return "vocabulary_korean";
  if (options.every((o) => !/[가-힣\u3131-\u318E]/.test(o) && !hasHanScript(o))) {
    return "vocabulary_mongolian";
  }

  return "unknown";
}

function buildCategoryPool(
  category: QuizOptionCategory,
  question: QuizQuestion,
  vocabulary: VocabularyWord[],
  allQuestions: QuizQuestion[]
): { pool: string[]; prefer: string[] } {
  const correct = question.correctAnswer.trim();
  const fromLesson = collectCategoryAnswers(allQuestions, category);

  switch (category) {
    case "hangul_vowel_romanization":
      return {
        pool: uniqueStrings([
          ...ROMANIZATION_VOWELS,
          ...vocabulary.map((w) => w.pinyin).filter(isRomanizationToken),
          ...fromLesson.filter(isRomanizationToken),
        ]),
        prefer: confusionForKey(ROMANIZATION_CONFUSIONS, correct.toLowerCase(), [
          ...ROMANIZATION_VOWELS,
        ]),
      };
    case "hangul_vowel_char":
      return {
        pool: uniqueStrings([
          ...HANGUL_VOWEL_CHARS,
          ...vocabulary.map((w) => w.chinese).filter(isSingleHangulJamo),
          ...fromLesson.filter(isSingleHangulJamo),
        ]),
        prefer: confusionForKey(VOWEL_CHAR_CONFUSIONS, correct, HANGUL_VOWEL_CHARS),
      };
    case "hangul_consonant_char": {
      const group =
        CONSONANT_GROUPS.find((g) => g.includes(correct)) ??
        CONSONANT_GROUPS.flat();
      return {
        pool: uniqueStrings([
          ...group,
          ...CONSONANT_GROUPS.flat(),
          ...vocabulary.map((w) => w.chinese).filter(isSingleHangulJamo),
          ...fromLesson.filter(isSingleHangulJamo),
        ]),
        prefer: group.filter((c) => c !== correct),
      };
    }
    case "hangul_consonant_romanization":
    case "hangul_syllable_romanization": {
      const group =
        CONSONANT_ROMANIZATION_GROUPS.find((g) =>
          g.some((token) => correct.toLowerCase().startsWith(token))
        ) ?? CONSONANT_ROMANIZATION_GROUPS.flat();
      return {
        pool: uniqueStrings([
          ...group,
          ...vocabulary.map((w) => w.pinyin).filter(Boolean),
          ...fromLesson.filter((o) => isLatinSyllable(o) || isRomanizationToken(o)),
        ]),
        prefer: group.filter((c) => c.toLowerCase() !== correct.toLowerCase()),
      };
    }
    case "hangul_vowel_mongolian":
      return {
        pool: buildVowelMongolianPool(vocabulary),
        prefer: buildVowelMongolianPool(vocabulary).filter(
          (v) => v.toLowerCase() !== correct.toLowerCase()
        ),
      };
    case "profession": {
      const useKorean = /[가-힣]/.test(correct);
      return {
        pool: buildProfessionPool(vocabulary, useKorean),
        prefer: buildProfessionPool(vocabulary, useKorean),
      };
    }
    case "country": {
      const useKorean = /[가-힣]/.test(correct);
      return {
        pool: buildCountryPool(vocabulary, useKorean),
        prefer: buildCountryPool(vocabulary, useKorean),
      };
    }
    case "language":
      return {
        pool: uniqueStrings([
          "солонгос хэл",
          "монгол хэл",
          "хятад хэл",
          "англи хэл",
          ...vocabulary.map((w) => w.mongolian),
        ]),
        prefer: ["солонгос хэл", "монгол хэл", "хятад хэл", "англи хэл"],
      };
    case "grammar_sentence":
      return {
        pool: uniqueStrings([...GRAMMAR_SENTENCE_POOL, ...fromLesson]),
        prefer: GRAMMAR_SENTENCE_POOL.filter((s) => s !== correct),
      };
    case "particle":
      return { pool: PARTICLE_OPTIONS, prefer: PARTICLE_OPTIONS };
    case "copula":
      return { pool: COPULA_OPTIONS, prefer: COPULA_OPTIONS };
    case "greeting_phrase":
      return { pool: GREETING_PHRASES, prefer: GREETING_PHRASES };
    case "cloze_korean":
      return {
        pool: uniqueStrings([
          ...vocabulary.map((w) => w.chinese),
          ...fromLesson,
        ]),
        prefer: vocabulary.map((w) => w.chinese),
      };
    case "cloze_chinese":
    case "vocabulary_chinese":
      return {
        pool: uniqueStrings([
          ...vocabulary.map((w) => w.chinese).filter(hasHanScript),
          ...fromLesson.filter(hasHanScript),
          ...question.options.filter(hasHanScript),
        ]),
        prefer: vocabulary.map((w) => w.chinese).filter(hasHanScript),
      };
    case "true_false": {
      const tfPool = uniqueStrings([
        "Үнэн",
        "Худал",
        ...question.options,
        ...fromLesson,
      ]).filter(isTrueFalseOptionLabel);
      return {
        pool: tfPool.length >= 2 ? tfPool : ["Үнэн", "Худал"],
        prefer: tfPool,
      };
    }
    case "vocabulary_korean":
      return {
        pool: uniqueStrings([
          ...vocabulary.map((w) => w.chinese),
          ...fromLesson.filter((o) => /[가-힣]/.test(o)),
        ]),
        prefer: vocabulary.map((w) => w.chinese),
      };
    case "vocabulary_mongolian":
      return {
        pool: uniqueStrings([
          ...vocabulary.map((w) => w.mongolian),
          ...fromLesson.filter(
            (o) => !/[가-힣]/.test(o) && !hasHanScript(o) && !isTrueFalseOptionLabel(o)
          ),
        ]),
        prefer: vocabulary.map((w) => w.mongolian),
      };
    default:
      return {
        pool: filterOutTrueFalseLabels(
          uniqueStrings([...question.options, ...fromLesson])
        ),
        prefer: filterOutTrueFalseLabels(
          question.options.filter((o) => o !== correct)
        ),
      };
  }
}

function distractorCount(question: QuizQuestion): number {
  const existing = question.options.length - 1;
  if (existing >= 3) return existing;
  return 3;
}

export function sanitizeQuizQuestionOptions(question: QuizQuestion): QuizQuestion {
  if (isTrueFalseQuestion(question)) {
    return question;
  }

  const filtered = filterOutTrueFalseLabels(question.options);
  if (filtered.length === question.options.length) {
    return question;
  }

  return {
    ...question,
    options: filtered.length > 0 ? filtered : question.options,
  };
}

export function enhanceQuizQuestionOptions(
  question: QuizQuestion,
  vocabulary: VocabularyWord[],
  allQuestions: QuizQuestion[]
): QuizQuestion {
  const sanitized = sanitizeQuizQuestionOptions(question);

  if (isTrueFalseQuestion(sanitized)) {
    const tfPool = uniqueStrings([
      "Үнэн",
      "Худал",
      ...sanitized.options,
    ]).filter(isTrueFalseOptionLabel);
    const options =
      tfPool.length >= 2
        ? shuffleArray(tfPool)
        : shuffleArray(["Үнэн", "Худал"]);
    return { ...sanitized, options };
  }

  if (hasChineseOptionBank(sanitized)) {
    const bank = uniqueStrings(
      filterOutTrueFalseLabels(sanitized.options).filter(hasHanScript)
    );
    if (bank.length >= 2) {
      return { ...sanitized, options: shuffleArray(bank) };
    }
  }

  const category = detectQuizCategory(sanitized);
  const difficulty = inferQuizDifficulty(sanitized, category);
  const count = distractorCount(sanitized);
  const { pool, prefer } = buildCategoryPool(
    category,
    sanitized,
    vocabulary,
    allQuestions
  );

  const safePool = filterOutTrueFalseLabels(pool);
  const safePrefer = filterOutTrueFalseLabels(prefer);

  if (safePool.length < 2) {
    return sanitized;
  }

  let preferred = safePrefer;
  if (difficulty === "hard") {
    preferred = safePrefer.length ? safePrefer : safePool;
  } else if (difficulty === "easy") {
    preferred = safePrefer.slice(0, 2);
  }

  const distractors = pickFromPool(
    safePool,
    sanitized.correctAnswer,
    count,
    preferred
  );
  if (distractors.length === 0) {
    return sanitized;
  }

  const options = shuffleArray([
    sanitized.correctAnswer,
    ...distractors.slice(0, count),
  ]);

  return {
    ...sanitized,
    options,
    difficulty,
  };
}

export function enhanceLessonQuizQuestions(
  questions: QuizQuestion[],
  vocabulary: VocabularyWord[]
): QuizQuestion[] {
  return questions.map((question) =>
    enhanceQuizQuestionOptions(question, vocabulary, questions)
  );
}

/** DB/static rows: strip TF labels from fill-in. Korean L0: smart rewrite. */
export function prepareLessonQuizQuestions(
  questions: QuizQuestion[],
  vocabulary: VocabularyWord[],
  options: { rewriteOptions?: boolean }
): QuizQuestion[] {
  const sanitized = questions.map((q) => sanitizeQuizQuestionOptions(q));
  if (!options.rewriteOptions) {
    return sanitized;
  }
  return enhanceLessonQuizQuestions(sanitized, vocabulary);
}

export type VocabTranslateCategory =
  | "hangul_vowel"
  | "hangul_consonant"
  | "profession"
  | "country"
  | "phrase"
  | "general";

export function categorizeVocabularyForTranslate(
  word: Pick<VocabularyWord, "chinese" | "mongolian" | "pinyin">
): VocabTranslateCategory {
  const { chinese, mongolian } = word;
  const mn = normalizeMn(mongolian);

  if (isSingleHangulJamo(chinese) || mn.includes("эгшиг") || mn.includes("авиа")) {
    return "hangul_vowel";
  }
  if (CONSONANT_GROUPS.some((g) => g.includes(chinese))) {
    return "hangul_consonant";
  }
  if (
    PROFESSION_KO.includes(chinese) ||
    PROFESSION_MN.some((p) => mn.includes(normalizeMn(p)))
  ) {
    return "profession";
  }
  if (
    COUNTRY_KO.some((k) => chinese.includes(k)) ||
    COUNTRY_MN.some((c) => mn.includes(normalizeMn(c)))
  ) {
    return "country";
  }
  if (chinese.length > 2 && (mn.includes("сайн") || chinese.includes("안녕"))) {
    return "phrase";
  }
  return "general";
}

export function pickSameCategoryDistractors(
  items: Array<Pick<VocabularyWord, "chinese" | "mongolian" | "pinyin">>,
  target: Pick<VocabularyWord, "chinese" | "mongolian" | "pinyin">,
  count: number,
  field: "mongolian" | "chinese"
): string[] {
  const category = categorizeVocabularyForTranslate(target);
  const correct = field === "mongolian" ? target.mongolian : target.chinese;
  const sameCategory = items.filter(
    (item) => categorizeVocabularyForTranslate(item) === category
  );

  let pool = sameCategory.map((item) =>
    field === "mongolian" ? item.mongolian : item.chinese
  );

  if (category === "hangul_vowel" && field === "mongolian") {
    pool = sameCategory.map((item) =>
      vowelMongolianDescription(item.pinyin, item.mongolian)
    );
  }

  if (pool.filter((v) => v.trim().toLowerCase() !== correct.trim().toLowerCase()).length < count) {
    pool = items.map((item) =>
      field === "mongolian" ? item.mongolian : item.chinese
    );
  }

  return pickFromPool(pool, correct, count);
}
