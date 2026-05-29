export type TtsLang = "ko-KR" | "zh-CN";

/** Korean Hangul + CJK Hanja used in Korean lessons. */
const TARGET_SCRIPT_RE =
  /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF]/;

export function inferTtsLangFromCourseId(courseId?: string | null): TtsLang {
  if (!courseId) return "zh-CN";
  const id = courseId.toLowerCase();
  if (id.startsWith("korean") || id.includes("korean")) return "ko-KR";
  if (id.startsWith("hsk") || id.includes("chinese")) return "zh-CN";
  return "zh-CN";
}

export function inferTtsLangFromHskLevel(level?: string | null): TtsLang {
  if (!level) return "zh-CN";
  if (level.toUpperCase().startsWith("KR")) return "ko-KR";
  return "zh-CN";
}

export function resolveTtsLang(input: {
  lang?: string;
  courseId?: string | null;
  hskLevel?: string | null;
}): TtsLang {
  if (input.lang === "ko-KR" || input.lang === "zh-CN") {
    return input.lang;
  }
  if (input.lang?.toLowerCase().startsWith("ko")) return "ko-KR";
  if (input.lang?.toLowerCase().startsWith("zh")) return "zh-CN";
  if (input.hskLevel) return inferTtsLangFromHskLevel(input.hskLevel);
  return inferTtsLangFromCourseId(input.courseId);
}

export function containsTargetScript(text: string): boolean {
  return TARGET_SCRIPT_RE.test(text);
}
