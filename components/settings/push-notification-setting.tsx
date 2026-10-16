"use client";

import { useEffect, useState } from "react";
import { MobileCard } from "@/components/mobile/mobile-card";
import {
  getNotificationPermissionState,
  getPushAvailability,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/push-client";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

export function PushNotificationSetting() {
  const locale = useUiLocale();
  const [available, setAvailable] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setAvailable(getPushAvailability() === "ready");
    void getNotificationPermissionState().then(setPermission);
  }, []);

  if (!available) return null;

  async function handleEnable() {
    setBusy(true);
    setMessage(null);
    const result = await subscribeToPush();
    setBusy(false);
    setPermission(await getNotificationPermissionState());
    if (result.ok) {
      setMessage(tr(locale, "Мэдэгдэл идэвхжлээ ✓"));
    } else if (result.reason === "permission-denied") {
      setMessage(tr(locale, "Зөвшөөрөл өгөөгүй — хөтчийн тохиргооноос зөвшөөрнө үү."));
    } else {
      setMessage(tr(locale, "Идэвхжүүлж чадсангүй — дахин оролдоно уу."));
    }
  }

  async function handleDisable() {
    setBusy(true);
    setMessage(null);
    await unsubscribeFromPush();
    setBusy(false);
    setMessage(tr(locale, "Мэдэгдэл унтарлаа."));
  }

  const granted = permission === "granted";

  return (
    <MobileCard padding="lg" className="mb-4">
      <h2 className="text-sm font-bold text-[var(--app-text)]">
        🔔 {tr(locale, "Сэргээх мэдэгдэл")}
      </h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        {tr(locale, "Хэд хоног ороогүй бол сануулах push мэдэгдэл авах эсэхээ сонгоно.")}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {!granted ? (
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="app-btn-primary !min-h-0 !py-2 !text-xs disabled:opacity-60"
          >
            {busy ? tr(locale, "Асааж байна…") : tr(locale, "Мэдэгдэл асаах")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDisable}
            disabled={busy}
            className="app-btn-secondary !min-h-0 !py-2 !text-xs disabled:opacity-60"
          >
            {busy ? tr(locale, "Унтрааж байна…") : tr(locale, "Мэдэгдэл унтраах")}
          </button>
        )}
      </div>
      {message ? (
        <p className="mt-2 text-xs text-[var(--app-muted)]">{message}</p>
      ) : null}
      {permission === "denied" ? (
        <p className="mt-2 text-xs text-amber-700">
          {tr(
            locale,
            "Хөтчөөс мэдэгдэл хориглосон байна — хөтчийн сайтын тохиргооноос зөвшөөрнө үү."
          )}
        </p>
      ) : null}
    </MobileCard>
  );
}
