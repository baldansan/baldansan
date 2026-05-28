import Link from "next/link";

const items = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/review", label: "Review" },
  { href: "/profile", label: "Profile" },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="mx-auto flex max-w-5xl items-stretch justify-around px-2 py-2">
        {items.map((item) => (
          <li key={item.label} className="flex-1">
            <Link
              href={item.href}
              className="flex flex-col items-center justify-center rounded-lg px-2 py-2 text-xs font-medium text-slate-600 transition-colors hover:text-emerald-600"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
