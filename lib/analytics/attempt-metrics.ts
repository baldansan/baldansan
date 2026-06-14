"use client";

import { useEffect, useRef } from "react";

function storageKey(lessonId: string, questionId: string): string {
  return `bs:atn:${lessonId}:${questionId}`;
}

export function nextAttemptNumber(lessonId: string, questionId: string): number {
  if (typeof window === "undefined") return 1;
  const key = storageKey(lessonId, questionId);
  try {
    const prev = Number(sessionStorage.getItem(key) ?? "0");
    const next = prev + 1;
    sessionStorage.setItem(key, String(next));
    return next;
  } catch {
    return 1;
  }
}

/** Marks question start; call getElapsedMs() when recording the attempt. */
export function useQuestionTimer(questionKey: string) {
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
  }, [questionKey]);

  return () => Date.now() - startRef.current;
}
