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
    tab === "clips" ||
    tab === "games" ||
    tab === "profile"
  ) {
    return tab;
  }
  if (tab === "study" || tab === "kanji") return "review";
  return "home";
}
