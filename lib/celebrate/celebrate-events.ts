/**
 * Тоглоомын мэдрэмж — глобал event-үүд.
 * Ямар ч компонент/lib эдгээрийг dispatch хийнэ; components/celebrate/celebration-layer.tsx
 * нэг л газар сонсоод confetti, «+N оноо» toast, badge modal харуулна.
 * Сервер/SQL хэрэггүй — бүгд browser дотор.
 */

/** Зөв хариулт (quiz, тоглоом, SRS «мэднэ») — жижиг confetti. */
export const CORRECT_ANSWER_EVENT = "bs:correct-answer";

/** Том үйл явдал — хичээл/сорил/үе дууссан: том confetti + badge шалгалт. */
export const CELEBRATE_EVENT = "bs:celebrate";

export type CelebrateKind = "lesson_done" | "quiz_done" | "level_done" | "session_done";

export type CelebrateDetail = {
  kind: CelebrateKind;
  /** Сорилын хувь (0–100) — «анхны 100% сорил» badge-д. */
  percent?: number;
  lessonId?: string;
};

export function emitCorrectAnswer(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(CORRECT_ANSWER_EVENT));
  } catch {
    // ignore
  }
}

export function emitCelebrate(detail: CelebrateDetail): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent<CelebrateDetail>(CELEBRATE_EVENT, { detail }));
  } catch {
    // ignore
  }
}

/** Хэрэглэгч хөдөлгөөн багасгах тохиргоотой юу (confetti-г алгасна). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
