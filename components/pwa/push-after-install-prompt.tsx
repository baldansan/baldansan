"use client";

import { useEffect, useState } from "react";
import {
  createReminderUnified,
  getRemindersUnified,
} from "@/lib/engagement/engagement-service";
import { WEEKDAY_KEYS } from "@/lib/engagement/types";
import { isNativeApp } from "@/lib/push/native-push-client";
import { getPushAvailability, subscribeToPush } from "@/lib/push/push-client";
import { isStandalone, markInstalled } from "@/lib/pwa/install-state";

const SNOOZE_KEY = "buunduu-push-ask-snooze-until-v1";
const SNOOZE_DAYS = 3;
const REMINDER_TYPE = "daily_study";
const DEFAULT_TIME = "20:00";

type Phase = "hidden" | "ask" | "busy" | "done" | "denied" | "failed";

/**
 * Апп болгож суулгасны дараа (нүүр дэлгэцээс нээсэн үед) өдөр бүрийн сануулгын
 * зөвшөөрлийг асууна. iPhone дээр мэдэгдэл зөвхөн суулгасан апп дотор ажилладаг тул
 * хөтөч дээр огт асуухгүй. Зөвшөөрлийн цонх заавал товч дарсны дараа гарна.
 */
export function PushAfterInstallPrompt({ loggedIn }: { loggedIn: boolean }) {
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    if (isNativeApp() || !isStandalone()) return;
    markInstalled();
    if (!loggedIn) return;
    if (getPushAvailability() !== "ready") return;
    if (Notification.permission !== "default") return;
    try {
      const until = Number(window.localStorage.getItem(SNOOZE_KEY) ?? 0);
      if (until > Date.now()) return;
    } catch {
      /* ignore */
    }
    setPhase("ask");
  }, [loggedIn]);

  function later() {
    try {
      window.localStorage.setItem(
        SNOOZE_KEY,
        String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000)
      );
    } catch {
      /* ignore */
    }
    setPhase("hidden");
  }

  async function enable() {
    setPhase("busy");
    const result = await subscribeToPush();
    if (!result.ok) {
      setPhase(result.reason === "permission-denied" ? "denied" : "failed");
      return;
    }
    try {
      const existing = await getRemindersUnified();
      const has = existing.some((r) => r.reminderType === REMINDER_TYPE && r.enabled);
      if (!has) {
        await createReminderUnified({
          reminderType: REMINDER_TYPE,
          title: "Өнөөдрийн хичээлээ хийх цаг боллоо",
          reminderTime: DEFAULT_TIME,
          daysOfWeek: [...WEEKDAY_KEYS],
          enabled: true,
        });
      }
    } catch {
      // Сануулга үүсээгүй ч мэдэгдлийн зөвшөөрөл авагдсан — профайлаас асааж болно.
    }
    setPhase("done");
  }

  if (phase === "hidden") return null;

  if (phase === "done") {
    return (
      <section className="bs-pushask" role="status">
        <p className="bs-pushask-title">✅ Сануулга асаалаа</p>
        <p className="bs-pushask-text">
          Өдөр бүр {DEFAULT_TIME}-д утсанд чинь мэдэгдэл ирнэ. Цагийг «Профайл» → «Сануулга» хэсгээс өөрчилж
          болно.
        </p>
      </section>
    );
  }

  if (phase === "denied" || phase === "failed") {
    return (
      <section className="bs-pushask" role="status">
        <p className="bs-pushask-title">
          {phase === "denied" ? "Мэдэгдэл хаалттай байна" : "Сануулга асааж чадсангүй"}
        </p>
        <p className="bs-pushask-text">
          {phase === "denied"
            ? "Утасны Тохиргоо → Мэдэгдэл → «Тэмээ багш» хэсгээс зөвшөөрч болно."
            : "Интернэтээ шалгаад «Профайл» → «Сануулга» хэсгээс дахин оролдоорой."}
        </p>
        <div className="bs-pushask-row">
          <button type="button" className="bs-pushask-no" onClick={later}>
            Ойлголоо
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bs-pushask">
      <p className="bs-pushask-title">🔔 Өдөр бүр сануулах уу?</p>
      <p className="bs-pushask-text">
        Орой {DEFAULT_TIME}-д «хичээлээ хий» гэсэн мэдэгдэл утсанд чинь ирнэ. Хүссэн үедээ унтрааж болно.
      </p>
      <div className="bs-pushask-row">
        <button
          type="button"
          className="bs-pushask-yes"
          disabled={phase === "busy"}
          onClick={() => void enable()}
        >
          {phase === "busy" ? "Асааж байна…" : "Сануулга асаах"}
        </button>
        <button type="button" className="bs-pushask-no" disabled={phase === "busy"} onClick={later}>
          Дараа
        </button>
      </div>
    </section>
  );
}
