"use client";

import { useRef, type PointerEvent } from "react";

type Zone = "left" | "center" | "right";

type Props = {
  onDoubleTapLeft: () => void;
  onDoubleTapRight: () => void;
  onSingleTapCenter: () => void;
};

const DOUBLE_TAP_MS = 280;
const SINGLE_TAP_DELAY_MS = 300;

export function BichlegPlayerTouchLayer({
  onDoubleTapLeft,
  onDoubleTapRight,
  onSingleTapCenter,
}: Props) {
  const lastTapRef = useRef<{ zone: Zone; time: number } | null>(null);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function onPointerUp(zone: Zone, event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    handleZoneTap(zone);
  }

  return (
    <div className="bs-bichleg-touch-layer" aria-hidden>
      <div
        className="bs-bichleg-touch-zone bs-bichleg-touch-zone--left"
        onPointerUp={(event) => onPointerUp("left", event)}
      />
      <div
        className="bs-bichleg-touch-zone bs-bichleg-touch-zone--center"
        onPointerUp={(event) => onPointerUp("center", event)}
      />
      <div
        className="bs-bichleg-touch-zone bs-bichleg-touch-zone--right"
        onPointerUp={(event) => onPointerUp("right", event)}
      />
    </div>
  );
}
