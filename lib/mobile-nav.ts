export type MobileNavTab = "home" | "study" | "kanji" | "games" | "profile";

export type MobileNavItem = {
  id: MobileNavTab;
  href: string;
  label: string;
  icon: string;
  match: (pathname: string) => boolean;
};

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  {
    id: "home",
    href: "/home",
    label: "Нүүр",
    icon: "🏠",
    match: (p) => p === "/home" || p === "/",
  },
  {
    id: "study",
    href: "/study",
    label: "Давтах",
    icon: "📚",
    match: (p) =>
      p.startsWith("/study") ||
      p.startsWith("/review") ||
      p.startsWith("/courses") ||
      p.startsWith("/lessons"),
  },
  {
    id: "kanji",
    href: "/kanji",
    label: "Ханз",
    icon: "字",
    match: (p) => p.startsWith("/kanji"),
  },
  {
    id: "games",
    href: "/games",
    label: "Тоглоом",
    icon: "🎮",
    match: (p) => p.startsWith("/games"),
  },
  {
    id: "profile",
    href: "/profile",
    label: "Профайл",
    icon: "👤",
    match: (p) =>
      p.startsWith("/profile") ||
      p.startsWith("/settings") ||
      p.startsWith("/dashboard") ||
      p.startsWith("/progress") ||
      p.startsWith("/login") ||
      p.startsWith("/signup"),
  },
];

export function resolveMobileNavTab(pathname: string): MobileNavTab {
  const item = MOBILE_NAV_ITEMS.find((entry) => entry.match(pathname));
  return item?.id ?? "home";
}
