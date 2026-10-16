import "server-only";

export type SendPushResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  statusCode?: number;
};

export type PushSubscriptionKeys = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export function isWebPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim()
  );
}

/**
 * Web Push илгээх (npm `web-push` package). VAPID түлхүүрүүд тохируулаагүй бол
 * лог бичээд graceful-degrade хийнэ — production деплойд алдаа шидэхгүй
 * (AI_API_KEY байхгүй үеийн scripted-fallback-той адил логик).
 */
export async function sendWebPush(
  subscription: PushSubscriptionKeys,
  payload: { title: string; body: string; url?: string }
): Promise<SendPushResult> {
  if (!isWebPushConfigured()) {
    console.log("[web-push] VAPID түлхүүр тохируулаагүй тул алгаслаа.");
    return { ok: false, skipped: true, reason: "VAPID keys not configured" };
  }

  try {
    const webpush = await import("web-push");
    webpush.default.setVapidDetails(
      process.env.VAPID_SUBJECT!.trim(),
      process.env.VAPID_PUBLIC_KEY!.trim(),
      process.env.VAPID_PRIVATE_KEY!.trim()
    );

    await webpush.default.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (e) {
    const statusCode =
      typeof e === "object" && e !== null && "statusCode" in e
        ? Number((e as { statusCode?: number }).statusCode)
        : undefined;
    console.error("[web-push] мэдэгдэл илгээхэд алдаа:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
      statusCode,
    };
  }
}
