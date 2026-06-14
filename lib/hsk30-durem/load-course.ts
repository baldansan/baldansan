import courseData from "@/src/data/hsk30-durem.json";
import type { Hsk30DuremCourse, Hsk30Level, Hsk30Point } from "@/types/hsk30-durem";

export const HSK30_DUREM_COURSE_ID = "hsk30-durem";
export const HSK30_REVIEW_BASE = "/review/grammar/hsk30";

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

export function hsk30LevelHref(levelId: string): string {
  return `${HSK30_REVIEW_BASE}/${levelId}`;
}

export function hsk30PointHref(levelId: string, pointId: string): string {
  return `${HSK30_REVIEW_BASE}/${levelId}/${pointId}`;
}
