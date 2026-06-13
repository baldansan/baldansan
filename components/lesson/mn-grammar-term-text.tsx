"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getMnGrammarTerm,
  splitMnGrammarTerms,
} from "@/lib/lesson/mn-grammar-terms";
import "./mn-grammar-term.css";

type Props = {
  text: string;
  className?: string;
  /** Use span triggers inside parent <button> (e.g. quiz options). */
  nested?: boolean;
};

type AnchorRect = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
};

type PopoverPos = {
  top?: number;
  bottom?: number;
  left: number;
  maxWidth: number;
  maxHeight: number;
};

function computePopoverPos(
  anchor: AnchorRect,
  popoverHeight: number,
  popoverWidth: number
): PopoverPos {
  const maxWidth = Math.min(360, window.innerWidth - 16);
  const width = Math.min(maxWidth, popoverWidth || maxWidth);
  const centerX = anchor.left + anchor.width / 2;
  const left = Math.min(
    Math.max(8, centerX - width / 2),
    window.innerWidth - width - 8
  );
  const gap = 8;
  const spaceBelow = window.innerHeight - anchor.bottom - gap;
  const spaceAbove = anchor.top - gap;
  const height = Math.min(popoverHeight, window.innerHeight - 24);
  const maxHeight = Math.max(120, window.innerHeight - 24);

  if (spaceBelow >= height || spaceBelow >= spaceAbove) {
    const top = Math.min(anchor.bottom + gap, window.innerHeight - height - 8);
    return { top, left, maxWidth: width, maxHeight };
  }

  const bottom = Math.max(8, window.innerHeight - anchor.top + gap);
  return { bottom, left, maxWidth: width, maxHeight };
}

function TermPopover({
  termId,
  anchor,
  onClose,
}: {
  termId: string;
  anchor: AnchorRect;
  onClose: () => void;
}) {
  const entry = getMnGrammarTerm(termId);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<PopoverPos>(() =>
    computePopoverPos(anchor, 220, 360)
  );

  useLayoutEffect(() => {
    const el = popoverRef.current;
    const height = el?.offsetHeight ?? 220;
    const width = el?.offsetWidth ?? 360;
    setPos(computePopoverPos(anchor, height, width));
  }, [anchor, entry]);

  if (!entry) return null;

  const node = (
    <>
      <div
        className="bs-mn-term-popover-backdrop"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={popoverRef}
        className="bs-mn-term-popover"
        role="dialog"
        aria-labelledby="bs-mn-term-popover-title"
        style={pos}
        onClick={(e) => e.stopPropagation()}
      >
        <p id="bs-mn-term-popover-title" className="bs-mn-term-popover-title">
          {entry.title}
        </p>
        <p className="bs-mn-term-popover-desc">{entry.description}</p>
        {entry.examples.length > 0 ? (
          <ul className="bs-mn-term-popover-examples">
            {entry.examples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          className="bs-navbtn bs-mn-term-popover-close"
          onClick={onClose}
        >
          Хаах
        </button>
      </div>
    </>
  );

  return createPortal(node, document.body);
}

export function MnGrammarTermText({ text, className, nested = false }: Props) {
  const [openTermId, setOpenTermId] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const segments = useMemo(() => splitMnGrammarTerms(text), [text]);

  const hasTerms = segments.some((seg) => seg.kind === "term");
  if (!hasTerms) {
    return <span className={className}>{text}</span>;
  }

  function openTerm(
    termId: string,
    el: HTMLElement,
    e: React.MouseEvent | React.KeyboardEvent
  ) {
    e.stopPropagation();
    e.preventDefault();
    setAnchorRect(el.getBoundingClientRect());
    setOpenTermId(termId);
  }

  function closeTerm() {
    setOpenTermId(null);
    setAnchorRect(null);
  }

  return (
    <>
      <span className={className}>
        {segments.map((seg, i) => {
          if (seg.kind === "text") {
            return <span key={i}>{seg.value}</span>;
          }

          const shared = {
            className: "bs-mn-term",
            onClick: (e: React.MouseEvent<HTMLElement>) =>
              openTerm(seg.termId, e.currentTarget, e),
            onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                openTerm(seg.termId, e.currentTarget, e);
              }
            },
            "aria-label": `${seg.value} — тайлбар харах`,
          };

          if (nested) {
            return (
              <span key={i} role="button" tabIndex={0} {...shared}>
                {seg.value}
              </span>
            );
          }

          return (
            <button key={i} type="button" {...shared}>
              {seg.value}
            </button>
          );
        })}
      </span>
      {openTermId && anchorRect ? (
        <TermPopover termId={openTermId} anchor={anchorRect} onClose={closeTerm} />
      ) : null}
    </>
  );
}
