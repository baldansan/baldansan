export type DetectedPackageType = "korean" | "chinese" | "unknown";

export type PackageDetectionInput = {
  manifest?: Record<string, unknown> | null;
  lesson?: Record<string, unknown> | null;
  vocabularyRows?: Record<string, unknown>[];
};

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Infer whether a ZIP package is Korean or Chinese/HSK from manifest + sample rows. */
export function detectLessonPackageType(input: PackageDetectionInput): {
  type: DetectedPackageType;
  reason: string;
} {
  let koreanScore = 0;
  let chineseScore = 0;
  const koreanReasons: string[] = [];
  const chineseReasons: string[] = [];

  const manifest = input.manifest;
  const lesson = input.lesson;

  const lang = trim(manifest?.language).toLowerCase();
  if (lang === "ko-kr" || lang.startsWith("ko")) {
    koreanScore += 4;
    koreanReasons.push(`manifest.language=${trim(manifest?.language)}`);
  }
  if (lang === "zh-cn" || lang === "zh-mn" || lang.startsWith("zh")) {
    chineseScore += 4;
    chineseReasons.push(`manifest.language=${trim(manifest?.language)}`);
  }

  const courseId = trim(manifest?.courseId ?? lesson?.courseId).toLowerCase();
  if (courseId.startsWith("korean")) {
    koreanScore += 3;
    koreanReasons.push(`courseId=${courseId}`);
  }
  if (courseId.includes("hsk") || courseId.includes("chinese")) {
    chineseScore += 3;
    chineseReasons.push(`courseId=${courseId}`);
  }

  for (const source of [manifest, lesson]) {
    if (!source) continue;
    if (trim(source.targetTitle ?? source.target_title)) {
      koreanScore += 1;
      koreanReasons.push("targetTitle");
    }
    if (trim(source.koreanTitle ?? source.korean_title)) {
      koreanScore += 2;
      koreanReasons.push("koreanTitle");
    }
    const lessonType = trim(source.lessonType ?? source.lesson_type).toLowerCase();
    if (lessonType === "hangul" || lessonType === "prelesson") {
      koreanScore += 2;
      koreanReasons.push(`lessonType=${lessonType}`);
    }
    if (trim(source.chineseTitle ?? source.chinese_title) && !trim(source.koreanTitle)) {
      chineseScore += 1;
    }
  }

  for (const row of input.vocabularyRows ?? []) {
    if (!isRecord(row)) continue;
    if (trim(row.korean)) {
      koreanScore += 3;
      koreanReasons.push("vocabulary.korean");
    }
    if (trim(row.romanization)) {
      koreanScore += 2;
      koreanReasons.push("vocabulary.romanization");
    }
    if (trim(row.chinese) && !trim(row.korean)) {
      chineseScore += 2;
      chineseReasons.push("vocabulary.chinese");
    }
    if (trim(row.pinyin) && !trim(row.romanization)) {
      chineseScore += 2;
      chineseReasons.push("vocabulary.pinyin");
    }
    const level = trim(row.hskLevel ?? row.hsk_level);
    if (level.toUpperCase().startsWith("HSK")) {
      chineseScore += 3;
      chineseReasons.push(`vocabulary.hskLevel=${level}`);
    }
    if (level.toUpperCase().startsWith("KR")) {
      koreanScore += 1;
    }
  }

  if (koreanScore > chineseScore && koreanScore >= 3) {
    return {
      type: "korean",
      reason: [...new Set(koreanReasons)].join(", ") || "Korean package signals",
    };
  }
  if (chineseScore > koreanScore && chineseScore >= 3) {
    return {
      type: "chinese",
      reason: [...new Set(chineseReasons)].join(", ") || "Chinese/HSK package signals",
    };
  }
  if (koreanScore >= 3 && chineseScore >= 3) {
    if (lang.startsWith("ko")) {
      return { type: "korean", reason: "Tie-break: manifest language is Korean" };
    }
    if (lang.startsWith("zh")) {
      return { type: "chinese", reason: "Tie-break: manifest language is Chinese" };
    }
  }
  if (koreanScore >= 4) {
    return { type: "korean", reason: koreanReasons.join(", ") };
  }
  if (chineseScore >= 4) {
    return { type: "chinese", reason: chineseReasons.join(", ") };
  }

  return { type: "unknown", reason: "Insufficient track signals in manifest/vocabulary" };
}
