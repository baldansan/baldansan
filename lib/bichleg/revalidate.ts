import { revalidatePath } from "next/cache";

/** Invalidate picker, episode lists, and player routes after admin/import changes. */
export function revalidateBichlegPages() {
  revalidatePath("/bichleg");
  revalidatePath("/bichleg/[seriesId]", "page");
  revalidatePath("/bichleg/[seriesId]/[videoId]", "page");
}
