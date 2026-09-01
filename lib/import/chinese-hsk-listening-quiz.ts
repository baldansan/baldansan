import type { NormalizedZipQuiz } from "@/lib/import/lesson-zip-normalize";

/**
 * listening_quiz_draft.json → quiz rows.
 *
 * Content packages ship listening questions in a separate draft file
 * (see BUUNDUU_CHINESE_HSK_PACKAGE_V1.md). Items merge into the lesson quiz
 * as multiple_choice questions with an audio clip:
 *
 * ```json
 * [
 *   {
 *     "id": "listening-01",
 *     "question": "Сонсоод зөв хариуг сонго.",
 *     "audio": "audio/hsk5a-l12-wb-q01.mp3",
 *     "options": ["...", "...", "..."],
 *     "answer": "1",            // option index ("0"-based) OR option text
 *     "explanation_mn": "..."
 *   }
 * ]
 * ```
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function parseOptionList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (isRecord(item)) {
        return trim(item.text ?? item.label ?? item.value ?? item.option);
      }
      return "";
    })
    .filter(Boolean);
}

/** Resolve answer given as option index ("0", 1) or as option text. */
function resolveCorrectAnswer(raw: unknown, options: string[]): string {
  const text = trim(raw);
  if (!text) return "";
  if (/^\d+$/.test(text)) {
    const index = Number(text);
    if (index >= 0 && index < options.length) return options[index];
  }
  const byText = options.find((option) => option === text);
  return byText ?? text;
}

export function readListeningQuizDraftRows(raw: unknown): Record<string, unknown>[] {
  const list = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.questions)
      ? raw.questions
      : null;
  if (!list) return [];
  return list.filter(isRecord);
}

/**
 * Normalize listening draft items into quiz rows appended after quiz.json.
 * Invalid rows are skipped with a warning (draft file never blocks import).
 */
export function normalizeListeningQuizDraft(
  raw: unknown,
  startOrderIndex: number,
  warnings: string[]
): NormalizedZipQuiz[] {
  const rows = readListeningQuizDraftRows(raw);
  if (rows.length === 0) {
    if (raw != null) {
      warnings.push(
        "listening_quiz_draft.json: no valid question rows found — file ignored."
      );
    }
    return [];
  }

  const normalized: NormalizedZipQuiz[] = [];

  rows.forEach((item, index) => {
    const question =
      trim(item.question ?? item.prompt ?? item.promptMn ?? item.prompt_mn) ||
      "Сонсоод зөв хариуг сонго.";
    const options = parseOptionList(item.options);
    const audioFile = trim(
      item.audio ?? item.audioFile ?? item.audio_file ?? item.audioUrl ?? item.audio_url
    );
    const correctAnswer = resolveCorrectAnswer(
      item.answer ?? item.correctAnswer ?? item.correct_answer,
      options
    );

    if (options.length < 2) {
      warnings.push(
        `listening_quiz_draft[${index}]: needs at least 2 options — skipped.`
      );
      return;
    }
    if (!correctAnswer || !options.includes(correctAnswer)) {
      warnings.push(
        `listening_quiz_draft[${index}]: answer missing or not among options — skipped.`
      );
      return;
    }
    if (!audioFile) {
      warnings.push(
        `listening_quiz_draft[${index}]: audio missing — imported without audio clip.`
      );
    }

    normalized.push({
      id: trim(item.id) || `listening-${index + 1}`,
      type: "multiple_choice",
      question,
      options,
      correctAnswer,
      explanation:
        trim(item.explanation ?? item.explanationMn ?? item.explanation_mn) ||
        undefined,
      skillTags: ["listening"],
      difficulty: trim(item.difficulty) || undefined,
      lessonSection: "listening",
      orderIndex: startOrderIndex + index + 1,
      audioFile: audioFile || undefined,
    });
  });

  return normalized;
}
