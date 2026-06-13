import type { HskTeacherCheckQuiz } from "@/types/hsk-lesson-package";

/** Map numeric index answers (1-based or 0-based) to option label text. */
export function resolveTeacherCheckAnswer(check: HskTeacherCheckQuiz): string {
  const raw = String(check.answer ?? "").trim();
  if (!raw) return "";

  const asNum = Number(raw);
  if (Number.isInteger(asNum) && check.options.length > 0) {
    if (asNum >= 1 && asNum <= check.options.length) {
      return check.options[asNum - 1];
    }
    if (asNum >= 0 && asNum < check.options.length) {
      return check.options[asNum];
    }
  }

  const exact = check.options.find((opt) => opt === raw);
  if (exact) return exact;

  return raw;
}
