"use client";

import { useEffect, useRef } from "react";

/** Зөв хариулсны дараа «Дараагийн» товч дарахгүйгээр автоматаар шилжих хугацаа. */
export const AUTO_ADVANCE_MS = 1400;

/**
 * `enabled` үнэн болмогц `delay` мс-ийн дараа `advance`-ийг нэг удаа дуудна.
 * `key` (асуултын дугаар) солигдох эсвэл `enabled` худал болоход цуцлагдана —
 * хэрэглэгч өөрөө товч дарсан бол давхар шилжихгүй.
 */
export function useAutoAdvance(
  enabled: boolean,
  key: string | number,
  advance: () => void,
  delay: number = AUTO_ADVANCE_MS
) {
  const ref = useRef(advance);
  useEffect(() => {
    ref.current = advance;
  });
  useEffect(() => {
    if (!enabled) return;
    const t = window.setTimeout(() => ref.current(), delay);
    return () => window.clearTimeout(t);
  }, [enabled, key, delay]);
}
