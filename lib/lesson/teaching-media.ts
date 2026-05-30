import { inferLessonLanguage } from "@/lib/language-track";
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

const SOURCE_NOTE_SEP = " · ";

function parseSourceNoteSegment(
  sourceNote: string | undefined | null,
  key: string
): string | null {
  if (!sourceNote?.trim()) return null;
  for (const part of sourceNote.split(SOURCE_NOTE_SEP)) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${key}=`)) {
      return trimmed.slice(key.length + 1);
    }
  }
  return null;
}

function removeSourceNoteSegment(
  sourceNote: string | undefined | null,
  key: string
): string {
  if (!sourceNote?.trim()) return "";
  return sourceNote
    .split(SOURCE_NOTE_SEP)
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${key}=`))
    .join(SOURCE_NOTE_SEP);
}

function appendSourceNoteSegment(
  sourceNote: string | undefined | null,
  key: string,
  value: string
): string {
  const base = removeSourceNoteSegment(sourceNote, key);
  const segment = `${key}=${value}`;
  return base ? `${base}${SOURCE_NOTE_SEP}${segment}` : segment;
}

export function parseTeachingImagesFromSourceNote(
  sourceNote?: string | null
): TeachingImage[] {
  const raw = parseSourceNoteSegment(sourceNote, "teachingImages");
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
  const raw = parseSourceNoteSegment(sourceNote, "vocabAudio");
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

export function mergeTeachingMediaIntoSourceNote(
  sourceNote: string | undefined | null,
  teachingImages: TeachingImage[],
  vocabAudio: Record<string, string>
): string {
  let note = sourceNote?.trim() ?? "";

  if (teachingImages.length > 0) {
    note = appendSourceNoteSegment(
      note,
      "teachingImages",
      JSON.stringify(
        teachingImages.map(({ type, title, url, caption, file }) => ({
          type,
          title,
          url,
          ...(caption ? { caption } : {}),
          ...(file ? { file } : {}),
        }))
      )
    );
  }

  const audioKeys = Object.keys(vocabAudio);
  if (audioKeys.length > 0) {
    note = appendSourceNoteSegment(note, "vocabAudio", JSON.stringify(vocabAudio));
  }

  return note;
}

export function enrichLessonTeachingMedia(lesson: LessonContent): LessonContent {
  const teachingImages = parseTeachingImagesFromSourceNote(lesson.sourceNote);
  const vocabularyAudioMap = parseVocabularyAudioMapFromSourceNote(lesson.sourceNote);

  const vocabulary =
    Object.keys(vocabularyAudioMap).length === 0
      ? lesson.vocabulary
      : lesson.vocabulary.map((word) => {
          const audioUrl = resolveVocabularyAudioUrl(word, vocabularyAudioMap);
          if (!audioUrl || word.audioUrl === audioUrl) return word;
          return { ...word, audioUrl };
        });

  const unchanged =
    teachingImages.length === (lesson.teachingImages?.length ?? 0) &&
    vocabulary === lesson.vocabulary &&
    !lesson.vocabularyAudioMap;

  if (unchanged && !teachingImages.length) {
    return lesson;
  }

  return {
    ...lesson,
    ...(teachingImages.length ? { teachingImages } : {}),
    ...(Object.keys(vocabularyAudioMap).length
      ? { vocabularyAudioMap }
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
