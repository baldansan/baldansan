import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

const BUCKET = "feedback-screenshots";

/**
 * Дэлгэцийн зургийг browser-аас шууд storage-д (anon түлхүүр, 077 migration-ийн
 * insert policy). Амжилтгүй бол null — тэмдэглэл зураггүйгээр хадгалагдана.
 */
export async function uploadReportScreenshotClient(dataUrl: string): Promise<string | null> {
  if (!hasSupabaseConfig || !supabase) return null;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (blob.size === 0 || blob.size > 1_800_000) return null;
    const now = new Date();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `reports/${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000" });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}
