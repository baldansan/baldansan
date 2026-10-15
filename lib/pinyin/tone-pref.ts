"use client";

import { useEffect, useState } from "react";

export const TONE_COLORS_KEY = "buunduu-tone-colors-v1";
const EVENT = "buunduu-tone-colors-change";

export function getToneColors(): boolean {
  try {
    return localStorage.getItem(TONE_COLORS_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setToneColors(on: boolean): void {
  try {
    localStorage.setItem(TONE_COLORS_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useToneColors(): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const sync = () => setOn(getToneColors());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return on;
}
