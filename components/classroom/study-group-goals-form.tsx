"use client";

import { useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { StudyGroupGoals } from "@/lib/supabase/classrooms";

const DAY_LABELS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

type GoalKey = "words" | "lessons" | "tests";

type GoalConfig = {
  key: GoalKey;
  title: string;
  unit: string;
  options: number[];
  fallback: number;
};

const GOALS: GoalConfig[] = [
  { key: "words", title: "Өдөрт үг цээжлэх", unit: "үг", options: [10, 20, 30, 40, 50], fallback: 20 },
  { key: "lessons", title: "7 хоногт хичээл үзэх", unit: "хичээл", options: [1, 2, 3, 5, 7], fallback: 3 },
  { key: "tests", title: "7 хоногт тест ажиллах", unit: "тест", options: [1, 2, 3, 5], fallback: 1 },
];

type Props = {
  /** Нэр асуух эсэх (шинэ бүлэг үүсгэх үед). */
  withName?: boolean;
  initial?: Partial<StudyGroupGoals>;
  submitLabel: string;
  busyLabel: string;
  onSubmit: (name: string, goals: StudyGroupGoals) => Promise<string | null>;
  onCancel?: () => void;
};

/** Бүлгийн зорилго тохируулах: аль зорилгыг, хэдээр, аль өдрүүдэд. */
export function StudyGroupGoalsForm({
  withName = false,
  initial,
  submitLabel,
  busyLabel,
  onSubmit,
  onCancel,
}: Props) {
  const locale = useUiLocale();
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<GoalKey, number | null>>({
    words: initial ? (initial.wordsPerDay ?? null) : 20,
    lessons: initial ? (initial.lessonsPerWeek ?? null) : null,
    tests: initial ? (initial.testsPerWeek ?? null) : null,
  });
  const [days, setDays] = useState<number[]>(
    initial?.days && initial.days.length > 0 ? initial.days : [1, 2, 3, 4, 5, 6, 7]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGoal = (goal: GoalConfig) =>
    setValues((prev) => ({ ...prev, [goal.key]: prev[goal.key] == null ? goal.fallback : null }));

  const toggleDay = (day: number) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));

  async function submit() {
    if (busy) return;
    if (withName && name.trim().length === 0) {
      setError(tr(locale, "Бүлгийн нэрээ бичээрэй."));
      return;
    }
    if (values.words == null && values.lessons == null && values.tests == null) {
      setError(tr(locale, "Дор хаяж нэг зорилго сонгоорой."));
      return;
    }
    if (days.length === 0) {
      setError(tr(locale, "Дор хаяж нэг өдөр сонгоорой."));
      return;
    }
    setBusy(true);
    setError(null);
    const err = await onSubmit(name.trim(), {
      wordsPerDay: values.words,
      lessonsPerWeek: values.lessons,
      testsPerWeek: values.tests,
      days: days.length === 7 ? null : days,
    });
    setBusy(false);
    if (err) setError(err);
  }

  const chip = (on: boolean) =>
    `min-h-[40px] min-w-[44px] rounded-full border px-3 text-sm font-bold transition-colors ${
      on
        ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
        : "border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text)]"
    }`;

  return (
    <div className="space-y-4">
      {withName ? (
        <label className="block text-sm font-semibold text-[var(--app-text)]">
          {tr(locale, "Бүлгийн нэр")}
          <input
            value={name}
            maxLength={40}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder={tr(locale, "Жишээ: HSK5 дөрөв")}
            className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2.5 text-base font-normal text-[var(--app-text)]"
          />
        </label>
      ) : null}

      <div>
        <p className="text-sm font-semibold text-[var(--app-text)]">{tr(locale, "Бүлгийн зорилго")}</p>
        <p className="text-xs text-[var(--app-muted)]">
          {tr(locale, "Нэгийг нь ч, гурвууланг нь ч сонгож болно.")}
        </p>
        <div className="mt-2 space-y-2">
          {GOALS.map((goal) => {
            const value = values[goal.key];
            const on = value != null;
            return (
              <div
                key={goal.key}
                className={`rounded-2xl border p-3 ${
                  on ? "border-[var(--app-primary)] bg-[var(--app-primary-light)]" : "border-[var(--app-border)] bg-[var(--app-card)]"
                }`}
              >
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleGoal(goal)}
                  className="flex min-h-[32px] w-full items-center gap-2 text-left text-sm font-bold text-[var(--app-text)]"
                >
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs ${
                      on
                        ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
                        : "border-[var(--app-border)] bg-[var(--app-card)] text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  {tr(locale, goal.title)}
                </button>
                {on ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {goal.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={value === option}
                        onClick={() => setValues((prev) => ({ ...prev, [goal.key]: option }))}
                        className={chip(value === option)}
                      >
                        {option}
                      </button>
                    ))}
                    <span className="self-center text-xs font-semibold text-[var(--app-muted)]">
                      {tr(locale, goal.unit)}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-[var(--app-text)]">{tr(locale, "Сурах өдрүүд")}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DAY_LABELS.map((label, index) => {
            const day = index + 1;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={days.includes(day)}
                onClick={() => toggleDay(day)}
                className={chip(days.includes(day))}
              >
                {tr(locale, label)}
              </button>
            );
          })}
        </div>
      </div>

      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={busy} className="app-btn-primary flex-1 disabled:opacity-50">
          {busy ? busyLabel : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-full border border-[var(--app-border)] bg-[var(--app-card)] px-5 text-sm font-semibold text-[var(--app-text)]"
          >
            {tr(locale, "Болих")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Зорилгыг нэг мөрөөр: «Өдөрт 20 үг · 7 хоногт 3 хичээл». */
export function describeGoals(
  goals: { wordsPerDay: number | null; lessonsPerWeek: number | null; testsPerWeek: number | null },
  t: (text: string) => string
): string {
  const parts: string[] = [];
  if (goals.wordsPerDay) parts.push(`${t("Өдөрт")} ${goals.wordsPerDay} ${t("үг")}`);
  if (goals.lessonsPerWeek) parts.push(`${t("7 хоногт")} ${goals.lessonsPerWeek} ${t("хичээл")}`);
  if (goals.testsPerWeek) parts.push(`${t("7 хоногт")} ${goals.testsPerWeek} ${t("тест")}`);
  return parts.join(" · ");
}
