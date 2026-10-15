import courseData from "@/src/data/hsk30-durem.json";
import type { Hsk30DuremCourse, Hsk30Level, Hsk30Point } from "@/types/hsk30-durem";

export {
  HSK30_DUREM_COURSE_ID,
  HSK30_REVIEW_BASE,
  hsk30LevelHref,
  hsk30PointHref,
} from "./hrefs";

export const hsk30Course = courseData as Hsk30DuremCourse;

export function getHsk30Course(): Hsk30DuremCourse {
  return hsk30Course;
}

export function getHsk30Level(levelId: string): Hsk30Level | null {
  return hsk30Course.levels.find((level) => level.levelId === levelId) ?? null;
}

export function getHsk30Point(
  levelId: string,
  pointId: string
): { level: Hsk30Level; point: Hsk30Point } | null {
  const level = getHsk30Level(levelId);
  if (!level) return null;
  const point = level.points.find((p) => p.id === pointId);
  if (!point) return null;
  return { level, point };
}

