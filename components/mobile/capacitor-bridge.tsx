"use client";

import { useEffect } from "react";

type CapacitorWindow = Window & {
  Capacitor?: { isNativePlatform?: () => boolean };
};

/**
 * Capacitor (Android/iOS) орчинд л ажиллана: Android «Буцах» товчийг вэб түүхээр
 * удирдаж, splash-ийг нууна. Энгийн вэб/PWA дээр юу ч хийхгүй.
 */
export function CapacitorBridge() {
  useEffect(() => {
    const cap = (window as CapacitorWindow).Capacitor;
    if (!cap?.isNativePlatform?.()) return;

    let removeListener: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const [{ App }, { SplashScreen }] = await Promise.all([
          import("@capacitor/app"),
          import("@capacitor/splash-screen"),
        ]);
        if (cancelled) return;
        const handle = await App.addListener("backButton", () => {
          const atRoot = window.location.pathname === "/" || window.history.length <= 1;
          if (atRoot) {
            void App.exitApp();
          } else {
            window.history.back();
          }
        });
        removeListener = () => void handle.remove();
        await SplashScreen.hide();
        // Мэдэгдлийн зөвшөөрөл өмнө нь өгсөн бол token-оо шинэчилнэ (асуулт гаргахгүй).
        void import("@/lib/push/native-push-client").then((m) => m.refreshNativePushIfGranted());
      } catch {
        // Native plugin байхгүй бол чимээгүй алгасна.
      }
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  return null;
}
