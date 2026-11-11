"use client";

import { LEARN_MODES, type LearnSettings } from "@/lib/games/learn-session";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

type Props = {
  open: boolean;
  settings: LearnSettings;
  onChange: (next: LearnSettings) => void;
  onClose: () => void;
};

const SIZES = [
  { value: 10, label: "10 үг" },
  { value: 20, label: "20 үг" },
  { value: 30, label: "30 үг" },
  { value: 0, label: "Бүгд (марафон)" },
];

const TIMERS = [
  { value: 0, label: "Цаггүй" },
  { value: 10, label: "10 сек" },
  { value: 6, label: "6 сек — хурдны горим" },
];

/** ⚙ Тохиргоо: аль тоглоомуудыг холих, хэдэн үг, цаг, дуу. Тоглолтын дундуур ч нээгдэнэ. */
export function LearnSettingsSheet({ open, settings, onChange, onClose }: Props) {
  const locale = useUiLocale();
  if (!open) return null;

  const toggleMode = (id: LearnSettings["modes"][number]) => {
    const on = settings.modes.includes(id);
    const modes = on ? settings.modes.filter((m) => m !== id) : [...settings.modes, id];
    if (modes.length > 0) onChange({ ...settings, modes });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={tr(locale, "Тохиргоо")}
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">⚙️ {tr(locale, "Тохиргоо")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white"
          >
            {tr(locale, "Болсон")}
          </button>
        </div>

        <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
          {tr(locale, "Тоглоомын төрлүүд — дуртайгаа сонго")}
        </h3>
        <ul className="mt-2 flex flex-col gap-1">
          {LEARN_MODES.map((m) => {
            const on = settings.modes.includes(m.id);
            return (
              <li key={m.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 transition ${
                    on ? "bg-emerald-50 ring-emerald-300" : "bg-white ring-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleMode(m.id)}
                    className="h-5 w-5 accent-emerald-600"
                  />
                  <span className="text-xl" aria-hidden>
                    {m.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900">
                      {tr(locale, m.label)}
                    </span>
                    <span className="text-xs text-slate-500">{tr(locale, m.hint)}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onChange({ ...settings, modes: LEARN_MODES.map((m) => m.id) })}
            className="text-emerald-700"
          >
            {tr(locale, "Бүгдийг сонгох")}
          </button>
        </div>

        <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">
          {tr(locale, "Нэг удаад хэдэн үг")}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange({ ...settings, size: s.value })}
              aria-pressed={settings.size === s.value}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${
                settings.size === s.value
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-700 ring-slate-200"
              }`}
            >
              {tr(locale, s.label)}
            </button>
          ))}
        </div>

        <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">
          ⏱ {tr(locale, "Асуулт бүрийн хугацаа")}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIMERS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ ...settings, timer: t.value })}
              aria-pressed={settings.timer === t.value}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${
                settings.timer === t.value
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-700 ring-slate-200"
              }`}
            >
              {tr(locale, t.label)}
            </button>
          ))}
        </div>

        <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">
          {tr(locale, "Бусад")}
        </h3>
        <div className="mt-2 flex flex-col gap-1">
          {(
            [
              { key: "autoAudio", label: "Үгийг автоматаар дуудах" },
              { key: "showPinyin", label: "Пиньинь үргэлж харуулах (хялбар)" },
            ] as const
          ).map((o) => (
            <label
              key={o.key}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-2.5 ring-1 ring-slate-200"
            >
              <span className="text-sm font-semibold text-slate-800">{tr(locale, o.label)}</span>
              <input
                type="checkbox"
                checked={settings[o.key]}
                onChange={() => onChange({ ...settings, [o.key]: !settings[o.key] })}
                className="h-5 w-5 accent-emerald-600"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
