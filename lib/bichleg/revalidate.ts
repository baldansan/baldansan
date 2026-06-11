import { revalidatePath } from "next/cache";

/** Invalidate picker, series feeds, and orphan feed after admin/import changes. */
export function revalidateBichlegPages() {
  revalidatePath("/bichleg");
  revalidatePath("/bichleg/other");
  revalidatePath("/bichleg/[seriesId]", "page");
}
