"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WordCharBreakdownPanel } from "@/components/review/word-char-breakdown-panel";
import SpeakButton from "@/components/lesson/SpeakButton";
import {
  getBichlegWordStatus,
  lookupHskWordDisplayBySimplified,
  saveWordFromLesson,
  type BichlegWordStatus,
  type HskWordDisplay,
} from "@/lib/supabase/saved-words";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";

export type WordTapPayload = {
  zh: string;
  pinyin?: string;
  lessonMn?: string;
};

export type WordTapAnchorRect = {
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
  anchor: WordTapAnchorRect,
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
  const maxHeight = Math.max(160, window.innerHeight - 24);

  if (spaceBelow >= height || spaceBelow >= spaceAbove) {
    const top = Math.min(anchor.bottom + gap, window.innerHeight - height - 8);
    return { top, left, maxWidth: width, maxHeight };
  }

  const bottom = Math.max(8, window.innerHeight - anchor.top + gap);
  return { bottom, left, maxWidth: width, maxHeight };
}

type Props = {
  word: WordTapPayload;
  anchor: WordTapAnchorRect;
  onClose: () => void;
  onSaved?: () => void;
};

export function WordTapSheet({ word, anchor, onClose, onSaved }: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<PopoverPos>(() =>
    computePopoverPos(anchor, 280, 360)
  );
  const [catalog, setCatalog] = useState<HskWordDisplay | null>(null);
  const [status, setStatus] = useState<BichlegWordStatus | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = popoverRef.current;
    const height = el?.offsetHeight ?? 280;
    const width = el?.offsetWidth ?? 360;
    setPos(computePopoverPos(anchor, height, width));
  }, [anchor, loading, catalog, status, toast, saving, loggedIn]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setCatalog(null);
    setStatus(null);
    setLoggedIn(null);

    void (async () => {
      const [{ userId }, display, wordStatus] = await Promise.all([
        getAuthenticatedUserId(),
        lookupHskWordDisplayBySimplified(word.zh),
        getBichlegWordStatus(word.zh),
      ]);
      if (cancelled) return;
      setLoggedIn(Boolean(userId));
      setCatalog(display);
      setStatus(wordStatus);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [word.zh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const displayPinyin = catalog?.pinyin || word.pinyin || "";
  const displayMn =
    catalog?.meaning_mn?.trim() ||
    word.lessonMn?.trim() ||
    null;
  const missingFromCatalog = !catalog?.meaning_mn?.trim();
  const saved = Boolean(status?.saved || status?.inSrs);

  async function handleSave() {
    if (saved || saving) return;
    setSaving(true);
    const result = await saveWordFromLesson({
      zh: word.zh,
      pinyin: displayPinyin || undefined,
      mn: displayMn || undefined,
    });
    setSaving(false);

    if (result.ok) {
      if (result.isFunctionWord) {
        setToast("Дүрмийн үг тул давталтад оруулахгүй");
      } else if (result.alreadyInSrs || result.linkedToSrs) {
        setToast("Давталтад нэмэгдлээ ✓");
      } else if (result.inCatalog === false) {
        setToast("Тольд алга — зөвхөн миний үгсэд хадгаллаа");
      } else {
        setToast("Хадгаллаа ✓");
      }
      const nextStatus = await getBichlegWordStatus(word.zh);
      setStatus(nextStatus);
      onSaved?.();
    } else if (result.error) {
      setToast(result.error);
    }
  }

  const node = (
    <>
      <div
        className="bs-word-tap-backdrop"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={popoverRef}
        className="bs-word-tap-popover bs-bichleg-sheet"
        style={pos}
        role="dialog"
        aria-label={`${word.zh} — үгийн тайлбар`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="bs-bichleg-sheet-zh hanzi">{word.zh}</p>
        {displayPinyin ? (
          <p className="bs-bichleg-sheet-py">{displayPinyin}</p>
        ) : null}
        {displayMn ? (
          <p className="bs-bichleg-sheet-mn">{displayMn}</p>
        ) : missingFromCatalog ? (
          <p className="bs-bichleg-sheet-mn" style={{ color: "var(--bs-muted)" }}>
            {displayPinyin
              ? `${displayPinyin} — тольд алга`
              : "Тольд алга"}
          </p>
        ) : null}

        <WordCharBreakdownPanel
          text={word.zh}
          wordRadical={catalog?.radical ?? null}
        />

        <div className="bs-bichleg-sheet-listen">
          <SpeakButton text={word.zh} large title="Үгийг сонсох" />
        </div>

        <div className="bs-bichleg-sheet-actions">
          <button type="button" className="bs-bichleg-sheet-btn" onClick={onClose}>
            Хаах
          </button>
          {loading ? (
            <button
              type="button"
              className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--primary"
              disabled
            >
              Шалгаж байна…
            </button>
          ) : loggedIn === false ? (
            <Link
              href="/login"
              className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--primary inline-flex items-center justify-center no-underline"
            >
              Нэвтрэх
            </Link>
          ) : saved ? (
            <button
              type="button"
              className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--done"
              disabled
            >
              Хадгалсан ✓
            </button>
          ) : (
            <button
              type="button"
              className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--primary"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Хадгалж байна…" : "Хадгалах"}
            </button>
          )}
        </div>
        {toast ? <p className="bs-bichleg-sheet-note">{toast}</p> : null}
      </div>
    </>
  );

  return createPortal(node, document.body);
}
