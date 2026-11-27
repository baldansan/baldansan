import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Мэдэгдэл асаасан (хөтөч эсвэл апп) хэрэглэгчдийн id. */
export async function loadPushUserIds(service: SupabaseClient): Promise<string[]> {
  const ids = new Set<string>();
  const web = await service.from("push_subscriptions").select("user_id").limit(20000);
  for (const row of (web.data ?? []) as { user_id: string }[]) ids.add(String(row.user_id));
  // 092 ажиллаагүй бол алдаа буцаана — чимээгүй алгасна.
  const native = await service.from("native_push_tokens").select("user_id").limit(20000);
  for (const row of (native.data ?? []) as { user_id: string }[]) ids.add(String(row.user_id));
  return [...ids];
}

/**
 * Хэрэглэгч бүрийн хамгийн сүүлийн идэвх (ms): сорил, үгийн давталт, өдрийн цуваа.
 * Өмнөх шалгалт зөвхөн сорил + үгийг хардаг байсан тул зөвхөн хичээл үздэг, ханз бичдэг хүнийг
 * «ороогүй» гэж андуурдаг байв — user_streaks.last_active_date аливаа сурах үйлдлээр шинэчлэгддэг.
 */
export async function loadLastActivityByUser(
  service: SupabaseClient,
  userIds: string[]
): Promise<Map<string, number>> {
  const last = new Map<string, number>();
  const bump = (uid: unknown, raw: unknown) => {
    if (!uid || !raw) return;
    const at = new Date(String(raw)).getTime();
    if (Number.isNaN(at)) return;
    const key = String(uid);
    if (at > (last.get(key) ?? 0)) last.set(key, at);
  };
  for (let i = 0; i < userIds.length; i += 200) {
    const chunk = userIds.slice(i, i + 200);
    const [streaks, quiz, vocab] = await Promise.all([
      service.from("user_streaks").select("user_id, last_active_date, updated_at").in("user_id", chunk),
      service
        .from("user_quiz_attempts")
        .select("user_id, created_at")
        .in("user_id", chunk)
        .order("created_at", { ascending: false })
        .limit(2000),
      service
        .from("user_vocabulary_progress")
        .select("user_id, updated_at")
        .in("user_id", chunk)
        .order("updated_at", { ascending: false })
        .limit(2000),
    ]);
    for (const row of (streaks.data ?? []) as Record<string, unknown>[]) {
      // last_active_date нь өдөр (УБ-ын) — өдрийн төгсгөлөөр тооцвол «өнөөдөр орсон» хүнд явуулахгүй.
      if (row.last_active_date) bump(row.user_id, `${String(row.last_active_date)}T15:59:59Z`);
    }
    for (const row of (quiz.data ?? []) as Record<string, unknown>[]) bump(row.user_id, row.created_at);
    for (const row of (vocab.data ?? []) as Record<string, unknown>[]) bump(row.user_id, row.updated_at);
  }
  return last;
}
