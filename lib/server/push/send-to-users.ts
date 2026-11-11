import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isApnsConfigured,
  isFcmConfigured,
  sendApns,
  sendFcm,
} from "@/lib/server/push/native-push";
import { isWebPushConfigured, sendWebPush } from "@/lib/server/push/web-push-client";

export type PushFanoutResult = {
  /** Аль нэг суваг (хөтөч / Android / iPhone) тохируулагдсан эсэх. */
  configured: boolean;
  /** Ядаж нэг төхөөрөмжид нь очсон хэрэглэгчид. */
  reached: Set<string>;
};

/**
 * Өгсөн хэрэглэгчдийн БҮХ төхөөрөмж рүү мэдэгдэл: хөтөч (web push), Android апп (FCM),
 * iPhone апп (APNs). Тохируулаагүй сувгийг алгасна; хүчингүй болсон token-ийг цэвэрлэнэ.
 */
export async function sendPushToUsers(
  service: SupabaseClient,
  userIds: string[],
  payload: { title: string; body: string; url?: string }
): Promise<PushFanoutResult> {
  const web = isWebPushConfigured();
  const fcm = isFcmConfigured();
  const apns = isApnsConfigured();
  const reached = new Set<string>();
  if (userIds.length === 0 || !(web || fcm || apns)) {
    return { configured: web || fcm || apns, reached };
  }

  if (web) {
    const { data } = await service
      .from("push_subscriptions")
      .select("id, user_id, endpoint, keys")
      .in("user_id", userIds);
    for (const sub of (data ?? []) as {
      id: string;
      user_id: string;
      endpoint: string;
      keys: { p256dh: string; auth: string };
    }[]) {
      const r = await sendWebPush({ endpoint: sub.endpoint, keys: sub.keys }, payload);
      if (r.ok) reached.add(String(sub.user_id));
      else if (r.statusCode === 410 || r.statusCode === 404) {
        await service.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  if (fcm || apns) {
    // 092 ажиллаагүй бол алдаа буцаана — чимээгүй алгасна.
    const { data } = await service
      .from("native_push_tokens")
      .select("token, user_id, platform")
      .in("user_id", userIds);
    for (const row of (data ?? []) as { token: string; user_id: string; platform: string }[]) {
      const r =
        row.platform === "ios"
          ? apns
            ? await sendApns(row.token, payload)
            : null
          : fcm
            ? await sendFcm(row.token, payload)
            : null;
      if (!r) continue;
      if (r.ok) reached.add(String(row.user_id));
      else if (r.gone) {
        await service.from("native_push_tokens").delete().eq("token", row.token);
      }
    }
  }

  return { configured: true, reached };
}
