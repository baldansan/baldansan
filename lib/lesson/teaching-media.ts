import { inferLessonLanguage } from "@/lib/language-track";
import { enrichVocabularyWithPronunciation } from "@/lib/lesson/korean-pronunciation-hints";
import {
  getJsonSourceNoteField,
  mergeTeachingMediaIntoJsonOrLegacySourceNote,
  parseLegacySourceNoteSegment,
} from "@/lib/lesson/source-note-json";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

export type TeachingImage = {
  type: string;
  title: string;
  url: string;
  caption?: string;
  file?: string;
};

export type TeachingImageRef = {
  type: string;
  title: string;
  file: string;
  caption?: string;
};

function parseJsonMap(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const map: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.trim()) {
        map[key] = value.trim();
      }
    }
    return map;
  } catch {
    return {};
  }
}

export function parseTeachingImagesFromSourceNote(
  sourceNote?: string | null
): TeachingImage[] {
  const jsonValue = getJsonSourceNoteField(sourceNote ?? null, "teachingImages");
  const raw =
    jsonValue != null
      ? JSON.stringify(jsonValue)
      : parseLegacySourceNoteSegment(sourceNote ?? null, "teachingImages");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        type: String(item.type ?? "diagram"),
        title: String(item.title ?? ""),
        url: String(item.url ?? ""),
        caption: item.caption ? String(item.caption) : undefined,
        file: item.file ? String(item.file) : undefined,
      }))
      .filter((item) => item.title && item.url);
  } catch {
    return [];
  }
}

export function parseVocabularyAudioMapFromSourceNote(
  sourceNote?: string | null
): Record<string, string> {
  const jsonValue = getJsonSourceNoteField(sourceNote ?? null, "vocabAudio");
  if (jsonValue != null) {
    return parseJsonMap(JSON.stringify(jsonValue));
  }
  return parseJsonMap(parseLegacySourceNoteSegment(sourceNote ?? null, "vocabAudio"));
}

export function parseVocabularyPronunciationMapFromSourceNote(
  sourceNote?: string | null
): Record<string, string> {
  const jsonValue = getJsonSourceNoteField(sourceNote ?? null, "vocabPronMn");
  if (jsonValue != null) {
    return parseJsonMap(JSON.stringify(jsonValue));
  }
  return parseJsonMap(parseLegacySourceNoteSegment(sourceNote ?? null, "vocabPronMn"));
}

export function mergeTeachingMediaIntoSourceNote(
  sourceNote: string | undefined | null,
  teachingImages: TeachingImage[],
  vocabAudio: Record<string, string>,
  vocabPronMn: Record<string, string> = {}
): string {
  return mergeTeachingMediaIntoJsonOrLegacySourceNote(sourceNote, {
    teachingImages:
      teachingImages.length > 0
        ? teachingImages.map(({ type, title, url, caption, file }) => ({
            type,
            title,
            url,
            ...(caption ? { caption } : {}),
            ...(file ? { file } : {}),
          }))
        : undefined,
    vocabAudio,
    vocabPronMn,
  });
}

export function enrichLessonTeachingMedia(lesson: LessonContent): LessonContent {
  const teachingImages = parseTeachingImagesFromSourceNote(lesson.sourceNote);
  const vocabularyAudioMap = parseVocabularyAudioMapFromSourceNote(lesson.sourceNote);
  const vocabularyPronunciationMap = parseVocabularyPronunciationMapFromSourceNote(
    lesson.sourceNote
  );

  let vocabulary = lesson.vocabulary;

  if (Object.keys(vocabularyAudioMap).length > 0) {
    vocabulary = vocabulary.map((word) => {
      const audioUrl = resolveVocabularyAudioUrl(word, vocabularyAudioMap);
      if (!audioUrl || word.audioUrl === audioUrl) return word;
      return { ...word, audioUrl };
    });
  }

  if (Object.keys(vocabularyPronunciationMap).length > 0) {
    vocabulary = enrichVocabularyWithPronunciation(
      vocabulary,
      vocabularyPronunciationMap
    );
  }

  const unchanged =
    teachingImages.length === (lesson.teachingImages?.length ?? 0) &&
    vocabulary === lesson.vocabulary &&
    !lesson.vocabularyAudioMap &&
    !lesson.vocabularyPronunciationMap;

  if (unchanged && !teachingImages.length) {
    return lesson;
  }

  return {
    ...lesson,
    ...(teachingImages.length ? { teachingImages } : {}),
    ...(Object.keys(vocabularyAudioMap).length
      ? { vocabularyAudioMap }
      : {}),
    ...(Object.keys(vocabularyPronunciationMap).length
      ? { vocabularyPronunciationMap }
      : {}),
    vocabulary,
  };
}

export function resolveVocabularyAudioUrl(
  word: Pick<VocabularyWord, "id" | "chinese" | "audioUrl">,
  map?: Record<string, string>
): string | undefined {
  if (word.audioUrl?.trim()) return word.audioUrl.trim();
  if (!map) return undefined;
  return (
    map[word.id]?.trim() ||
    map[word.chinese]?.trim() ||
    undefined
  );
}

export function isKoreanLessonForTts(
  lesson: Pick<LessonContent, "courseId" | "language">
): boolean {
  return inferLessonLanguage(lesson) === "ko";
}

export function resolveKoreanTtsLang(
  lesson: Pick<LessonContent, "courseId" | "language">
): "ko-KR" | "zh-CN" {
  return isKoreanLessonForTts(lesson) ? "ko-KR" : "zh-CN";
}

export const HANGUL_TEXT_DIAGRAMS = [
  { equation: "ㅎ + ㅏ + ㄴ = 한", caption: "Гийгүүлэгч + эгшиг + 받침 = үе" },
  { equation: "ㄱ + ㅡ + ㄹ = 글", caption: "Солонгос үе бүтэх жишээ" },
  { equation: "ㅇ + ㅏ = 아", caption: "Эгшиг ㅏ-тай үе" },
  { equation: "ㄱ + ㅏ = 가", caption: "ㄱ + эгшиг ㅏ" },
] as const;

export const KOREAN_TEACHING_VISUAL_RECOMMENDATIONS = [
  { file: "images/hangul-block.png", title: "한글 block diagram", label: "한글 үеийн бүтэц" },
  { file: "images/vowels-chart.png", title: "Vowel chart", label: "Эгшигийн хүснэгт" },
  { file: "images/consonants-chart.png", title: "Consonant chart", label: "Гийгүүлэгчийн хүснэгт" },
  { file: "images/batchim-chart.png", title: "Batchim chart", label: "받침 ( төгсгөл )" },
  { file: "images/similar-sounds.png", title: "Similar sounds", label: "Ижил төстэй дуудлага" },
] as const;
