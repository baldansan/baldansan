"use client";

import { useEffect, useState } from "react";
import { AnimatedProgressBar } from "@/components/motion/animated-progress-bar";
import { CountUp } from "@/components/motion/count-up";
import { MobileCard } from "@/components/mobile/mobile-card";
import { LocalProgressNote } from "@/components/local-progress-note";
import {
  getLessonStatusSmart,
  lessonProgressPercent,
  lessonStatusLabel,
  type LessonStatus,
} from "@/lib/progress";

type Props = {
  lessonId: string;
};

export function LessonProgressCard({ lessonId }: Props) {
  const [status, setStatus] = useState<LessonStatus>("not_started");

  useEffect(() => {
    async function refresh() {
      setStatus(await getLessonStatusSmart(lessonId));
    }

    const onFocus = () => {
      void refresh();
    };

    void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [lessonId]);

  const progressPercent = lessonProgressPercent(status);

  return (
    <MobileCard padding="lg">
      <h2 className="text-sm font-bold text-[var(--app-text)]">Таны ахиц</h2>
      <div className="mt-2">
        <span className="app-stat-pill">{lessonStatusLabel(status)}</span>
      </div>
      <AnimatedProgressBar value={progressPercent} className="mt-3" />
      <p className="mt-2 text-xs font-medium text-emerald-700">
        <CountUp value={progressPercent} suffix="% дууссан" />
      </p>
      <div className="mt-3">
        <LocalProgressNote />
      </div>
    </MobileCard>
  );
}
