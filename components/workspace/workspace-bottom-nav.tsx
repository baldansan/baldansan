"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/teacher/today", label: "Өнөөдөр", icon: "🏠", match: (p: string) => p === "/teacher/today" },
  { href: "/teacher/classes", label: "Ангиуд", icon: "👥", match: (p: string) => p.startsWith("/teacher/classes") },
  { href: "/teacher/assignments/new", label: "Өгөх", icon: "＋", primary: true, match: (p: string) => p === "/teacher/assignments/new" },
  {
    href: "/teacher/assignments",
    label: "Даалгавар",
    icon: "📝",
    match: (p: string) => p.startsWith("/teacher/assignments") && p !== "/teacher/assignments/new",
  },
  { href: "/teacher/reports", label: "Тайлан", icon: "📈", match: (p: string) => p.startsWith("/teacher/reports") },
];

/** Утсан дээр багшийн өдөр тутмын 5 үйлдэл эрхий хурууны доор. Компьютер дээр нуугдана. */
export function WorkspaceBottomNav() {
  const pathname = usePathname();
  // Нэвтрэх хуудсан дээр цэс хэрэггүй.
  if (pathname === "/teacher") return null;
  return (
    <nav
      aria-label="Багшийн үндсэн цэс"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-end justify-between px-2">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold"
              >
                {item.primary ? (
                  <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white shadow-lg ring-4 ring-white">
                    {item.icon}
                  </span>
                ) : (
                  <span aria-hidden className={`text-xl ${active ? "" : "opacity-60 grayscale"}`}>
                    {item.icon}
                  </span>
                )}
                <span className={active || item.primary ? "text-emerald-700" : "text-slate-500"}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
