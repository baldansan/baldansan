"use client";

import { useEffect, useState } from "react";
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
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[var(--app-primary)] transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-medium text-emerald-700">
        {progressPercent}% дууссан
      </p>
      <div className="mt-3">
        <LocalProgressNote />
      </div>
    </MobileCard>
  );
}
