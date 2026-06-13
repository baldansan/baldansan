import type { MockTestSkill } from "@/lib/mock-test/section-timing";
import { parseMockTestSkill } from "@/lib/mock-test/section-timing";
import type { MockTestAnswers, MockTestExamMode } from "@/lib/mock-test/types";

const STORAGE_PREFIX = "bs:mock-exam:";

export type MockExamSavedProgress = {
  testId: string;
  examMode: MockTestExamMode;
  answers: MockTestAnswers;
  skill: MockTestSkill;
  currentQNo: number;
  secondsLeft: number;
  sectionTotalSeconds: number;
  updatedAt: string;
};

function storageKey(testId: string): string {
  return `${STORAGE_PREFIX}${testId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getMockExamProgress(testId: string): MockExamSavedProgress | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(testId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockExamSavedProgress;
    return {
      ...parsed,
      skill: parseMockTestSkill(parsed.skill),
    };
  } catch {
    return null;
  }
}

export function saveMockExamProgress(
  data: Omit<MockExamSavedProgress, "updatedAt">
): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      storageKey(data.testId),
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // quota
  }
}

export function clearMockExamProgress(testId: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(storageKey(testId));
}

export function countMockExamAnswered(answers: MockTestAnswers): number {
  return Object.values(answers).filter((value) => (value ?? "").trim()).length;
}

export function hasMockExamSavedProgress(
  testId: string,
  examMode: MockTestExamMode
): boolean {
  const saved = getMockExamProgress(testId);
  if (!saved || saved.examMode !== examMode) return false;
  return countMockExamAnswered(saved.answers) > 0;
}
