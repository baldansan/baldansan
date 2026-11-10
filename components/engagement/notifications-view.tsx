"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import {
  getNotificationsUnified,
  getUnreadCountUnified,
  markAllNotificationsReadUnified,
  markNotificationReadUnified,
} from "@/lib/engagement/engagement-service";
import type { NotificationType, UserNotification } from "@/lib/engagement/types";

/** Төрөл бүрийн дүрс, монгол нэр, өнгө — хэрэглэгч нэг харахад ойлгоно. */
const TYPE_META: Record<
  NotificationType,
  { icon: string; label: string; bg: string; ring: string }
> = {
  achievement: { icon: "🏆", label: "Амжилт", bg: "bg-amber-100", ring: "ring-amber-200" },
  reminder: { icon: "⏰", label: "Сануулга", bg: "bg-sky-100", ring: "ring-sky-200" },
  progress: { icon: "📈", label: "Ахиц", bg: "bg-emerald-100", ring: "ring-emerald-200" },
  system: { icon: "ℹ️", label: "Систем", bg: "bg-slate-100", ring: "ring-slate-200" },
  invitation_accepted: { icon: "🤝", label: "Урилга", bg: "bg-violet-100", ring: "ring-violet-200" },
};

function metaFor(type: NotificationType) {
  return TYPE_META[type] ?? TYPE_META.system;
}

/** Өнөөдөр / Өчигдөр / Өмнөх гэж бүлэглэнэ. */
function groupLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const day = (x: Date) => Math.floor((x.getTime() + 8 * 3600_000) / 86_400_000); // UB цаг
  const diff = day(now) - day(d);
  if (diff <= 0) return "Өнөөдөр";
  if (diff === 1) return "Өчигдөр";
  if (diff < 7) return "Энэ долоо хоног";
  return "Өмнөх";
}

export function NotificationsView() {
  const [ready, setReady] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);

  async function refresh() {
    const [list, count] = await Promise.all([
      getNotificationsUnified(),
      getUnreadCountUnified(),
    ]);
    setNotifications(list);
    setUnread(count);
    setReady(true);
  }

  useEffect(() => {
    const t = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(t);
  }, []);

  const groups: { label: string; items: UserNotification[] }[] = [];
  for (const n of notifications) {
    const label = groupLabel(n.createdAt);
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(n);
    else groups.push({ label, items: [n] });
  }

  return (
    <MobileAppShell activeTab="profile">
      <section className="flex items-end justify-between gap-3 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
            🔔 Мэдэгдэл
          </h1>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {unread > 0 ? (
              <>
                Уншаагүй <span className="font-semibold text-emerald-700">{unread}</span> мэдэгдэл
              </>
            ) : (
              "Бүгдийг уншсан байна"
            )}
          </p>
        </div>
        {unread > 0 ? (
          <button
            type="button"
            onClick={() => void markAllNotificationsReadUnified().then(refresh)}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800"
          >
            Бүгдийг уншсан болгох
          </button>
        ) : null}
      </section>

      {!ready ? (
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">Ачааллаж байна…</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl bg-[var(--app-card)] p-8 text-center ring-1 ring-[var(--app-border)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl">
            🔕
          </div>
          <p className="mt-4 text-base font-semibold text-[var(--app-text)]">Одоогоор мэдэгдэл алга</p>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Хичээл сурах сануулга, авсан амжилт, долоо хоногийн ахиц энд ирнэ.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-left">
            {(["reminder", "achievement", "progress"] as NotificationType[]).map((t) => {
              const m = metaFor(t);
              return (
                <div key={t} className={`rounded-2xl ${m.bg} p-3`}>
                  <div className="text-2xl">{m.icon}</div>
                  <p className="mt-1 text-xs font-semibold text-slate-800">{m.label}</p>
                </div>
              );
            })}
          </div>
          <Link
            href="/settings"
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white"
          >
            ⏰ Сануулга тохируулах
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                {g.label}
              </h2>
              <ul className="space-y-2">
                {g.items.map((item) => {
                  const m = metaFor(item.notificationType);
                  const isUnread = !item.readAt;
                  return (
                    <li
                      key={item.id}
                      className={`flex gap-3 rounded-2xl p-4 ring-1 ${
                        isUnread
                          ? `bg-[var(--app-card)] ${m.ring} shadow-sm`
                          : "bg-[var(--app-card)] ring-[var(--app-border)] opacity-80"
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl ${m.bg}`}
                        aria-hidden
                      >
                        {m.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                            {m.label}
                          </span>
                          {isUnread ? (
                            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="Уншаагүй" />
                          ) : null}
                        </div>
                        <p className="mt-0.5 font-semibold leading-snug text-[var(--app-text)]">{item.title}</p>
                        {item.message ? (
                          <p className="mt-1 text-sm leading-relaxed text-[var(--app-muted)]">{item.message}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-[var(--app-muted)]">
                            {formatMongoliaDateTimeWithLabel(item.createdAt)}
                          </span>
                          <span className="flex-1" />
                          {isUnread ? (
                            <button
                              type="button"
                              onClick={() => void markNotificationReadUnified(item.id).then(refresh)}
                              className="rounded-full border border-[var(--app-border)] px-3 py-1 text-xs font-semibold text-[var(--app-text)]"
                            >
                              Уншсан ✓
                            </button>
                          ) : null}
                          {item.actionHref ? (
                            <Link
                              href={item.actionHref}
                              className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white"
                            >
                              Нээх →
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </MobileAppShell>
  );
}
