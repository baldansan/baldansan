/** Бичих хэсгийн AI үнэлгээний хариу (app/api/mock-test/grade-writing). */

export type WritingGradeCriterion = {
  name_mn: string;
  /** 1–5 */
  score: number;
  comment_mn: string;
};

export type WritingGradeCorrection = {
  wrong: string;
  right: string;
  why_mn: string;
};

export type WritingGradeReply = {
  /** 0–100 (60 = тэнцэх босго) */
  score: number;
  passed: boolean;
  wordCount: number;
  criteria: WritingGradeCriterion[];
  corrections: WritingGradeCorrection[];
  improvedZh: string;
  adviceMn: string;
  model: string;
};

export type WritingGradeApiResponse =
  | { ok: true; reply: WritingGradeReply }
  | { ok: false; message: string; fallback?: boolean };

export async function requestWritingGrade(
  questionId: string,
  answer: string
): Promise<WritingGradeApiResponse> {
  try {
    const res = await fetch("/api/mock-test/grade-writing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionId, answer }),
    });
    const data = (await res.json()) as WritingGradeApiResponse;
    if (!res.ok && data && "ok" in data && data.ok === false) return data;
    if (!res.ok) return { ok: false, message: `Сервер ${res.status}` };
    return data;
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Сүлжээний алдаа" };
  }
}
