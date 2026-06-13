import type { HskPackageGrammarExercise } from "@/types/hsk-lesson-package";

function norm(s: string): string {
  return s.trim().replace(/\s+/g, "");
}

/** Resolve answer to comparable string (or boolean for judge). */
export function resolveGrammarExerciseAnswer(
  ex: HskPackageGrammarExercise
): string | boolean {
  const raw = ex.answer;
  if (ex.type === "judge") {
    if (typeof raw === "boolean") return raw;
    const s = String(raw ?? "").trim().toLowerCase();
    if (/^(true|t|1|yes|y|对|正确|√|үнэн)$/i.test(s)) return true;
    if (/^(false|f|0|no|n|错|错误|×|худал)$/i.test(s)) return false;
    return s === "true";
  }

  if (ex.type === "choice" && ex.options?.length) {
    const asNum = Number(raw);
    if (Number.isInteger(asNum)) {
      if (asNum >= 1 && asNum <= ex.options.length) {
        return ex.options[asNum - 1];
      }
      if (asNum >= 0 && asNum < ex.options.length) {
        return ex.options[asNum];
      }
    }
    const text = String(raw ?? "").trim();
    const exact = ex.options.find((opt) => opt === text);
    if (exact) return exact;
    return text;
  }

  return String(raw ?? "").trim();
}

export function isGrammarExerciseCorrect(
  ex: HskPackageGrammarExercise,
  userAnswer: string | boolean
): boolean {
  const resolved = resolveGrammarExerciseAnswer(ex);

  if (ex.type === "judge") {
    const userBool =
      typeof userAnswer === "boolean"
        ? userAnswer
        : /^(true|t|1|yes|y|对|正确|√|үнэн)$/i.test(String(userAnswer).trim());
    return userBool === resolved;
  }

  if (ex.type === "fill") {
    return norm(String(userAnswer)) === norm(String(resolved));
  }

  return String(userAnswer).trim() === String(resolved).trim();
}

export function grammarExerciseAnswerLabel(
  ex: HskPackageGrammarExercise
): string {
  const resolved = resolveGrammarExerciseAnswer(ex);
  if (ex.type === "judge") {
    return resolved ? "Үнэн" : "Худал";
  }
  return String(resolved);
}
