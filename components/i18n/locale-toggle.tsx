"use client";

import { usePathname } from "next/navigation";
import { switchUiLocale, useUiLocale } from "@/lib/i18n/ui-locale";

/** Толгойн хэл солигч: 中文 | МН — бүх дэлгэцэнд (admin ч мөн). */
export function LocaleToggle({ className = "" }: { className?: string }) {
  const locale = useUiLocale();
  const base =
    "inline-flex h-7 items-center rounded-full border border-slate-200 bg-white/90 p-0.5 text-[11px] font-bold shadow-sm backdrop-blur";
  const pill = (on: boolean) =>
    `rounded-full px-2 leading-6 transition ${on ? "bg-emerald-500 text-white" : "text-slate-500"}`;
  return (
    <div className={`${base} ${className}`} role="group" aria-label="界面语言 / Хэл" translate="no">
      <button type="button" className={pill(locale === "zh")} onClick={() => locale !== "zh" && switchUiLocale("zh")}>
        中文
      </button>
      <button type="button" className={pill(locale === "mn")} onClick={() => locale !== "mn" && switchUiLocale("mn")}>
        МН
      </button>
    </div>
  );
}

/** Дэлгэцийн баруун дээд буланд тогтмол байрлах хувилбар. */
export function FloatingLocaleToggle() {
  const pathname = usePathname() ?? "";
  // Админ topbar өөрийн солигчтой; бичлэг тоглуулагч бүтэн дэлгэц
  if (pathname.startsWith("/admin") || /^\/bichleg\/[^/]+/.test(pathname)) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-end px-3 pt-[max(0.5rem,env(safe-area-inset-top))] print:hidden">
      <LocaleToggle className="pointer-events-auto" />
    </div>
  );
}
