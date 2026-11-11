"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { resolvePageHelp } from "@/lib/admin/page-help";

const KEY = "bs.workspace.help.hidden";
const EVENT = "bs-help-change";

function readHidden(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function setHidden(hidden: boolean) {
  try {
    window.localStorage.setItem(KEY, hidden ? "1" : "");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Хуудас бүрийн дээд талын ногоон «Энэ хуудсанд» тайлбар.
 * «Нуух» дарвал бүх хуудсанд жижиг «?» товч болж хураагдана; дахин дарвал нээгдэнэ.
 */
export function PageHelpStrip() {
  const pathname = usePathname();
  const hidden = useSyncExternalStore(subscribe, readHidden, () => "") === "1";
  const help = resolvePageHelp(pathname);
  if (!help) return null;

  if (hidden) {
    return (
      <div className="mb-3 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"
        >
          <span aria-hidden>❓</span> Энэ хуудас юу вэ?
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Энэ хуудасны тайлбар"
      className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 print:hidden"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 text-lg">
          💡
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-emerald-950">
            <b>Энэ хуудсанд:</b> {help.what}
          </p>
          <ul className="mt-1.5 grid gap-x-6 gap-y-1 text-[13px] leading-5 text-emerald-900 sm:grid-cols-2">
            {help.can.map((line) => (
              <li key={line} className="flex gap-1.5">
                <span aria-hidden className="text-emerald-500">
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {help.next?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {help.next.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"
                >
                  {n.label} →
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          Нуух ✕
        </button>
      </div>
    </aside>
  );
}
