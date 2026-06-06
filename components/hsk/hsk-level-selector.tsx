"use client";

import { useEffect, useRef, useState } from "react";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import {
  formatActiveHskLevel,
  HSK_LEVEL_OPTIONS,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";

const BRAND_GREEN = "#1FB85A";

type Props = {
  className?: string;
  /** header = top-left; nav = bottom navigation strip */
  placement?: "header" | "nav";
};

export function HskLevelSelector({
  className = "",
  placement = "header",
}: Props) {
  const { level, setLevel } = useActiveHskLevel();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: ActiveHskLevel) {
    setLevel(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm transition active:scale-[0.98]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="HSK түвшин сонгох"
      >
        <span>{formatActiveHskLevel(level)}</span>
        <span className="text-[10px] opacity-70" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/25 sm:hidden"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-label="HSK түвшин"
            className={
              placement === "nav"
                ? "fixed inset-x-4 bottom-[calc(8.25rem+env(safe-area-inset-bottom))] z-[60] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                : "fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+6px)] sm:min-w-[168px]"
            }
          >
            {HSK_LEVEL_OPTIONS.map((option) => {
              const selected = option.value === level;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(option.value)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    selected
                      ? "text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  style={selected ? { backgroundColor: BRAND_GREEN } : undefined}
                >
                  {option.label}
                  {selected ? <span className="text-xs">✓</span> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
