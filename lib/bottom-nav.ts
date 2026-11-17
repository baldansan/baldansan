import type { BottomNavTab } from "@/components/BottomNav";
import type { MobileNavTab } from "@/lib/mobile-nav";

/** Map legacy MobileAppShell tabs to the new bottom nav. */
export function resolveBottomNavTab(
  tab?: MobileNavTab | BottomNavTab
): BottomNavTab {
  if (!tab) return "home";
  if (
    tab === "home" ||
    tab === "review" ||
    tab === "books" ||
    tab === "games" ||
    tab === "profile"
  ) {
    return tab;
  }
  // Дуу·Бичлэг одоо «Давтах» дотор байрлана.
  if (tab === "study" || tab === "kanji") return "review";
  return "home";
}
