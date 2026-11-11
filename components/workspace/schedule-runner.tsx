"use client";

import { useEffect } from "react";

const KEY = "bs.workspace.schedules.ran";

/**
 * Багш ажлын талбараа нээхэд хугацаа нь болсон «долоо хоног бүрийн» даалгавруудыг
 * үүсгэнэ. Өдөрт нэг удаа л ажиллана (нэг хөтөч дээр). Харагдах зүйлгүй.
 */
export function ScheduleRunner() {
  useEffect(() => {
    const today = new Date().toDateString();
    try {
      if (window.sessionStorage.getItem(KEY) === today) return;
      window.sessionStorage.setItem(KEY, today);
    } catch {
      /* storage unavailable — тэгсэн ч нэг удаа ажиллуулна */
    }
    void import("@/lib/supabase/teacher-extras")
      .then((m) => m.runDueAssignmentSchedules())
      .catch(() => undefined);
  }, []);
  return null;
}
