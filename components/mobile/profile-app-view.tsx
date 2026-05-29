"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import {
  getCurrentUser,
  hasSupabaseConfig,
  signOut,
} from "@/lib/supabase/auth";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  countCompletedLessonsAll,
  getAccountVocabularyLearnedCount,
  getTotalLearnedWords,
} from "@/lib/progress";
import { getStreakUnified } from "@/lib/retention/retention-service";
import type { AuthUser } from "@/types/auth";

export function ProfileAppView() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [learnedWords, setLearnedWords] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [streak, setStreak] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      let authUser: AuthUser | null = null;
      if (hasSupabaseConfig) {
        const { data } = await getCurrentUser();
        authUser = data;
      }
      setUser(authUser);
      setIsAdmin(authUser ? await isCurrentUserAdmin() : false);
      setLearnedWords(getTotalLearnedWords());
      setCompletedLessons(countCompletedLessonsAll());
      if (authUser?.id) {
        const vocab = await getAccountVocabularyLearnedCount(authUser.id);
        if (vocab != null) {
          setLearnedWords((prev) => Math.max(prev, vocab));
        }
      }
      const retention = await getStreakUnified();
      setStreak(retention?.currentStreak ?? 0);
      setReady(true);
    }
    void load();
  }, []);

  async function handleLogout() {
    setSigningOut(true);
    await signOut();
    setUser(null);
    setSigningOut(false);
    router.push("/home");
    router.refresh();
  }

  if (!ready) {
    return (
      <MobileAppShell activeTab="profile" mainClassName="max-w-[390px] mx-auto w-full">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Ачааллаж байна…
        </p>
      </MobileAppShell>
    );
  }

  if (!user) {
    return (
      <MobileAppShell activeTab="profile" mainClassName="max-w-[390px] mx-auto w-full">
        <div className="py-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-3xl">
            👤
          </div>
          <h1 className="mt-4 text-xl font-bold text-[var(--app-text)]">
            Профайл
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Ахицаа хадгалахын тулд нэвтэрнэ үү.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center app-btn-primary px-6 py-3"
          >
            Нэвтрэх
          </Link>
          <Link
            href="/signup"
            className="mt-3 block text-sm font-semibold text-emerald-600"
          >
            Бүртгүүлэх
          </Link>
        </div>
      </MobileAppShell>
    );
  }

  const displayName = user.email?.split("@")[0] ?? "Хэрэглэгч";

  const menuItems = [
    ...(isAdmin
      ? [{ href: "/admin", label: "Админ самбар", icon: "⚙️" }]
      : []),
    { href: "/my-assignments", label: "Ангид нэгдэх", icon: "🏫" },
    { href: "/progress", label: "Миний явц", icon: "📊" },
    { href: "/review", label: "Үзсэн үг", icon: "📖" },
    { href: "/settings", label: "Тохиргоо", icon: "🔧" },
  ];

  return (
    <MobileAppShell activeTab="profile" mainClassName="max-w-[390px] mx-auto w-full">
      <section className="mb-5 text-center">
        <div className="relative mx-auto w-fit">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs text-white ring-2 ring-white">
            ✓
          </span>
        </div>
        <h1 className="mt-3 text-lg font-bold text-[var(--app-text)]">
          {displayName}
        </h1>
        <p className="truncate text-sm text-[var(--app-muted)]">{user.email}</p>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-2">
        {[
          { label: "Нийт XP", value: completedLessons * 100, accent: "text-[var(--app-purple-dark)]" },
          { label: "Сурсан үг", value: learnedWords, accent: "text-[var(--app-primary-dark)]" },
          { label: "Эзэмшсэн", value: completedLessons, accent: "text-[var(--app-orange-dark)]" },
          { label: "Сэргэлт", value: streak, accent: "text-[var(--app-blue)]" },
        ].map((stat) => (
          <MobileCard key={stat.label} padding="sm" className="text-center !p-3">
            <p className={`text-lg font-bold ${stat.accent}`}>{stat.value}</p>
            <p className="text-[10px] text-[var(--app-muted)]">{stat.label}</p>
          </MobileCard>
        ))}
      </div>

      <MobileCard padding="sm" className="overflow-hidden !p-0">
        {menuItems.map((item) => (
          <Link key={item.label} href={item.href} className="app-menu-row">
            <span aria-hidden>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            <span className="text-[var(--app-muted)]">›</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={signingOut}
          className="app-menu-row w-full text-red-600"
        >
          <span aria-hidden>🚪</span>
          <span className="flex-1 text-left">
            {signingOut ? "Гарч байна…" : "Гарах"}
          </span>
        </button>
      </MobileCard>
    </MobileAppShell>
  );
}
