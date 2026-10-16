"use client";

/** Browser Push subscription — Notification зөвшөөрөл асууж, service worker-т бүртгэнэ. */

export type PushAvailability = "unsupported" | "no-vapid-key" | "ready";

export function getPushAvailability(): PushAvailability {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return "no-vapid-key";
  }
  return "ready";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getNotificationPermissionState(): Promise<NotificationPermission | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  return Notification.permission;
}

export async function subscribeToPush(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (getPushAvailability() !== "ready") {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "permission-denied" };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
    }

    const json = subscription.toJSON();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });

    if (!res.ok) {
      return { ok: false, reason: "server-save-failed" };
    }

    return { ok: true };
  } catch (e) {
    console.error("[push-client] subscribe error:", e);
    return { ok: false, reason: "unknown-error" };
  }
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean }> {
  if (getPushAvailability() === "unsupported") return { ok: false };
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
    }
    return { ok: true };
  } catch (e) {
    console.error("[push-client] unsubscribe error:", e);
    return { ok: false };
  }
}
