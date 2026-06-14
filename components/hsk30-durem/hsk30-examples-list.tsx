"use client";

import { useState } from "react";
import type { Hsk30Example } from "@/types/hsk30-durem";

type Props = {
  examples: Hsk30Example[];
};

export function Hsk30ExamplesList({ examples }: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());

  if (examples.length === 0) return null;

  function toggleReveal(index: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <>
      <p className="sub-h">📖 Жишээ · орчуулга дээр дар</p>
      {examples.map((ex, idx) => {
        const isOpen = revealed.has(idx);
        return (
          <div
            className={`eg reveal${isOpen ? " shown" : ""}`}
            key={`${ex.c}-${idx}`}
          >
            <div className="c zh">{ex.c}</div>
            {ex.p ? <div className="p">{ex.p}</div> : null}
            <div
              className="m"
              role="button"
              tabIndex={0}
              onClick={() => toggleReveal(idx)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleReveal(idx);
                }
              }}
            >
              {ex.m}
            </div>
          </div>
        );
      })}
    </>
  );
}
