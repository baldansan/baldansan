"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import {
  createReminderUnified,
  deleteReminderUnified,
  getRemindersUnified,
  toggleReminderUnified,
} from "@/lib/engagement/engagement-service";
import { DEFAULT_REMINDER, WEEKDAY_KEYS, type StudyReminder, type WeekdayKey } from "@/lib/engagement/types";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import { checkDueRemindersAndNotify } from "@/lib/engagement/achievement-service";

const DAY_LABELS: Record<WeekdayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export function RemindersView() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [reminders, setReminders] = useState<StudyReminder[]>([]);
  const [title, setTitle] = useState(DEFAULT_REMINDER.title);
  const [time, setTime] = useState(DEFAULT_REMINDER.reminderTime ?? "20:00");
  const [days, setDays] = useState<WeekdayKey[]>([...WEEKDAY_KEYS]);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    if (hasSupabaseConfig) {
      const { data } = await getCurrentUser();
      setLoggedIn(Boolean(data));
    }
    setReminders(await getRemindersUnified());
    setReady(true);
  }

  useEffect(() => {
    void refresh();
    void checkDueRemindersAndNotify();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createReminderUnified({
      title,
      reminderTime: time,
      daysOfWeek: days,
      enabled: true,
    });
    setSaving(false);
    await refresh();
  }

  function toggleDay(day: WeekdayKey) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  if (!ready) {
    return (
      <PublicPageShell>
        <p className="py-16 text-center text-sm text-slate-500">Ачааллаж байна…</p>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Study reminders</h1>
        <p className="mt-2 text-slate-600">
          Өдөр бүр сурах цагаа сануулах in-app reminder тохируулна.
        </p>
        {!loggedIn ? (
          <p className="mt-3 text-sm text-amber-800">
            Guest: reminder энэ төхөөрөмж дээр хадгалагдана.{" "}
            <Link href="/login" className="font-semibold underline">
              Нэвтэрч
            </Link>{" "}
            cross-device sync хийх.
          </p>
        ) : (
          <p className="mt-3 text-sm text-emerald-700">
            Account дээр хадгалагдаж байна.
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Reminder list</h2>
        {reminders.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Reminder байхгүй байна.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reminders.map((reminder) => (
              <li
                key={reminder.id}
                className="rounded-xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{reminder.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {reminder.reminderTime ?? "—"} ·{" "}
                      {reminder.daysOfWeek.map((d) => DAY_LABELS[d]).join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {reminder.enabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void toggleReminderUnified(reminder.id, !reminder.enabled).then(
                          refresh
                        );
                      }}
                      className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800"
                    >
                      {reminder.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void deleteReminderUnified(reminder.id).then(refresh);
                      }}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add reminder</h2>
        <form onSubmit={(e) => void handleAdd(e)} className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Time</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Days</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {WEEKDAY_KEYS.map((day) => (
                <label key={day} className="inline-flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={days.includes(day)}
                    onChange={() => toggleDay(day)}
                  />
                  {DAY_LABELS[day]}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Add reminder"}
          </button>
        </form>
      </section>

      <p className="text-sm text-slate-500">
        Одоогоор энэ нь in-app reminder. Push/email reminder дараагийн шатанд
        нэмэгдэнэ.
      </p>
    </PublicPageShell>
  );
}
