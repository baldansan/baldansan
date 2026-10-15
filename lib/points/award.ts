import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { PointsSource } from "@/lib/points/points-config";

/** Оноо нэмэгдсэн үед UI (pill, /points) шинэчлэгдэхэд ашиглах event. */
export const POINTS_AWARDED_EVENT = "bs:points-awarded";

/**
 * Оноо өгөх (fire-and-forget). Нэвтрээгүй бол юу ч хийхгүй; алдаа гарвал
 * зөвхөн console.warn. Сервер (award_points RPC) идемпотент тул дахин дуудаж болно.
 */
export function awardPoints(
  source: PointsSource,
  refId: string | null | undefined,
  points: number,
  meta: Record<string, unknown> = {}
): void {
  if (!hasSupabaseConfig || !supabase) return;
  const pts = Math.round(Number(points));
  if (!Number.isFinite(pts) || pts <= 0) return;
  const client = supabase;
  void (async () => {
    try {
      const { userId } = await getAuthenticatedUserId();
      if (!userId) return;
      const { data, error } = await client.rpc("award_points", {
        p_source: source,
        p_ref_id: refId ?? null,
        p_points: pts,
        p_meta: meta,
      });
      if (error) {
        console.warn("[points] award_points failed:", error.message);
        return;
      }
      if (Number(data) > 0 && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(POINTS_AWARDED_EVENT, {
            detail: { source, points: Number(data) },
          })
        );
      }
    } catch (err) {
      console.warn("[points] award_points error:", err);
    }
  })();
}
