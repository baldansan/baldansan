import {
  HSK_PINYIN_ALIASES,
  HSK_TEACHER_NOTE_ALIASES,
  HSK_TONE_ALIASES,
  hskSectionKeyMatches,
} from "@/lib/lesson/hsk-study-section-aliases";
import { parseHskGuidedSteps, withGuidedStepMeta, type HskGuidedStep } from "@/lib/lesson/hsk-guided-step";
import type {
  ChineseHskManifest,
  ChineseHskPackageMeta,
  ChineseHskRawFiles,
} from "@/lib/import/chinese-hsk-normalize";
import { isHskPrelessonProfile } from "@/lib/import/chinese-hsk-profiles";

export type HskStudyContentBundle = {
  studySections: unknown[];
  guidedSteps: unknown[];
  objectives: unknown[];
  pronunciation: unknown;
  pinyinPronunciation: unknown;
  tones: unknown[];
  characters: unknown[];
  grammar: unknown;
  notes: unknown;
  teacherNotes: unknown[];
  texts: unknown;
  workbook: unknown;
  vocabularyNotes: unknown;
  lessonTeaching: unknown;
  media: unknown;
};

export type HskStudyContentImportSummary = {
  studySectionCount: number;
  guidedStepCount: number;
  hasPronunciationContent: boolean;
  hasToneContent: boolean;
  hasTeacherNotes: boolean;
  mediaImageCount: number;
  videoRequired: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function mergeUniqueArrays(...groups: unknown[][]): unknown[] {
  const out: unknown[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    for (const item of group) {
      const key = JSON.stringify(item);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function pickNested(record: unknown, ...paths: string[]): unknown {
  if (!isRecord(record)) return null;
  for (const path of paths) {
    const parts = path.split(".");
    let current: unknown = record;
    for (const part of parts) {
      if (!isRecord(current) || !(part in current)) {
        current = null;
        break;
      }
      current = current[part];
    }
    if (current != null) return current;
  }
  return null;
}

function collectStudySections(
  studyContent: unknown,
  lesson: unknown
): unknown[] {
  const sections: unknown[] = [];
  if (isRecord(studyContent) && Array.isArray(studyContent.studySections)) {
    sections.push(...studyContent.studySections);
  }
  if (isRecord(lesson) && Array.isArray(lesson.studySections)) {
    sections.push(...lesson.studySections);
  }
  return mergeUniqueArrays(sections);
}

function collectObjectives(studyContent: unknown, lesson: unknown): unknown[] {
  return mergeUniqueArrays(
    asArray(pickNested(studyContent, "objectives")),
    asArray(pickNested(lesson, "objectives")),
    asArray(pickNested(lesson, "lessonIntro"))
  );
}

function collectPronunciation(studyContent: unknown, lesson: unknown): unknown {
  return (
    pickNested(studyContent, "pronunciation") ??
    pickNested(studyContent, "sections.pinyin") ??
    pickNested(studyContent, "sections.pronunciation") ??
    pickNested(lesson, "pinyinPronunciation") ??
    pickNested(lesson, "pronunciation") ??
    null
  );
}

function collectTones(studyContent: unknown, lesson: unknown): unknown[] {
  return mergeUniqueArrays(
    asArray(pickNested(studyContent, "tones")),
    asArray(pickNested(studyContent, "sections.tones")),
    asArray(pickNested(lesson, "tones"))
  );
}

function collectTeacherNotes(
  studyContent: unknown,
  notes: unknown,
  lesson: unknown
): unknown[] {
  return mergeUniqueArrays(
    asArray(pickNested(studyContent, "teacherNotes")),
    asArray(pickNested(studyContent, "sections.teacherNotes")),
    asArray(pickNested(notes, "teacherNotes")),
    asArray(pickNested(notes, "teachersBook")),
    asArray(pickNested(lesson, "teacherNotes"))
  );
}

function sectionHasAlias(section: unknown, aliases: readonly string[]): boolean {
  if (!isRecord(section)) return false;
  const labels = [
    section.id,
    section.key,
    section.type,
    section.sectionKey,
    section.title,
    section.name,
  ];
  return labels.some((label) => hskSectionKeyMatches(label, aliases));
}

function bundleHasAliasSections(
  sections: unknown[],
  aliases: readonly string[]
): boolean {
  return sections.some((section) => sectionHasAlias(section, aliases));
}

function bundleHasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.keys(value).length > 0;
  return true;
}

function collectGuidedSteps(studyContent: unknown, lesson: unknown): unknown[] {
  const fromStudy = pickNested(studyContent, "guidedSteps");
  if (Array.isArray(fromStudy) && fromStudy.length > 0) return fromStudy;
  const fromLesson = pickNested(lesson, "guidedSteps");
  if (Array.isArray(fromLesson) && fromLesson.length > 0) return fromLesson;
  return [];
}

function collectCharacters(studyContent: unknown, lesson: unknown): unknown[] {
  return mergeUniqueArrays(
    asArray(pickNested(studyContent, "characters")),
    asArray(pickNested(lesson, "characters"))
  );
}

function countMediaImages(media: unknown): number {
  if (!isRecord(media)) return 0;
  return Array.isArray(media.images) ? media.images.length : 0;
}

function videoRequiredFromMedia(media: unknown, lesson: unknown): boolean {
  if (isRecord(lesson) && trim(lesson.videoFile)) return true;
  if (!isRecord(media)) return false;
  const videos = media.videos;
  if (!Array.isArray(videos) || videos.length === 0) return false;
  return videos.some((item) => {
    if (!isRecord(item)) return false;
    return Boolean(trim(item.embedUrl) || trim(item.url) || trim(item.videoUrl));
  });
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function buildDefaultGuidedSteps(
  bundle: Pick<
    HskStudyContentBundle,
    "teacherNotes" | "pronunciation" | "tones"
  >,
  manifest: ChineseHskManifest
): HskGuidedStep[] {
  const prelesson = isHskPrelessonProfile(manifest.lessonProfile);

  const steps = [
    {
      id: "teacher-intro",
      type: "teacher-intro",
      titleMn: "Багшийн тайлбар",
      teacherSpeechMn: "",
      bulletsMn: [],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      imageId: "",
      mediaSection: "teacher",
      items: bundle.teacherNotes,
    },
    ...(prelesson
      ? []
      : [
          {
            id: "key-phrase",
            type: "key-phrase" as const,
            titleMn: "Гол хэллэг",
            teacherSpeechMn: "",
            bulletsMn: [],
            chinese: "",
            pinyin: "",
            mongolian: "",
            examples: [],
            imageId: "",
            mediaSection: "hero",
            items: [],
          },
        ]),
    {
      id: "pinyin",
      type: "pinyin",
      titleMn: "Pinyin",
      teacherSpeechMn: "",
      bulletsMn: [],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      imageId: "",
      mediaSection: "pinyin",
      items: bundle.pronunciation ? [bundle.pronunciation] : [],
    },
    {
      id: "tones",
      type: "tones",
      titleMn: "Хөг / Дууны өнгө",
      teacherSpeechMn: "",
      bulletsMn: [],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      imageId: "",
      mediaSection: "tone",
      items: bundle.tones,
    },
    ...(prelesson
      ? []
      : [
          {
            id: "vocabulary",
            type: "vocabulary" as const,
            titleMn: "Үгийн сан",
            teacherSpeechMn: "",
            bulletsMn: [],
            chinese: "",
            pinyin: "",
            mongolian: "",
            examples: [],
            imageId: "",
            mediaSection: "vocabulary",
            items: [],
          },
          {
            id: "dialogue",
            type: "dialogue" as const,
            titleMn: "Ярианы дасгал",
            teacherSpeechMn: "",
            bulletsMn: [],
            chinese: "",
            pinyin: "",
            mongolian: "",
            examples: [],
            imageId: "",
            mediaSection: "dialogue",
            items: [],
          },
        ]),
    {
      id: "practice-menu",
      type: "practice-menu",
      titleMn: "Дасгал",
      teacherSpeechMn: "",
      bulletsMn: [],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      imageId: "",
      mediaSection: "practice",
      items: [],
    },
    {
      id: "complete",
      type: "complete",
      titleMn: "Дууслаа",
      teacherSpeechMn: "",
      bulletsMn: [],
      chinese: "",
      pinyin: "",
      mongolian: "",
      examples: [],
      imageId: "",
      mediaSection: "complete",
      items: [],
    },
  ];

  return steps.map((step) =>
    withGuidedStepMeta({
      ...(step as Omit<HskGuidedStep, "sourceType" | "toneLayout">),
      sourceType: step.type,
    })
  );
}

export function buildHskStudyContentBundle(
  raw: ChineseHskRawFiles,
  _manifest: ChineseHskManifest,
  _meta: ChineseHskPackageMeta
): HskStudyContentBundle {
  const studyContent = raw.studyContent ?? null;
  const lesson = raw.lesson ?? null;
  const notes = raw.notes ?? null;
  const grammar = raw.grammar ?? null;
  const texts = raw.texts ?? null;
  const workbook = raw.workbook ?? null;
  const vocabulary = raw.vocabulary ?? null;

  const lessonTeaching = isRecord(lesson)
    ? Object.fromEntries(
        Object.entries(lesson).filter(
          ([key]) =>
            ![
              "title",
              "mongolianTitle",
              "chineseTitle",
              "targetTitle",
              "subtitle",
              "description",
              "duration",
              "orderIndex",
              "order_index",
              "status",
              "thumbnailFile",
              "audioFile",
              "videoFile",
              "courseId",
              "lessonId",
              "language",
              "mediaStatus",
              "studySections",
              "objectives",
              "lessonIntro",
              "guidedSteps",
            ].includes(key)
        )
      )
    : null;

  const studySections = collectStudySections(studyContent, lesson);
  const guidedStepsRaw = collectGuidedSteps(studyContent, lesson);
  const pronunciation = collectPronunciation(studyContent, lesson);
  const tones = collectTones(studyContent, lesson);
  const characters = collectCharacters(studyContent, lesson);
  const media =
    raw.media ??
    pickNested(studyContent, "media") ??
    pickNested(lesson, "media") ??
    null;

  const partialBundle = {
    studySections,
    objectives: collectObjectives(studyContent, lesson),
    pronunciation,
    pinyinPronunciation: pronunciation,
    tones,
    characters,
    grammar: grammar ?? pickNested(studyContent, "grammar") ?? null,
    notes: notes ?? pickNested(studyContent, "notes") ?? null,
    teacherNotes: collectTeacherNotes(studyContent, notes, lesson),
    texts: texts ?? pickNested(studyContent, "texts") ?? null,
    workbook: workbook ?? pickNested(studyContent, "workbook") ?? null,
    vocabularyNotes: pickNested(studyContent, "vocabularyNotes") ?? vocabulary,
    lessonTeaching: Object.keys(lessonTeaching ?? {}).length ? lessonTeaching : null,
    media,
  };

  const guidedSteps =
    guidedStepsRaw.length > 0
      ? guidedStepsRaw
      : buildDefaultGuidedSteps(
          {
            teacherNotes: partialBundle.teacherNotes,
            pronunciation: partialBundle.pronunciation,
            tones: partialBundle.tones,
          },
          _manifest
        );

  return {
    ...partialBundle,
    guidedSteps,
  };
}

export function summarizeHskStudyContentBundle(
  bundle: HskStudyContentBundle
): HskStudyContentImportSummary {
  const hasPronunciationContent =
    bundleHasContent(bundle.pronunciation) ||
    bundleHasAliasSections(bundle.studySections, HSK_PINYIN_ALIASES);

  const hasToneContent =
    bundle.tones.length > 0 ||
    bundleHasAliasSections(bundle.studySections, HSK_TONE_ALIASES);

  const hasTeacherNotes =
    bundle.teacherNotes.length > 0 ||
    bundleHasAliasSections(bundle.studySections, HSK_TEACHER_NOTE_ALIASES) ||
    bundleHasContent(pickNested(bundle.notes, "teacherNotes"));

  return {
    studySectionCount: bundle.studySections.length,
    guidedStepCount: parseHskGuidedSteps(bundle.guidedSteps).length,
    hasPronunciationContent,
    hasToneContent,
    hasTeacherNotes,
    mediaImageCount: countMediaImages(bundle.media),
    videoRequired: videoRequiredFromMedia(bundle.media, null),
  };
}

export function buildChineseHskSourceNoteJson(
  manifest: ChineseHskManifest,
  bundle: HskStudyContentBundle,
  existingNote?: string | null
): string {
  const hskStudyContent = {
    guidedSteps: bundle.guidedSteps,
    studySections: bundle.studySections,
    objectives: bundle.objectives,
    pronunciation: bundle.pronunciation,
    pinyinPronunciation: bundle.pinyinPronunciation,
    tones: bundle.tones,
    characters: bundle.characters,
    grammar: bundle.grammar,
    notes: bundle.notes,
    teacherNotes: bundle.teacherNotes,
    texts: bundle.texts,
    workbook: bundle.workbook,
    vocabularyNotes: bundle.vocabularyNotes,
    lessonTeaching: bundle.lessonTeaching,
    ...(bundle.media != null ? { media: bundle.media } : {}),
  };

  const payload: Record<string, unknown> = {
    courseType: manifest.courseType,
    hskLevel: manifest.hskLevel,
    lessonProfile: manifest.lessonProfile,
    lessonId: manifest.lessonId,
    hskPackageVersion: manifest.packageVersion,
    hskStudyContent,
  };

  if (manifest.bookPart) payload.bookPart = manifest.bookPart;
  if (manifest.lessonNumber != null) payload.lessonNumber = manifest.lessonNumber;
  if (manifest.lessonType) payload.lessonType = manifest.lessonType;

  const verification = manifest.verification;
  if (verification?.answerStatus) payload.answerStatus = verification.answerStatus;
  if (verification?.textStatus) payload.textStatus = verification.textStatus;

  const parsedExisting = existingNote?.trim();
  if (parsedExisting?.startsWith("{")) {
    try {
      const existing = JSON.parse(parsedExisting) as Record<string, unknown>;
      for (const key of ["teachingImages", "vocabAudio", "vocabPronMn", "packageLessonId"]) {
        if (existing[key] != null) payload[key] = existing[key];
      }
    } catch {
      // ignore invalid existing JSON
    }
  }

  return JSON.stringify(payload);
}
