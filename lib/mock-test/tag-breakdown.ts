import { skillTagCategory, skillTagLabelMn } from "@/lib/mock-test/skill-tag-labels";
import type { MockTestAnswerDetail, MockTestQuestionRow } from "@/lib/mock-test/types";

/**
 * Шалгалтын дүнг чадварын шошгоор (sk.*, gr.*) задална — «Чадварын задаргаа».
 * Хамгийн сул нь эхэндээ. Гараар дүгнэх (isCorrect=null) асуултуудыг тооцохгүй.
 */

export type TagBreakdownRow = {
  tag: string;
  label: string;
  category: "skill" | "grammar";
  total: number;
  correct: number;
  /** 0..100 */
  percent: number;
  /** Энэ шошготой асуултууд голдуу аль чадварын (listening/reading/writing) */
  skill: string;
  /** Алдсан асуултын дугаарууд */
  wrongQNos: number[];
};

export const WEAK_TAG_THRESHOLD = 60;
/** Нэг-хоёр асуулттай шошго дээр дүгнэлт хийхгүй. */
export const MIN_TAG_QUESTIONS = 2;

export function buildTagBreakdown(
  questions: MockTestQuestionRow[],
  details: MockTestAnswerDetail[]
): TagBreakdownRow[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const acc = new Map<
    string,
    { total: number; correct: number; skills: Map<string, number>; wrong: number[] }
  >();

  for (const d of details) {
    if (d.isCorrect === null) continue;
    const q = byId.get(d.questionId);
    if (!q) continue;
    for (const tag of q.tags) {
      const cat = skillTagCategory(tag);
      if (cat !== "skill" && cat !== "grammar") continue;
      let row = acc.get(tag);
      if (!row) {
        row = { total: 0, correct: 0, skills: new Map(), wrong: [] };
        acc.set(tag, row);
      }
      row.total++;
      if (d.isCorrect) row.correct++;
      else row.wrong.push(d.qNo);
      row.skills.set(q.skill, (row.skills.get(q.skill) ?? 0) + 1);
    }
  }

  const rows: TagBreakdownRow[] = [];
  for (const [tag, r] of acc) {
    let skill = "reading";
    let best = -1;
    for (const [s, n] of r.skills) {
      if (n > best) {
        best = n;
        skill = s;
      }
    }
    rows.push({
      tag,
      label: skillTagLabelMn(tag),
      category: skillTagCategory(tag) as "skill" | "grammar",
      total: r.total,
      correct: r.correct,
      percent: r.total ? Math.round((r.correct / r.total) * 100) : 0,
      skill,
      wrongQNos: r.wrong.sort((a, b) => a - b),
    });
  }

  // Сул нь эхэндээ; тэнцүү бол олон асуулттай нь эхэндээ.
  rows.sort((a, b) => a.percent - b.percent || b.total - a.total);
  return rows;
}

export function weakTags(rows: TagBreakdownRow[]): TagBreakdownRow[] {
  return rows.filter((r) => r.total >= MIN_TAG_QUESTIONS && r.percent < WEAK_TAG_THRESHOLD);
}
