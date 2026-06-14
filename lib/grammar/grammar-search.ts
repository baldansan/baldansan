import {
  helzuiModuleHref,
} from "@/lib/helzui/load-course";
import { hsk30PointHref } from "@/lib/hsk30-durem/load-course";
import type { HelzuiCourse } from "@/types/helzui-course";
import type { Hsk30DuremCourse } from "@/types/hsk30-durem";

export type GrammarSearchEntry = {
  id: string;
  href: string;
  zh: string;
  pin: string;
  gloss: string;
  levelBadge: string;
  searchBlob: string;
};

function joinSearchParts(parts: (string | null | undefined)[]): string {
  return parts
    .flatMap((part) => (part ? [part] : []))
    .join(" ");
}

export function filterGrammarSearchEntries(
  entries: GrammarSearchEntry[],
  query: string
): GrammarSearchEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  return entries.filter((entry) =>
    entry.searchBlob.toLowerCase().includes(trimmed)
  );
}

export function buildHsk30SearchEntries(course: Hsk30DuremCourse): GrammarSearchEntry[] {
  const entries: GrammarSearchEntry[] = [];

  for (const level of course.levels) {
    for (const point of level.points) {
      entries.push({
        id: `${level.levelId}:${point.id}`,
        href: hsk30PointHref(level.levelId, point.id),
        zh: point.zh,
        pin: point.pin,
        gloss: point.gloss,
        levelBadge: `HSK ${level.level}`,
        searchBlob: joinSearchParts([
          point.zh,
          point.pin,
          point.gloss,
          point.teacher,
          point.structure,
        ]),
      });
    }
  }

  return entries;
}

export function buildHelzuiSearchEntries(
  course: HelzuiCourse,
  modulesBase: string = "/review/grammar/structure"
): GrammarSearchEntry[] {
  const entries: GrammarSearchEntry[] = [];

  for (const module of course.modules) {
    const patternZh = module.patterns?.items.map((row) => row.zh).join(" ");
    const patternMn = module.patterns?.items.map((row) => row.mn).join(" ");
    const conceptText = module.concept.rules
      .map((rule) => `${rule.text} ${rule.eg ?? ""}`)
      .join(" ");
    const markerText = module.marker.join(" ");
    const algorithmText = module.algorithm.join(" ");
    const collocationText = module.collocations
      .map((row) => `${row.head} ${row.options}`)
      .join(" ");

    entries.push({
      id: module.id,
      href: helzuiModuleHref(module.id, modulesBase),
      zh: module.zh,
      pin: module.pinyin,
      gloss: module.mnTitle,
      levelBadge: `Модуль ${module.number}`,
      searchBlob: joinSearchParts([
        module.zh,
        module.pinyin,
        module.mnTitle,
        module.heading,
        module.teacher,
        conceptText,
        patternZh,
        patternMn,
        markerText,
        algorithmText,
        collocationText,
      ]),
    });
  }

  return entries;
}
