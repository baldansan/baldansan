import type { MockTestRow, MockTestSection } from "@/lib/mock-test/types";

export const MOCK_TEST_SKILL_ORDER = [
  "listening",
  "reading",
  "writing",
] as const;

export type MockTestSkill = (typeof MOCK_TEST_SKILL_ORDER)[number];

const DEFAULT_SECTION_MINUTES: Record<
  number,
  Partial<Record<MockTestSkill, number>>
> = {
  5: { listening: 30, reading: 45, writing: 40 },
  4: { listening: 30, reading: 40, writing: 25 },
  3: { listening: 35, reading: 30, writing: 15 },
  2: { listening: 25, reading: 22 },
  1: { listening: 15, reading: 17 },
};

export function orderedSkillsForTest(test: MockTestRow): MockTestSkill[] {
  const present = new Set(
    test.sections.map((section) => section.skill).filter(Boolean)
  );
  return MOCK_TEST_SKILL_ORDER.filter((skill) => present.has(skill));
}

export function parseMockTestSkill(
  value: string | null | undefined,
  fallback: MockTestSkill = "listening"
): MockTestSkill {
  if (value === "listening" || value === "reading" || value === "writing") {
    return value;
  }
  return fallback;
}

function defaultMinutesForLevel(
  hskLevel: number,
  skill: string
): number {
  const levelDefaults = DEFAULT_SECTION_MINUTES[hskLevel];
  if (levelDefaults) {
    const mins = levelDefaults[skill as MockTestSkill];
    if (mins != null && mins > 0) return mins;
  }
  if (skill === "writing") return 30;
  if (skill === "reading") return 40;
  return 30;
}

export function resolveSectionTimeMinutes(
  test: MockTestRow,
  skill: string
): number {
  const section = test.sections.find((item) => item.skill === skill);
  if (section?.time_min != null && section.time_min > 0) {
    return section.time_min;
  }
  return defaultMinutesForLevel(test.hsk_level, skill);
}

export function totalRealExamMinutes(test: MockTestRow): number {
  return orderedSkillsForTest(test).reduce(
    (sum, skill) => sum + resolveSectionTimeMinutes(test, skill),
    0
  );
}

export function sectionQuestionCount(
  questions: Array<{ skill: string }>,
  skill: string
): number {
  return questions.filter((question) => question.skill === skill).length;
}

export function parseSectionTimeMin(section: MockTestSection): number | undefined {
  const raw = section.time_min;
  if (raw == null || !Number.isFinite(raw) || raw <= 0) return undefined;
  return Math.round(raw);
}
