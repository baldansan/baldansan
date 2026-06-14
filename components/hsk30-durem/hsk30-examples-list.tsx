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
    <div className="bs-gr2-examples">
      <p className="bs-gr2-section-label">Жишээ</p>
      <div className="bs-gr2-examples-list">
        {examples.map((ex, idx) => {
          const isOpen = revealed.has(idx);
          return (
            <div className="bs-gr2-example" key={`${ex.c}-${idx}`}>
              <p className="bs-gr2-example-zh">
                <span className="zh">{ex.c}</span>
              </p>
              {ex.p ? <p className="bs-gr2-example-py">{ex.p}</p> : null}
              <button
                type="button"
                className={`bs-gr2-mn-reveal ${isOpen ? "bs-gr2-mn-reveal--open" : ""}`}
                onClick={() => toggleReveal(idx)}
                aria-expanded={isOpen}
              >
                <span
                  className={`bs-gr2-mn-text ${isOpen ? "" : "bs-gr2-mn-text--blur"}`}
                >
                  {ex.m}
                </span>
                <span className="bs-gr2-mn-hint">
                  {isOpen ? "Нуух" : "Орчуулга харах"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
