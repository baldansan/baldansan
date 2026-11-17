"use client";

import { useEffect, useState } from "react";
import {
  createReminderUnified,
  deleteReminderUnified,
  getRemindersUnified,
} from "@/lib/engagement/engagement-service";
import { WEEKDAY_KEYS, type StudyReminder } from "@/lib/engagement/types";
import { enableNativePush, isNativeApp } from "@/lib/push/native-push-client";
import { getPushAvailability, subscribeToPush } from "@/lib/push/push-client";

/**
 * Профайл дээрх ганц мөр сануулга: асаах/унтраах + цаг.
 * («Миний сурах систем»-ийн daily_study сануулгатай нэг бичлэг.)
 */
const REMINDER_TYPE = "daily_study";

export function ReminderQuickRow() {
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState<StudyReminder | null>(null);
  const [time, setTime] = useState("20:00");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getRemindersUnified()
      .catch(() => [] as StudyReminder[])
      .then((rs) => {
        if (!alive) return;
        const r = rs.find((x) => x.reminderType === REMINDER_TYPE && x.enabled) ?? null;
        setCurrent(r);
        if (r?.reminderTime) setTime(r.reminderTime.slice(0, 5));
        setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function apply(on: boolean, nextTime: string) {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const existing = (await getRemindersUnified()).filter((r) => r.reminderType === REMINDER_TYPE);
      for (const r of existing) await deleteReminderUnified(r.id);
      if (!on) {
        setCurrent(null);
        return;
      }
      const days = current?.daysOfWeek?.length ? current.daysOfWeek : [...WEEKDAY_KEYS];
      await createReminderUnified({
        reminderType: REMINDER_TYPE,
        title: "Өнөөдрийн хичээлээ хийх цаг боллоо",
        reminderTime: nextTime,
        daysOfWeek: days,
        enabled: true,
      });
      let pushed = false;
      try {
        if (isNativeApp()) pushed = (await enableNativePush()).ok;
        else if (getPushAvailability() === "ready") pushed = (await subscribeToPush()).ok;
      } catch {
        pushed = false;
      }
      setNote(
        pushed
          ? `Өдөр бүр ${nextTime}-д утсанд чинь мэдэгдэл ирнэ.`
          : `Мэдэгдлийн зөвшөөрөл өгөөгүй тул ${nextTime}-аас хойш апп нээхэд сануулна.`
      );
      const rs = await getRemindersUnified().catch(() => [] as StudyReminder[]);
      setCurrent(rs.find((x) => x.reminderType === REMINDER_TYPE && x.enabled) ?? null);
    } finally {
      setBusy(false);
    }
  }

  const on = Boolean(current);

  return (
    <details id="reminder" className="bs-tm-card mt-2" style={{ display: "block" }}>
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span className="bs-tm-card-ic" aria-hidden>⏰</span>
        <span className="flex-1">
          <span className="bs-tm-card-title">Сануулга</span>
        </span>
        <span className={on ? "bs-pp-rem-val bs-pp-rem-val--on" : "bs-pp-rem-val"}>
          {!ready ? "…" : on ? `${time} · асаалттай` : "унтраалттай"}
        </span>
      </summary>
      <div className="bs-pp-rem-body">
        <div className="bs-pp-rem-line">
          <span>Өдөр бүр сануулах</span>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Сануулга асаах"
            disabled={busy || !ready}
            className="bs-pp-switch"
            onClick={() => void apply(!on, time)}
          />
        </div>
        <label className="bs-pp-rem-line">
          <span>Хэдэн цагт</span>
          <input
            type="time"
            value={time}
            disabled={busy}
            onChange={(e) => setTime(e.target.value || "20:00")}
            onBlur={() => {
              if (on && current?.reminderTime?.slice(0, 5) !== time) void apply(true, time);
            }}
          />
        </label>
        {note ? <p className="bs-pp-rem-note">{note}</p> : null}
      </div>
    </details>
  );
}
