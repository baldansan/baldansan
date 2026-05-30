import type { VocabularyWord } from "@/types/lesson";
import {
  isKoreanLesson0BeginnerFlow,
  type KoreanLesson0LessonPick,
} from "@/lib/lesson/korean-lesson0-flow";

export type { KoreanLesson0LessonPick };

/** Static fallback map for Korean Lesson 0 Hangul items. */
export const HANGUL_PRONUNCIATION_FALLBACK: Record<string, string> = {
  "ㅏ": "а",
  "ㅓ": "ө/о завсрын",
  "ㅗ": "о",
  "ㅜ": "у",
  "ㅡ": "ам хавтгай \"ы\"-тэй төстэй",
  "ㅣ": "и",
  "ㅑ": "я",
  "ㅕ": "ё/йо завсрын",
  "ㅛ": "ё",
  "ㅠ": "ю",
  "ㄱ": "г/к зөөлөн",
  "ㄴ": "н",
  "ㄷ": "д/т зөөлөн",
  "ㄹ": "р/л завсрын",
  "ㅁ": "м",
  "ㅂ": "б/п зөөлөн",
  "ㅅ": "с",
  "ㅇ": "эхэндээ дуугарахгүй",
  "ㅈ": "ж",
  "ㅊ": "ч",
  "ㅋ": "к хатуу",
  "ㅌ": "т хатуу",
  "ㅍ": "п хатуу",
  "ㅎ": "х",
  "가": "га",
  "나": "на",
  "다": "да",
  "라": "ра/ла",
  "마": "ма",
  "바": "ба",
  "사": "са",
  "아": "а",
  "자": "жа",
  "하": "ха",
  "한": "хан",
  "글": "гыль/гүл",
  "한국": "хангук",
  "몽골": "монгол",
  "사람": "сарам",
  "이름": "ирим",
  "학교": "хак-гё",
  "밥": "пап",
  "물": "муль",
  "일": "иль",
  "han": "хан",
  "ga": "га",
  "na": "на",
  "a": "а",
};

export const SIMILAR_SOUND_TEACHER_BODY = [
  "ㅓ vs ㅗ",
  "ㅓ = ө/о завсрын, амаа сул",
  "ㅗ = о, уруулаа дугуйлна",
  "",
  "ㅜ vs ㅡ",
  "ㅜ = у, уруулаа дугуйлна",
  "ㅡ = ам хавтгай, сул ы-тэй төстэй",
  "",
  "ㄱ vs ㅋ vs ㄲ",
  "ㄱ = г/к зөөлөн · ㅋ = к хатуу · ㄲ = г хатуу",
  "",
  "ㄷ vs ㅌ vs ㄸ",
  "ㄷ = д/т зөөлөн · ㅌ = т хатуу · ㄸ = д хатуу",
  "",
  "ㅂ vs ㅍ vs ㅃ",
  "ㅂ = б/п зөөлөн · ㅍ = п хатуу · ㅃ = б хатуу",
].join("\n");

type PronunciationInput = Pick<
  VocabularyWord,
  | "chinese"
  | "pinyin"
  | "mongolian"
  | "mongolianPronunciation"
  | "pronunciationMn"
  | "pronunciationHintMn"
  | "id"
>;

function trim(value: string | undefined | null): string {
  return value?.trim() ?? "";
}

function lookupFallback(key: string): string | null {
  const normalized = key.trim();
  if (!normalized) return null;
  return (
    HANGUL_PRONUNCIATION_FALLBACK[normalized] ??
    HANGUL_PRONUNCIATION_FALLBACK[normalized.toLowerCase()] ??
    null
  );
}

/** True when mongolian text reads like a short pronunciation hint, not a full meaning. */
export function looksLikePronunciationExplanation(text: string): boolean {
  const value = text.trim();
  if (!value || value.length > 48) return false;
  if (/^[а-яёА-ЯЁa-z0-9/\-·]+$/i.test(value) && !value.includes(" ")) {
    return true;
  }
  if (/^ө\/о|^ё\/|^г\/|^д\/|^б\/|^ра\/|^ам хавтай|^эхэнд|^завсрын/i.test(value)) {
    return true;
  }
  return false;
}

export function resolveMongolianPronunciation(
  word: PronunciationInput,
  options?: {
    pronunciationMap?: Record<string, string>;
    useFallbackMap?: boolean;
  }
): string | null {
  const pronunciationMap = options?.pronunciationMap;
  const useFallbackMap = options?.useFallbackMap !== false;

  const explicit =
    trim(word.mongolianPronunciation) ||
    trim(word.pronunciationMn) ||
    trim(word.pronunciationHintMn);
  if (explicit) return explicit;

  const fromMap =
    pronunciationMap?.[word.chinese] ??
    (word.id ? pronunciationMap?.[word.id] : undefined);
  if (fromMap) return fromMap;

  if (useFallbackMap) {
    const fromHangul = lookupFallback(word.chinese);
    if (fromHangul) return fromHangul;

    const roman = trim(word.pinyin).toLowerCase();
    if (roman) {
      const fromRoman = lookupFallback(roman);
      if (fromRoman) return fromRoman;
    }
  }

  const mongolian = trim(word.mongolian);
  if (mongolian && looksLikePronunciationExplanation(mongolian)) {
    return mongolian;
  }

  return null;
}

export function resolveDisplayPronunciation(
  word: PronunciationInput,
  lesson: KoreanLesson0LessonPick,
  pronunciationMap?: Record<string, string>
): string | null {
  const useFallbackMap = isKoreanLesson0BeginnerFlow(lesson);
  return resolveMongolianPronunciation(word, {
    pronunciationMap,
    useFallbackMap,
  });
}

export function resolveHangulAnswerPronunciation(
  answer: string,
  lesson: KoreanLesson0LessonPick,
  pronunciationMap?: Record<string, string>
): string | null {
  const key = answer.trim();
  if (!key) return null;

  const fromMap = pronunciationMap?.[key];
  if (fromMap) return fromMap;

  if (isKoreanLesson0BeginnerFlow(lesson)) {
    return lookupFallback(key);
  }

  return null;
}

export function resolveVocabRomanizationForAnswer(
  answer: string,
  vocabulary: VocabularyWord[]
): string | null {
  const word = vocabulary.find((item) => item.chinese === answer.trim());
  return trim(word?.pinyin) || null;
}

export function resolveVocabMeaningLabel(
  word: PronunciationInput,
  pronunciation: string | null
): string | null {
  const meaning = trim(word.mongolian);
  if (!meaning) return null;
  if (pronunciation && meaning === pronunciation) return null;
  if (looksLikePronunciationExplanation(meaning) && pronunciation) return null;
  return meaning;
}

/** Extract result syllable from visual lines like "ㅎ + ㅏ + ㄴ = 한". */
export function resolveVisualLinePronunciation(line: string): string | null {
  const match = line.match(/=\s*([^\s+]+)\s*$/);
  if (!match?.[1]) return null;
  return resolveHangulTextPronunciation(match[1]);
}

export function resolveHangulTextPronunciation(text: string): string | null {
  const key = text.trim();
  if (!key) return null;
  return lookupFallback(key);
}

export function resolvePracticeAnswerPronunciation(answer: string): string | null {
  return resolveHangulTextPronunciation(answer);
}

export function enrichVocabularyWithPronunciation(
  vocabulary: VocabularyWord[],
  pronunciationMap?: Record<string, string>
): VocabularyWord[] {
  return vocabulary.map((word) => {
    const pronunciation = resolveMongolianPronunciation(word, {
      pronunciationMap,
      useFallbackMap: false,
    });
    if (!pronunciation) return word;
    if (
      word.mongolianPronunciation === pronunciation ||
      word.pronunciationMn === pronunciation
    ) {
      return word;
    }
    return {
      ...word,
      mongolianPronunciation: word.mongolianPronunciation ?? pronunciation,
    };
  });
}

export function formatPronunciationLine(pronunciation: string | null): string | null {
  if (!pronunciation) return null;
  return `Дуудлага: ${pronunciation}`;
}
