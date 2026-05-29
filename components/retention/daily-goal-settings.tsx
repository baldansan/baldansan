"use client";

import { useEffect, useState } from "react";
import {
  getDailyGoalUnified,
  setDailyGoalUnified,
} from "@/lib/retention/retention-service";
import type { DailyGoal } from "@/lib/retention/types";

type Props = {
  isLoggedIn: boolean;
  onSaved?: () => void;
};

export function DailyGoalSettings({ isLoggedIn, onSaved }: Props) {
  const [goal, setGoal] = useState<DailyGoal>({
    lessonsPerDay: 1,
    wordsPerDay: 5,
    quizzesPerDay: 1,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getDailyGoalUnified().then((loaded) => {
      setGoal(loaded);
      setReady(true);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await setDailyGoalUnified(goal);
    setSaving(false);
    setSaved(true);
    onSaved?.();
  }

  if (!ready) {
    return (
      <p className="text-sm text-slate-500">Зорилго ачааллаж байна…</p>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Daily goal settings</h2>
      <p className="mt-1 text-sm text-slate-600">
        {isLoggedIn
          ? "Account дээр хадгалагдана — бусад төхөөрөмж дээр sync хийнэ."
          : "Энэ төхөөрөмж дээр хадгалагдана. Нэвтэрсний дараа account руу sync хийж болно."}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {(
          [
            ["lessonsPerDay", "Хичээл / өдөр"],
            ["wordsPerDay", "Үг / өдөр"],
            ["quizzesPerDay", "Quiz / өдөр"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">{label}</span>
            <input
              type="number"
              min={1}
              max={50}
              value={goal[key]}
              onChange={(event) =>
                setGoal((prev) => ({
                  ...prev,
                  [key]: Math.max(1, Number(event.target.value) || 1),
                }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 ring-emerald-200 focus:border-emerald-400 focus:outline-none focus:ring-2"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={saving}
          className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </button>
        {saved ? (
          <span className="text-sm text-emerald-700">Хадгалагдлаа</span>
        ) : null}
      </div>
    </section>
  );
}
