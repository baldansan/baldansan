"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import {
  getNotificationsUnified,
  getUnreadCountUnified,
  markAllNotificationsReadUnified,
  markNotificationReadUnified,
} from "@/lib/engagement/engagement-service";
import type { UserNotification } from "@/lib/engagement/types";

export function NotificationsView() {
  const [ready, setReady] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);

  async function refresh() {
    setNotifications(await getNotificationsUnified());
    setUnread(await getUnreadCountUnified());
    setReady(true);
  }

  useEffect(() => {
    void refresh();
  }, []);

  if (!ready) {
    return (
      <PublicPageShell>
        <p className="py-16 text-center text-sm text-slate-500">Ачааллаж байна…</p>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-2 text-slate-600">
            Unread: <span className="font-semibold text-emerald-700">{unread}</span>
          </p>
        </div>
        {unread > 0 ? (
          <button
            type="button"
            onClick={() => void markAllNotificationsReadUnified().then(refresh)}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
          >
            Mark all read
          </button>
        ) : null}
      </section>

      {notifications.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 ring-1 ring-slate-200">
          Одоогоор notification алга.
        </p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((item) => (
            <li
              key={item.id}
              className={`rounded-2xl p-5 ring-1 ${
                item.readAt
                  ? "bg-white ring-slate-200"
                  : "bg-emerald-50/70 ring-emerald-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {item.notificationType}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{item.title}</p>
                  {item.message ? (
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    {formatMongoliaDateTimeWithLabel(item.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {!item.readAt ? (
                    <button
                      type="button"
                      onClick={() =>
                        void markNotificationReadUnified(item.id).then(refresh)
                      }
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold"
                    >
                      Mark read
                    </button>
                  ) : null}
                  {item.actionHref ? (
                    <Link
                      href={item.actionHref}
                      className="rounded-full bg-emerald-500 px-3 py-1 text-center text-xs font-semibold text-white"
                    >
                      Open
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PublicPageShell>
  );
}
