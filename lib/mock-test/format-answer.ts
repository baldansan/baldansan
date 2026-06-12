import type { MockOption, MockTestQuestionRow } from "@/lib/mock-test/types";

function optionLabel(options: MockOption[] | null, key: string): string {
  if (!key) return "—";
  const opt = options?.find((item) => item.key === key);
  if (!opt) return key;
  if (opt.text) return `${opt.key}. ${opt.text}`;
  return opt.key;
}

/** Хариултыг харагдах текст болгоно. */
export function formatMockTestAnswer(
  question: MockTestQuestionRow,
  answer: string | null | undefined
): string {
  const value = (answer ?? "").trim();
  if (!value) return "Хариулаагүй";

  if (question.q_type === "judge") {
    return value === "√" ? "Зөв (√)" : "Буруу (×)";
  }

  if (
    question.q_type === "order" ||
    question.q_type === "complete" ||
    question.q_type === "fill_char" ||
    question.q_type === "essay" ||
    question.q_type === "summary" ||
    question.q_type === "picture_sentence"
  ) {
    return value;
  }

  return optionLabel(question.options, value);
}

export function formatCorrectAnswer(question: MockTestQuestionRow): string {
  const value = (question.correct_answer ?? "").trim();
  if (!value) return "—";

  if (question.q_type === "judge") {
    return value === "√" ? "Зөв (√)" : "Буруу (×)";
  }

  if (
    question.q_type === "order" ||
    question.q_type === "complete" ||
    question.q_type === "fill_char" ||
    question.q_type === "essay" ||
    question.q_type === "summary" ||
    question.q_type === "picture_sentence"
  ) {
    return value;
  }

  return optionLabel(question.options, value);
}
