"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  DAY_STICKERS,
  KID_PATH,
  KID_PATH_CHARS,
  KID_PATH_WRITING_REPS,
  KID_PATH_WRITING_TITLE,
  ensureKidPathStarted,
  kidTaskHref,
  setKidDaySticker,
  setKidTaskDone,
  setKidWritingListId,
  type KidDay,
  type KidDayStatus,
  type KidTask,
} from "@/lib/kids/path";
import { useKidPath } from "@/lib/kids/use-kid-path";
import { localCreateList, localGetList, localUpdateList } from "@/lib/writing/local-store";
import type { WritingItem } from "@/lib/writing/types";
import "@/components/kids/kid-path.css";

type Props = {
  /** ?day=N — тухайн өдрийг дэлгэсэн байдлаар нээнэ */
  initialDay: number | null;
  /** ?medal=1 — медалийн дэлгэц */
  medal: boolean;
};

const CONFETTI = ["🎉", "⭐", "🎈", "✨", "🌟", "🎊", "💚", "🧡"];
/** Наалт авсны дараа баярын дэлгэц хэдэн мс харагдах */
const CELEBRATE_MS = 2600;

async function lookupChars(chars: readonly string[]): Promise<WritingItem[]> {
  const fallback: WritingItem[] = chars.map((ch) => ({ ch, word: null, pinyin: null, meaning_mn: null }));
  try {
    const res = await fetch("/api/writing/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: chars.join("") }),
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as { items?: WritingItem[] };
    const found = new Map<string, WritingItem>();
    for (const it of json.items ?? []) if (it?.ch && !found.has(it.ch)) found.set(it.ch, it);
    return chars.map((ch) => {
      const f = found.get(ch);
      return f ? { ch, word: f.word ?? null, pinyin: f.pinyin ?? null, meaning_mn: f.meaning_mn ?? null } : { ch, word: null, pinyin: null, meaning_mn: null };
    });
  } catch {
    return fallback;
  }
}

function dayLabel(locale: "mn" | "zh", n: number): string {
  return locale === "zh" ? `第 ${n} 天` : `${tr(locale, "Өдөр")} ${n}`;
}

export function KidPathClient({ initialDay, medal }: Props) {
  const locale = useUiLocale();
  const router = useRouter();
  const kp = useKidPath();
  const { kidId, kidName, kidAvatar, state, summary, refresh } = kp;

  // undefined = сонгоогүй (→ өнөөдрийн өдөр дэлгэнэ), null = бүгд хумигдсан
  const [chosenDay, setChosenDay] = useState<number | null | undefined>(initialDay ?? undefined);
  const openDay = chosenDay === undefined ? (kidId ? summary.currentDay : null) : chosenDay;
  const [showMedal, setShowMedal] = useState(medal);
  const [celebrate, setCelebrate] = useState<{ day: number; sticker: string } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const creatingRef = useRef(false);

  // Анх нээхэд: замыг эхлүүлж, «Хүүхдийн 14 ханз» дэвтрийг нэг удаа үүсгэнэ.
  useEffect(() => {
    if (!kidId) return;
    const st = ensureKidPathStarted(kidId);
    const existing = st.writingListId ? localGetList(st.writingListId) : null;
    // Пиньинь/утга нь бүгд хоосон бол (өмнөх lookup амжилтгүй) дахин нөхнө
    const needsFill = existing != null && existing.items.every((it) => !it.pinyin);
    if (existing && !needsFill) return;
    if (creatingRef.current) return;
    creatingRef.current = true;
    setPreparing(true);
    void (async () => {
      const items = await lookupChars(KID_PATH_CHARS);
      if (existing) {
        if (items.some((it) => it.pinyin)) localUpdateList(existing.id, { items });
      } else {
        const list = localCreateList({
          title: KID_PATH_WRITING_TITLE,
          kind: "own",
          items,
          repsTrace: KID_PATH_WRITING_REPS.trace,
          repsMemory: KID_PATH_WRITING_REPS.memory,
        });
        setKidWritingListId(kidId, list.id);
      }
      creatingRef.current = false;
      setPreparing(false);
      refresh();
    })();
  }, [kidId, refresh]);

  // Өдөр бүрэн дууссан → наалт (нэг удаа, localStorage-д stickerAt) + баярын дэлгэц
  useEffect(() => {
    if (!kidId) return;
    const pending = summary.days.find((d) => d.complete && !state.days[d.day]?.stickerAt);
    if (!pending) return;
    setKidDaySticker(kidId, pending.day);
    // Store бичихэд дахин render болдог тул цэвэрлэхгүй — баяр заавал гарна
    window.setTimeout(() => setCelebrate({ day: pending.day, sticker: DAY_STICKERS[pending.day - 1] }), 0);
  }, [kidId, summary.days, state.days]);

  useEffect(() => {
    if (!celebrate) return;
    const t = window.setTimeout(() => {
      setCelebrate(null);
      if (celebrate.day === 7) setShowMedal(true);
    }, CELEBRATE_MS);
    return () => window.clearTimeout(t);
  }, [celebrate]);

  const headerName = useMemo(() => {
    if (!kidId || kidId === "guest" || !kidName) return tr(locale, "Миний 7 хоног");
    return locale === "zh" ? `${kidName}的七天` : `${kidName}-ийн 7 хоног`;
  }, [kidId, kidName, locale]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        emoji: CONFETTI[i % CONFETTI.length],
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 6) * 0.12}s`,
        size: 18 + ((i * 7) % 14),
      })),
    []
  );

  function toggleTask(day: number, task: KidTask, done: boolean) {
    if (!kidId) return;
    setKidTaskDone(kidId, day, task.id, !done);
  }

  function pickDay(day: number) {
    const next = openDay === day ? null : day;
    setChosenDay(next);
    try {
      const url = next ? `/kids/path?day=${next}` : "/kids/path";
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // ignore
    }
  }

  if (showMedal) {
    return (
      <MobileAppShell activeTab="home" mainClassName={SHELL_MAIN_NARROW}>
        <MedalScreen
          locale={locale}
          name={kidId === "guest" || !kidName ? null : kidName}
          avatar={kidAvatar}
          allComplete={summary.allComplete}
          onBoard={() => {
            setShowMedal(false);
            router.replace("/kids/path");
          }}
        />
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell activeTab="home" mainClassName={SHELL_MAIN_NARROW}>
      {celebrate ? (
        <>
          <div className="kp-confetti" aria-hidden>
            {confetti.map((c, i) => (
              <span key={i} style={{ left: c.left, animationDelay: c.delay, fontSize: c.size }}>
                {c.emoji}
              </span>
            ))}
          </div>
          <div className="fixed inset-x-4 top-1/3 z-[61] rounded-[28px] bg-white p-6 text-center shadow-2xl ring-4 ring-amber-300">
            <div className="kp-sticker-pop text-7xl" aria-hidden>
              {celebrate.sticker}
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-700">{tr(locale, "Наалт авлаа!")}</p>
            <p className="text-sm font-bold text-[var(--app-muted)]">
              {dayLabel(locale, celebrate.day)} · {tr(locale, "Бүх даалгавар дууслаа!")}
            </p>
          </div>
        </>
      ) : null}

      {/* Толгой */}
      <section className="mb-4 rounded-[24px] bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 p-5 text-center shadow-[0_10px_30px_rgba(251,146,60,0.3)]">
        <p className="text-4xl" aria-hidden>
          {kidId === "guest" || !kidName ? "🧒" : kidAvatar}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#3b2410]">
          🧒 <span translate="no">{headerName}</span>
        </h1>
        <p className="mt-1 text-sm font-bold text-[#6b3f1d]">
          {dayLabel(locale, summary.currentDay)} · {summary.doneTasks}/{summary.totalTasks} ✓
        </p>
      </section>

      {/* Наалтын самбар */}
      <section className="mb-4 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-amber-100">
        <p className="mb-2 text-center text-xs font-extrabold uppercase tracking-wide text-amber-700">
          {tr(locale, "Наалт")} {summary.days.filter((d) => d.complete).length}/7
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {KID_PATH.map((d, i) => {
            const st = summary.days[i];
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => pickDay(d.day)}
                aria-label={dayLabel(locale, d.day)}
                className={`flex aspect-square items-center justify-center rounded-2xl text-3xl ring-2 ${
                  st.complete ? "bg-amber-50 ring-amber-300" : "bg-slate-50 text-slate-300 ring-slate-100"
                } ${d.day === summary.currentDay && !st.complete ? "kp-bounce ring-emerald-300" : ""}`}
              >
                <span aria-hidden className={st.complete ? "kp-sticker-pop" : ""}>
                  {st.complete ? d.sticker : "·"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {preparing ? (
        <p className="mb-3 text-center text-xs font-semibold text-[var(--app-muted)]">{tr(locale, "Дэвтэр бэлдэж байна…")}</p>
      ) : null}

      {/* Өдрийн картууд */}
      <div className="flex flex-col gap-3">
        {KID_PATH.map((d, i) => (
          <DayCard
            key={d.day}
            locale={locale}
            day={d}
            status={summary.days[i]}
            isToday={d.day === summary.currentDay && !summary.allComplete}
            open={openDay === d.day}
            manual={state.days[d.day]?.tasks ?? {}}
            writingListId={state.writingListId}
            onToggleOpen={() => pickDay(d.day)}
            onToggleTask={(task, done) => toggleTask(d.day, task, done)}
          />
        ))}
      </div>

      {summary.allComplete ? (
        <button type="button" onClick={() => setShowMedal(true)} className="app-btn-primary mt-4 w-full text-lg">
          🏅 {tr(locale, "Медаль")}
        </button>
      ) : null}

      <p className="mt-4 text-center text-xs text-[var(--app-muted)]">{tr(locale, "Даалгавар дээр дарж ✓ тэмдэглэнэ")}</p>
    </MobileAppShell>
  );
}

/* ---------------- Өдрийн карт ---------------- */

function DayCard({
  locale,
  day,
  status,
  isToday,
  open,
  manual,
  writingListId,
  onToggleOpen,
  onToggleTask,
}: {
  locale: "mn" | "zh";
  day: KidDay;
  status: KidDayStatus;
  isToday: boolean;
  open: boolean;
  manual: Record<string, true>;
  writingListId: string | undefined;
  onToggleOpen: () => void;
  onToggleTask: (task: KidTask, done: boolean) => void;
}) {
  const firstUndone = day.tasks.find((t) => !status.tasks[t.id]);
  const minutes = day.tasks.reduce((n, t) => n + t.minutes, 0);
  return (
    <section
      className={`rounded-[24px] bg-white shadow-sm ring-2 ${
        isToday ? "ring-emerald-400" : status.complete ? "ring-amber-200" : "ring-slate-100"
      }`}
      data-day={day.day}
    >
      <button type="button" onClick={onToggleOpen} className="flex w-full items-center gap-3 p-4 text-left">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${
            status.complete ? "bg-amber-50" : "bg-slate-50"
          }`}
          aria-hidden
        >
          {status.complete ? day.sticker : day.day}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-lg font-extrabold text-[var(--app-text)]">{dayLabel(locale, day.day)}</span>
            {isToday ? (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-extrabold text-white">
                {tr(locale, "Өнөөдөр")}
              </span>
            ) : null}
          </span>
          <span className="block text-sm font-bold text-[var(--app-muted)]">
            {locale === "zh" ? day.titleZh : day.title} · {status.done}/{status.total} ✓ · {minutes} {tr(locale, "мин")}
          </span>
        </span>
        <span className="text-xl text-slate-400" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open ? (
        <div className="border-t border-slate-100 px-3 pb-3 pt-2">
          <ul className="flex flex-col gap-2">
            {day.tasks.map((t) => {
              const done = status.tasks[t.id];
              const href = kidTaskHref(t, writingListId);
              const disabled = t.kind === "write" && !writingListId;
              return (
                <li key={t.id} className="flex items-stretch gap-2">
                  <Link
                    href={href}
                    aria-disabled={disabled}
                    onClick={(e) => {
                      if (disabled) e.preventDefault();
                    }}
                    className={`flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 ring-1 transition-colors active:bg-emerald-50 ${
                      done ? "bg-emerald-50 ring-emerald-200" : "bg-slate-50 ring-slate-100"
                    } ${disabled ? "opacity-60" : ""}`}
                  >
                    <span className="text-3xl" aria-hidden>
                      {t.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-extrabold text-[var(--app-text)]">
                        {locale === "zh" ? t.titleZh : t.title}
                      </span>
                      {t.detail ? (
                        <span className="hanzi block truncate text-sm font-bold text-[var(--app-muted)]" translate="no">
                          {locale === "zh" && t.detailZh ? t.detailZh : t.detail}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs font-bold text-[var(--app-muted)]">
                      {t.minutes} {tr(locale, "мин")}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => onToggleTask(t, Boolean(manual[t.id]))}
                    aria-pressed={done}
                    aria-label={tr(locale, "Дууслаа ✓")}
                    className={`flex w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold ring-2 ${
                      done ? "bg-emerald-500 text-white ring-emerald-500" : "bg-white text-slate-300 ring-slate-200"
                    }`}
                  >
                    ✓
                  </button>
                </li>
              );
            })}
          </ul>
          {firstUndone ? (
            <Link
              href={kidTaskHref(firstUndone, writingListId)}
              className="app-btn-primary mt-3 flex w-full items-center justify-center gap-2 text-lg"
            >
              ▶ {tr(locale, "Эхлэх")}
            </Link>
          ) : (
            <p className="mt-3 rounded-2xl bg-amber-50 py-2 text-center text-base font-extrabold text-amber-800">
              {day.sticker} {tr(locale, "Бүх даалгавар дууслаа!")}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

/* ---------------- Медалийн дэлгэц ---------------- */

function MedalScreen({
  locale,
  name,
  avatar,
  allComplete,
  onBoard,
}: {
  locale: "mn" | "zh";
  name: string | null;
  avatar: string;
  allComplete: boolean;
  onBoard: () => void;
}) {
  const learned = [
    ["🅰️", "6 эгшиг"],
    ["👄", "12 гийгүүлэгч"],
    ["📖", "5 ном"],
    ["📜", "三字经 20 мөр"],
    ["✍️", "14 ханз"],
  ] as const;
  const title =
    locale === "zh"
      ? `${name ?? "我"}完成了七天！`
      : name
        ? `${name} 7 хоногийг дууслаа!`
        : `Би 7 хоногийг дууслаа!`;
  return (
    <section className="rounded-[28px] bg-gradient-to-b from-amber-200 via-amber-100 to-white p-6 text-center shadow-lg ring-4 ring-amber-300">
      <div className="kp-medal text-8xl" aria-hidden>
        🏅
      </div>
      <p className="mt-2 text-4xl" aria-hidden>
        {avatar}
      </p>
      <h1 className="mt-2 text-2xl font-extrabold text-[#3b2410]">
        <span translate="no">{title}</span>
      </h1>
      {!allComplete ? (
        <p className="mt-1 text-xs font-semibold text-amber-800">{tr(locale, "Медаль")} · {tr(locale, "Наалт")} 7/7</p>
      ) : null}

      <p className="mt-5 text-sm font-extrabold uppercase tracking-wide text-amber-700">{tr(locale, "Юу сурсан бэ")}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {learned.map(([emoji, label]) => (
          <li key={label} className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-white px-4 ring-1 ring-amber-200">
            <span className="text-3xl" aria-hidden>
              {emoji}
            </span>
            <span className="text-lg font-extrabold text-[var(--app-text)]">{tr(locale, label)}</span>
            <span className="ml-auto text-2xl text-emerald-500" aria-hidden>
              ✓
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex justify-center gap-1 text-3xl" aria-hidden>
        {DAY_STICKERS.map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>

      <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-base font-extrabold text-emerald-800">
        🚀 {tr(locale, "Дараагийн 7 хоног удахгүй")}
      </p>

      <button type="button" onClick={onBoard} className="app-btn-secondary mt-4 w-full">
        {tr(locale, "Наалтын самбар")}
      </button>
      <Link href="/home" className="mt-3 block text-sm font-bold text-emerald-700">
        ← {tr(locale, "Буцах")}
      </Link>
    </section>
  );
}
