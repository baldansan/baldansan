"use client";

import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

/** Сервер дээр SUPABASE_SERVICE_ROLE_KEY тохируулаагүй үеийн найрсаг тайлбар. */
export function KidsServiceRoleNotice() {
  const locale = useUiLocale();
  return (
    <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
      <p className="font-semibold">{tr(locale, "Хүүхдийн бүртгэл удахгүй нээгдэнэ")}</p>
      <p className="mt-1 leading-6">
        {tr(
          locale,
          "Имэйлгүй хүүхдийн бүртгэл үүсгэхэд серверийн тусгай тохиргоо шаардлагатай бөгөөд одоогоор идэвхжээгүй байна. Аппын админд хэлээрэй — тохируулсны дараа энд хүүхдээ нэмж, PIN-ээр нэвтрүүлэх боломжтой болно."
        )}
      </p>
      <p className="mt-2 text-xs text-amber-800">
        {tr(locale, "Админд: Vercel → Settings → Environment Variables дээр SUPABASE_SERVICE_ROLE_KEY нэмнэ үү.")}
      </p>
    </div>
  );
}
