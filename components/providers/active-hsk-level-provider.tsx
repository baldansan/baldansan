"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ACTIVE_HSK_LEVEL_KEY,
  collectLessonHskLevels,
  readStoredActiveHskLevel,
  resolveDefaultActiveHskLevel,
  writeStoredActiveHskLevel,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";

type ActiveHskLevelContextValue = {
  level: ActiveHskLevel;
  setLevel: (level: ActiveHskLevel) => void;
  registerContentLevels: (levels: number[]) => void;
  hydrated: boolean;
};

const ActiveHskLevelContext = createContext<ActiveHskLevelContextValue | null>(
  null
);

export function ActiveHskLevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<ActiveHskLevel>(5);
  const [hydrated, setHydrated] = useState(false);
  const [contentLevels, setContentLevels] = useState<number[]>([]);

  useEffect(() => {
    const stored = readStoredActiveHskLevel();
    setLevelState(resolveDefaultActiveHskLevel(contentLevels, stored));
    setHydrated(true);
  }, [contentLevels]);

  const setLevel = useCallback((next: ActiveHskLevel) => {
    setLevelState(next);
    writeStoredActiveHskLevel(next);
  }, []);

  const registerContentLevels = useCallback((levels: number[]) => {
    setContentLevels((prev) => {
      const merged = [...new Set([...prev, ...levels])].sort((a, b) => a - b);
      if (merged.length === prev.length && merged.every((v, i) => v === prev[i])) {
        return prev;
      }
      return merged;
    });
  }, []);

  const value = useMemo(
    () => ({ level, setLevel, registerContentLevels, hydrated }),
    [level, setLevel, registerContentLevels, hydrated]
  );

  return (
    <ActiveHskLevelContext.Provider value={value}>
      {children}
    </ActiveHskLevelContext.Provider>
  );
}

export function useActiveHskLevel(): ActiveHskLevelContextValue {
  const ctx = useContext(ActiveHskLevelContext);
  if (!ctx) {
    throw new Error("useActiveHskLevel must be used within ActiveHskLevelProvider");
  }
  return ctx;
}

/** Optional hook for screens that may render outside the provider during SSR. */
export function useActiveHskLevelOptional(): ActiveHskLevelContextValue | null {
  return useContext(ActiveHskLevelContext);
}

/** Register lesson-derived HSK levels so default picker value can follow content. */
export function useRegisterLessonHskLevels(
  lessons: { courseId: string; sourceNote?: string | null }[]
) {
  const ctx = useActiveHskLevelOptional();
  const levels = useMemo(() => collectLessonHskLevels(lessons), [lessons]);

  useEffect(() => {
    if (!ctx || levels.length === 0) return;
    ctx.registerContentLevels(levels);
  }, [ctx, levels]);
}

export { ACTIVE_HSK_LEVEL_KEY };
