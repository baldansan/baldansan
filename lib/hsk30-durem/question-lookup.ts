import { getHsk30Course } from "@/lib/hsk30-durem/load-course";

export type Hsk30QuestionMeta = {
  levelId: string;
  levelTitle: string;
  pointId: string;
  pointZh: string;
  questionText: string;
};

let lookup: Map<string, Hsk30QuestionMeta> | null = null;

function buildLookup(): Map<string, Hsk30QuestionMeta> {
  const map = new Map<string, Hsk30QuestionMeta>();
  for (const level of getHsk30Course().levels) {
    for (const point of level.points) {
      for (const ex of point.exercises ?? []) {
        map.set(ex.id, {
          levelId: level.levelId,
          levelTitle: level.title,
          pointId: point.id,
          pointZh: point.zh,
          questionText: ex.q,
        });
      }
      if (point.check) {
        map.set(point.check.id, {
          levelId: level.levelId,
          levelTitle: level.title,
          pointId: point.id,
          pointZh: point.zh,
          questionText: point.check.q,
        });
      }
    }
  }
  return map;
}

export function getHsk30QuestionMeta(
  questionId: string
): Hsk30QuestionMeta | null {
  if (!lookup) lookup = buildLookup();
  return lookup.get(questionId) ?? null;
}
