"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BADGE_DEFS,
  computeNewBadges,
  markBadgeSeen,
  type BadgeDef,
} from "@/lib/celebrate/badges";
import {
  CELEBRATE_EVENT,
  CORRECT_ANSWER_EVENT,
  prefersReducedMotion,
  type CelebrateDetail,
} from "@/lib/celebrate/celebrate-events";
import { burstConfetti, rainConfetti } from "@/lib/celebrate/confetti";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { POINTS_AWARDED_EVENT } from "@/lib/points/award";
import { sourceIcon } from "@/lib/points/points-config";
import { isForcedLightPath } from "@/lib/theme/theme-pref";
import "./celebration-layer.css";

type PointsToast = { id: number; points: number; icon: string };

const TOAST_MS = 1800;
const CORRECT_THROTTLE_MS = 250;

/**
 * Глобал «тоглоомын мэдрэмж» давхарга (AppProviders-д нэг удаа суулгасан):
 *  - bs:correct-answer → жижиг confetti
 *  - bs:points-awarded → «+N оноо» toast (баруун дээд)
 *  - bs:celebrate      → том confetti + шинэ badge байвал modal
 * Admin / багш / байгууллагын замд юу ч хийхгүй.
 */
export function CelebrationLayer() {
  const pathname = usePathname();
  const locale = useUiLocale();
  const disabled = isForcedLightPath(pathname);
  const [toasts, setToasts] = useState<PointsToast[]>([]);
  const [badgeQueue, setBadgeQueue] = useState<BadgeDef[]>([]);
  const lastCorrectRef = useRef(0);
  const pointsCheckRef = useRef<number | null>(null);
  const toastIdRef = useRef(0);

  const showBadges = useCallback((found: BadgeDef[]) => {
    if (found.length === 0) return;
    setBadgeQueue((q) => {
      const have = new Set(q.map((b) => b.id));
      return [...q, ...found.filter((b) => !have.has(b.id))];
    });
  }, []);

  const checkBadges = useCallback(
    async (detail?: CelebrateDetail) => {
      let totalPoints: number | null = null;
      try {
        const { fetchMyPoints } = await import("@/lib/points/rank");
        const summary = await fetchMyPoints();
        totalPoints = summary?.total ?? null;
      } catch {
        totalPoints = null;
      }
      showBadges(
        computeNewBadges({
          totalPoints,
          quizPercent: detail?.percent,
        })
      );
    },
    [showBadges]
  );

  useEffect(() => {
    if (disabled) return;

    const onCorrect = () => {
      const now = Date.now();
      if (now - lastCorrectRef.current < CORRECT_THROTTLE_MS) return;
      lastCorrectRef.current = now;
      if (!prefersReducedMotion()) burstConfetti({ count: 18, y: 0.4, power: 0.8 });
    };

    const onPoints = (e: Event) => {
      const detail = (e as CustomEvent<{ source?: string; points?: number }>).detail;
      const points = Number(detail?.points ?? 0);
      if (!Number.isFinite(points) || points <= 0) return;
      const id = ++toastIdRef.current;
      setToasts((t) => [...t.slice(-2), { id, points, icon: sourceIcon(String(detail?.source ?? "")) }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), TOAST_MS);
      // 1000 оноо badge — олон award дараалж ирэхэд нэг л удаа шалгана.
      if (pointsCheckRef.current) window.clearTimeout(pointsCheckRef.current);
      pointsCheckRef.current = window.setTimeout(() => {
        pointsCheckRef.current = null;
        void checkBadges();
      }, 1500);
    };

    const onCelebrate = (e: Event) => {
      const detail = (e as CustomEvent<CelebrateDetail>).detail;
      if (!prefersReducedMotion()) {
        if (detail?.kind === "quiz_done" && (detail.percent ?? 0) < 60) {
          burstConfetti({ count: 24, power: 0.9 });
        } else {
          rainConfetti();
        }
      }
      void checkBadges(detail);
    };

    window.addEventListener(CORRECT_ANSWER_EVENT, onCorrect);
    window.addEventListener(POINTS_AWARDED_EVENT, onPoints);
    window.addEventListener(CELEBRATE_EVENT, onCelebrate);
    return () => {
      window.removeEventListener(CORRECT_ANSWER_EVENT, onCorrect);
      window.removeEventListener(POINTS_AWARDED_EVENT, onPoints);
      window.removeEventListener(CELEBRATE_EVENT, onCelebrate);
      if (pointsCheckRef.current) window.clearTimeout(pointsCheckRef.current);
    };
  }, [disabled, checkBadges]);

  const current = badgeQueue[0] ?? null;

  useEffect(() => {
    if (!current || prefersReducedMotion()) return;
    const t = window.setTimeout(() => burstConfetti({ count: 30, y: 0.45 }), 150);
    return () => window.clearTimeout(t);
  }, [current]);

  function closeBadge() {
    if (!current) return;
    markBadgeSeen(current.id);
    setBadgeQueue((q) => q.slice(1));
  }

  if (disabled) return null;

  return (
    <>
      {toasts.length > 0 ? (
        <div className="bs-cel-toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="bs-cel-toast">
              <span aria-hidden>{t.icon}</span>
              <b>+{t.points}</b> {tr(locale, "оноо")}
            </div>
          ))}
        </div>
      ) : null}

      {current ? (
        <div className="bs-cel-backdrop" role="dialog" aria-modal="true" aria-labelledby="bs-cel-badge-title">
          <div className="bs-cel-modal">
            <div className="bs-cel-badge-ring">
              <span className="bs-cel-badge-icon" aria-hidden>
                {current.icon}
              </span>
            </div>
            <p className="bs-cel-kicker">{tr(locale, "Шинэ цол!")}</p>
            <h2 id="bs-cel-badge-title" className="bs-cel-title">
              {tr(locale, current.titleMn)}
            </h2>
            <p className="bs-cel-desc">{tr(locale, current.descMn)}</p>
            <p className="bs-cel-count">
              {badgeQueue.length > 1
                ? `${tr(locale, "Дараагийнх")}: ${badgeQueue.length - 1}`
                : `${Object.keys(BADGE_DEFS).length} ${tr(locale, "цолноос")}`}
            </p>
            <button type="button" className="bs-cel-btn" onClick={closeBadge} autoFocus>
              {tr(locale, "Баярлалаа, Тэмээ!")} 🐫
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
