"use client";

import { useRouter } from "next/navigation";
import { setUiLocale } from "@/lib/i18n/ui-locale";

/** /zh хуудаснаас: UI-г хятад болгоод аппыг эхлүүлнэ. */
export function SwitchToZhButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        setUiLocale("zh");
        router.push("/home");
      }}
      className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-base font-bold text-white shadow-sm"
    >
      🇨🇳 把界面切换成中文，开始试用 →
    </button>
  );
}
