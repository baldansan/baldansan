"use client";

import { useRef, type PointerEvent } from "react";

type Zone = "left" | "center" | "right";

type Props = {
  onDoubleTapLeft: () => void;
  onDoubleTapRight: () => void;
  onSingleTapCenter: () => void;
  /** Хэвтээ шудрах (YouTube маягийн seek дохио). dxPx — эхлэлээс хэдэн px. */
  onScrubStart?: () => void;
  onScrubMove?: (dxPx: number) => void;
  /** commit=false → цуцлагдсан (pointercancel). */
  onScrubEnd?: (commit: boolean) => void;
};

const DOUBLE_TAP_MS = 280;
const SINGLE_TAP_DELAY_MS = 300;
/** Хэвтээ шудрах гэж тооцох босго (px). */
const SCRUB_THRESHOLD_PX = 14;

export function BichlegPlayerTouchLayer({
  onDoubleTapLeft,
  onDoubleTapRight,
  onSingleTapCenter,
  onScrubStart,
  onScrubMove,
  onScrubEnd,
}: Props) {
  const lastTapRef = useRef<{ zone: Zone; time: number } | null>(null);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureRef = useRef<{
    id: number;
    x: number;
    y: number;
    scrubbing: boolean;
  } | null>(null);

  function clearSingleTapTimer() {
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  }

  function handleZoneTap(zone: Zone) {
    const now = Date.now();
    const last = lastTapRef.current;

    if (last && last.zone === zone && now - last.time < DOUBLE_TAP_MS) {
      clearSingleTapTimer();
      lastTapRef.current = null;
      if (zone === "left") onDoubleTapLeft();
      else if (zone === "right") onDoubleTapRight();
      return;
    }

    lastTapRef.current = { zone, time: now };

    if (zone === "center") {
      clearSingleTapTimer();
      singleTapTimerRef.current = setTimeout(() => {
        singleTapTimerRef.current = null;
        const recent = lastTapRef.current;
        if (recent?.zone === "center" && Date.now() - recent.time >= SINGLE_TAP_DELAY_MS - 20) {
          onSingleTapCenter();
          lastTapRef.current = null;
        }
      }, SINGLE_TAP_DELAY_MS);
    }
  }

  function onZonePointerUp(zone: Zone, event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // Шудрах дохио байсан бол товшилт гэж тооцохгүй
    if (gestureRef.current?.scrubbing) return;
    handleZoneTap(zone);
  }

  function onLayerPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    gestureRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrubbing: false,
    };
  }

  function onLayerPointerMove(event: PointerEvent<HTMLDivElement>) {
    const g = gestureRef.current;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    if (!g.scrubbing) {
      if (Math.abs(dx) < SCRUB_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      g.scrubbing = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* unsupported */
      }
      onScrubStart?.();
    }
    onScrubMove?.(dx);
  }

  function onLayerPointerEnd(event: PointerEvent<HTMLDivElement>, commit: boolean) {
    const g = gestureRef.current;
    if (!g || g.id !== event.pointerId) return;
    if (g.scrubbing) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
      onScrubEnd?.(commit);
      // Зоны pointerup-ыг (капчурын дараа ирэхгүй ч) аюулгүй болгох
      setTimeout(() => {
        gestureRef.current = null;
      }, 0);
      return;
    }
    gestureRef.current = null;
  }

  return (
    <div
      className="bs-bichleg-touch-layer"
      aria-hidden
      onPointerDown={onLayerPointerDown}
      onPointerMove={onLayerPointerMove}
      onPointerUp={(e) => onLayerPointerEnd(e, true)}
      onPointerCancel={(e) => onLayerPointerEnd(e, false)}
    >
      <div
        className="bs-bichleg-touch-zone bs-bichleg-touch-zone--left"
        onPointerUp={(event) => onZonePointerUp("left", event)}
      />
      <div
        className="bs-bichleg-touch-zone bs-bichleg-touch-zone--center"
        onPointerUp={(event) => onZonePointerUp("center", event)}
      />
      <div
        className="bs-bichleg-touch-zone bs-bichleg-touch-zone--right"
        onPointerUp={(event) => onZonePointerUp("right", event)}
      />
    </div>
  );
}
