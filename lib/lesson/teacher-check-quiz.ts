import type { HskTeacherCheckQuiz } from "@/types/hsk-lesson-package";

/** Map numeric index answers (1-based or 0-based) to option label text. */
export function resolveTeacherCheckAnswer(check: HskTeacherCheckQuiz): string {
  const raw = String(check.answer ?? "").trim();
  if (!raw) return "";

  const asNum = Number(raw);
  // Багцын тоон хариулт нь 0-ээс эхэлсэн индекс (Python `idx`, _tools/GUIDE.md;
  // hsk3/fazhan бүх багц ийм). Урьд нь 1-ээс эхэлсэн гэж уншдаг байсан тул
  // бүх choice асуултын зөв хариулт нэгээр зөрж байв (багшийн 2026-10-17 мэдээлэл).
  // Зөвхөн options.length-тэй тэнцүү тоо л 1-ээс эхэлсэн гэж тайлбарлана.
  if (Number.isInteger(asNum) && check.options.length > 0) {
    if (asNum >= 0 && asNum < check.options.length) {
      return check.options[asNum];
    }
    if (asNum === check.options.length) {
      return check.options[asNum - 1];
    }
  }

  const exact = check.options.find((opt) => opt === raw);
  if (exact) return exact;

  return raw;
}
