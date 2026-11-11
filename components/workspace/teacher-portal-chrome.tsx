"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { resolveAdminPageTitle } from "@/lib/admin/admin-nav";
import type { MyOrganization } from "@/lib/b2b/types";
import { getCurrentUser, signOut } from "@/lib/supabase/auth";
import { getMyOrganizationsWithRole } from "@/lib/supabase/organizations";
import {
  canManageOrganization,
  getOrganizationRoleLabel,
} from "@/lib/supabase/organization-permissions";

type NavItem = { href: string; label: string; icon: string; match: (p: string) => boolean };

const MY_WORK: NavItem[] = [
  { href: "/teacher/today", label: "Өнөөдөр", icon: "🏠", match: (p) => p === "/teacher/today" },
  { href: "/teacher/classes", label: "Миний ангиуд", icon: "👥", match: (p) => p.startsWith("/teacher/classes") },
  { href: "/teacher/assignments", label: "Даалгавар", icon: "📝", match: (p) => p.startsWith("/teacher/assignments") },
  {
    href: "/teacher/reports",
    label: "Тайлан",
    icon: "📈",
    match: (p) => p.startsWith("/teacher/reports") || p.startsWith("/teacher/certificate"),
  },
  { href: "/teacher/library", label: "Хичээлүүд", icon: "📚", match: (p) => p.startsWith("/teacher/library") },
  { href: "/teacher/guide", label: "Заавар", icon: "❓", match: (p) => p.startsWith("/teacher/guide") },
];

function centerNav(orgId: string): NavItem[] {
  const base = `/organization/${orgId}`;
  return [
    { href: `${base}/dashboard`, label: "Төвийн самбар", icon: "🏢", match: (p) => p === base || p.startsWith(`${base}/dashboard`) },
    { href: `${base}/members`, label: "Багш, гишүүд", icon: "🧑‍🏫", match: (p) => p.startsWith(`${base}/members`) },
    { href: `${base}/classrooms`, label: "Бүх анги", icon: "🏫", match: (p) => p.startsWith(`${base}/classrooms`) },
    { href: `${base}/assignments`, label: "Бүх даалгавар", icon: "🗂", match: (p) => p.startsWith(`${base}/assignments`) },
    { href: `${base}/reports`, label: "Төвийн тайлан", icon: "📊", match: (p) => p.startsWith(`${base}/reports`) },
    { href: `${base}/invitations`, label: "Урилга", icon: "✉️", match: (p) => p.startsWith(`${base}/invitations`) },
  ];
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-600 font-semibold text-white shadow-sm"
                  : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
              }`}
            >
              <span aria-hidden className="w-5 shrink-0 text-center text-base">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Багш / сургалтын төвийн ажлын талбарын хүрээ. Аппын эзэмшигчийн админ хэсгээс
 * ЗОРИУД өөр харагдана (цайвар), зөвхөн тухайн багш эсвэл түүний төвд хамаарах
 * зүйлсийг харуулна — админы хуудас руу нэг ч холбоос байхгүй.
 */
export function TeacherPortalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<MyOrganization[]>([]);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const menuOpen = openFor === pathname;

  useEffect(() => {
    let alive = true;
    void getCurrentUser().then(({ data }) => {
      if (!alive) return;
      setEmail(data?.email ?? null);
      if (!data) return;
      void getMyOrganizationsWithRole().then((res) => {
        if (!alive) return;
        setOrgs(
          (res.data ?? []).filter(
            (o) => o.memberStatus === "active" && o.memberRole !== "student"
          )
        );
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  // Аль төвийн хуудсан дээр байгаагаас хамаарч тэр төвийг, үгүй бол эхнийхийг харуулна.
  const orgFromPath = pathname.match(/^\/organization\/([^/]+)/)?.[1] ?? null;
  const org = orgs.find((o) => o.id === orgFromPath) ?? orgs[0] ?? null;
  const manages = org ? canManageOrganization({ role: org.memberRole }) : false;
  const title = pathname.startsWith("/organization")
    ? (org?.name ?? "Сургалтын төв")
    : pathname === "/teacher"
      ? "Багшийн самбар"
      : resolveAdminPageTitle(pathname);

  async function logout() {
    await signOut();
    try {
      window.localStorage.removeItem("bs.workspace.role");
    } catch {
      /* ignore */
    }
    router.push("/teacher");
    router.refresh();
  }

  const nav = (onNavigate?: () => void) => (
    <>
      <p className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        Миний ажил
      </p>
      <NavList items={MY_WORK} pathname={pathname} onNavigate={onNavigate} />

      {org ? (
        <>
          <p
            className="mt-4 truncate border-t border-slate-200 px-3 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
            translate="no"
          >
            {org.name}
          </p>
          {manages ? (
            <NavList items={centerNav(org.id)} pathname={pathname} onNavigate={onNavigate} />
          ) : (
            <p className="px-3 text-xs leading-5 text-slate-500">
              Та энэ төвийн {getOrganizationRoleLabel(org.memberRole).toLowerCase()}. Төвийн
              нэгдсэн мэдээллийг эрхлэгч л харна.
            </p>
          )}
          {orgs.length > 1 ? (
            <div className="mt-2 px-3">
              <p className="text-[10px] text-slate-400">Бусад төв:</p>
              {orgs
                .filter((o) => o.id !== org.id)
                .map((o) => (
                  <Link
                    key={o.id}
                    href={`/organization/${o.id}/dashboard`}
                    onClick={onNavigate}
                    className="block truncate py-1 text-xs font-semibold text-emerald-700 hover:underline"
                    translate="no"
                  >
                    {o.name} →
                  </Link>
                ))}
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );

  return (
    <div className="flex min-h-screen bg-emerald-50/40 text-slate-900">
      <aside className="admin-sidebar-portal hidden w-[240px] shrink-0 flex-col border-r border-emerald-100 bg-white lg:flex print:hidden">
        <div className="flex items-center gap-3 border-b border-emerald-100 px-5 py-4">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-lg"
          >
            🧑‍🏫
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900" translate="no">
              {org?.name ?? "Багшийн самбар"}
            </p>
            <p className="text-[10px] text-slate-500">
              {org ? getOrganizationRoleLabel(org.memberRole) : "Бөөндөө Сурцгаая"}
            </p>
          </div>
        </div>
        <nav aria-label="Багшийн цэс" className="flex-1 overflow-y-auto px-3 pb-4">
          {nav()}
        </nav>
        <div className="border-t border-emerald-100 px-4 py-3">
          {email ? (
            <p className="truncate text-xs text-slate-500" title={email}>
              {email}
            </p>
          ) : null}
          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs font-semibold">
            <Link href="/" className="text-emerald-700 hover:underline">
              Сурагчийн апп →
            </Link>
            {email ? (
              <button type="button" onClick={() => void logout()} className="text-slate-500 hover:text-red-600">
                Гарах
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/90 backdrop-blur print:hidden">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            <button
              type="button"
              onClick={() => setOpenFor(menuOpen ? null : pathname)}
              aria-expanded={menuOpen}
              className="shrink-0 rounded-xl px-3 py-2 text-slate-700 ring-1 ring-slate-200 lg:hidden"
            >
              <span aria-hidden>☰</span>
              <span className="sr-only">Цэс нээх</span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 lg:text-base" translate="no">
                {title}
              </p>
              <p className="hidden text-[10px] font-medium uppercase tracking-wider text-emerald-700 sm:block">
                {org ? `${org.name} · багшийн самбар` : "Багшийн самбар"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LocaleToggle />
              <span className="hidden rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white sm:inline">
                {org ? getOrganizationRoleLabel(org.memberRole) : "Багш"}
              </span>
            </div>
          </div>
          {menuOpen ? (
            <nav aria-label="Багшийн цэс" className="max-h-[70vh] overflow-y-auto border-t border-emerald-100 bg-white px-3 pb-4 lg:hidden">
              {nav(() => setOpenFor(null))}
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 px-3 pt-3 text-xs font-semibold">
                <Link href="/" className="text-emerald-700">
                  Сурагчийн апп →
                </Link>
                {email ? (
                  <button type="button" onClick={() => void logout()} className="text-slate-500">
                    Гарах
                  </button>
                ) : null}
              </div>
            </nav>
          ) : null}
        </header>
        <main className="flex-1 overflow-x-hidden px-4 py-5 pb-24 lg:px-8 lg:py-6 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
