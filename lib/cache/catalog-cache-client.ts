/**
 * Browser талаас нийтийн каталогийн Data Cache-ийг хуучруулах (POST /api/admin/cache).
 *
 * Admin UI-ийн хичээлийн бичлэгүүд (status, metadata, media, үг/асуулт, импорт, rollback…)
 * Supabase-д browser клиентээр шууд бичдэг тул server талын `revalidateTag` хүрдэггүй.
 * Бичлэг бүр `logAdminActivity`-гаар дамждаг тул тэндээс энэ функцийг дуудна.
 * Fire-and-forget: амжилтгүй бол кэш 120с-д өөрөө хуучирна.
 */
export function notifyCatalogChangedFromBrowser(lessonId?: string | null): void {
  if (typeof window === "undefined" || typeof fetch !== "function") return;
  try {
    void fetch("/api/admin/cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lessonId ? { lessonId } : {}),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    // Кэш хуучруулалт заавал биш.
  }
}
