/**
 * Store-ын апп (Capacitor) доторх жинхэнэ мэдэгдэл. Вэб/PWA дээр юу ч хийхгүй.
 *
 * NEXT_PUBLIC_NATIVE_PUSH=1 болсон үед л ажиллана: Firebase тохиргоогүй (google-services.json
 * байхгүй) Android build дээр register() дуудвал апп унадаг тул аюулгүйн түгжээ.
 */

type CapWindow = Window & {
  Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
};

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as CapWindow).Capacitor?.isNativePlatform?.());
}

export function isNativePushEnabled(): boolean {
  return isNativeApp() && process.env.NEXT_PUBLIC_NATIVE_PUSH === "1";
}

function nativePlatform(): "ios" | "android" {
  return (window as CapWindow).Capacitor?.getPlatform?.() === "ios" ? "ios" : "android";
}

let listenersReady = false;

async function ensureListeners() {
  if (listenersReady) return;
  listenersReady = true;
  const { PushNotifications } = await import("@capacitor/push-notifications");
  await PushNotifications.addListener("registration", (token) => {
    void fetch("/api/push/native-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ token: token.value, platform: nativePlatform() }),
    }).catch(() => undefined);
  });
  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = (action.notification.data as { url?: string } | undefined)?.url;
    if (typeof url === "string" && url.startsWith("/")) window.location.assign(url);
  });
}

/** "granted" | "denied" | "prompt" — апп биш эсвэл унтраалттай бол null. */
export async function getNativePushPermission(): Promise<string | null> {
  if (!isNativePushEnabled()) return null;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const status = await PushNotifications.checkPermissions();
    return status.receive === "prompt-with-rationale" ? "prompt" : status.receive;
  } catch {
    return null;
  }
}

/** Зөвшөөрөл асууж, token-оо серверт бүртгүүлнэ. */
export async function enableNativePush(): Promise<{ ok: boolean }> {
  if (!isNativePushEnabled()) return { ok: false };
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    let status = await PushNotifications.checkPermissions();
    if (status.receive !== "granted") status = await PushNotifications.requestPermissions();
    if (status.receive !== "granted") return { ok: false };
    await ensureListeners();
    await PushNotifications.register();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Апп нээгдэх бүрт: зөвшөөрөл аль хэдийн өгсөн бол token-оо чимээгүй шинэчилнэ. */
export async function refreshNativePushIfGranted(): Promise<void> {
  if ((await getNativePushPermission()) !== "granted") return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await ensureListeners();
    await PushNotifications.register();
  } catch {
    /* ignore */
  }
}
