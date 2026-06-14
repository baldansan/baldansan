import { getHelzuiCourse } from "@/lib/helzui/load-course";
import type { AnswerBlock } from "@/types/helzui-course";

export const HELZUI_COURSE_ID = "helzui-suuri";

export function formatHelzuiSentence(answer: AnswerBlock[]): string {
  return answer.map((block) => block.w).join("");
}

export type HelzuiQuestionMeta = {
  moduleId: string;
  moduleTitle: string;
  sentenceZh: string;
};

let lookup: Map<string, HelzuiQuestionMeta> | null = null;

function buildHelzuiQuestionLookup(): Map<string, HelzuiQuestionMeta> {
  const map = new Map<string, HelzuiQuestionMeta>();
  for (const mod of getHelzuiCourse().modules) {
    for (const item of [...mod.realExams, ...mod.practice]) {
      if (!item.id) continue;
      map.set(item.id, {
        moduleId: mod.id,
        moduleTitle: mod.mnTitle,
        sentenceZh: formatHelzuiSentence(item.answer),
      });
    }
  }
  return map;
}

export function getHelzuiQuestionMeta(
  questionId: string
): HelzuiQuestionMeta | null {
  if (!lookup) lookup = buildHelzuiQuestionLookup();
  return lookup.get(questionId) ?? null;
}
