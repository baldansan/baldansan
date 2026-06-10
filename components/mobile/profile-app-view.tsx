"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthLoadErrorCard } from "@/components/auth/auth-load-error-card";
import { buildFallbackAuthCheckResult } from "@/lib/auth/auth-check-utils";
import {
  runClientAuthCheck,
  type ClientAuthCheckResult,
} from "@/lib/auth/client-auth-check";
import { authDevLog } from "@/lib/auth/auth-dev-log";
import { features } from "@/lib/features";
import { useLoadingWatchdog } from "@/lib/hooks/use-loading-watchdog";
import { withTimeout } from "@/lib/async/with-timeout";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import { hasSupabaseConfig, signOut } from "@/lib/supabase/auth";
import { ProfileSrsStats } from "@/components/profile/profile-srs-stats";
import { countCompletedLessonsAll } from "@/lib/progress";
import { getStreakUnified } from "@/lib/retention/retention-service";
import type { AuthUser } from "@/types/auth";

type LoadState = "loading" | "ready" | "error";

const PROFILE_ROUTE = "/profile";

export function ProfileAppView() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dayNumber, setDayNumber] = useState(1);
  const [signingOut, setSigningOut] = useState(false);
  const [checkResult, setCheckResult] = useState<ClientAuthCheckResult | null>(
    null
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const finishWithError = useCallback((message: string) => {
    setProfileError(message);
    setCheckResult((current) =>
      current ?? buildFallbackAuthCheckResult(PROFILE_ROUTE, message)
    );
    setLoadState("error");
  }, []);

  const loadProfile = useCallback(async () => {
    setLoadState("loading");
    setProfileError(null);

    authDevLog("profile load started");

    try {
      setCompletedLessons(countCompletedLessonsAll());

      if (!hasSupabaseConfig) {
        authDevLog("profile: supabase not configured, showing guest state");
        setUser(null);
        setIsAdmin(false);
        setStreak(0);
        setCheckResult(buildFallbackAuthCheckResult(PROFILE_ROUTE, "Supabase тохиргоо дутуу байна"));
        setLoadState("ready");
        return;
      }

      const auth = await runClientAuthCheck({
        includeAdmin: false,
        route: PROFILE_ROUTE,
      });
      setCheckResult(auth);

      if (auth.timedOut || (auth.error && !auth.user)) {
        finishWithError(auth.error ?? "Auth шалгалт хэт удаж байна");
        return;
      }

      setUser(auth.user);

      if (!auth.user) {
        setIsAdmin(false);
        setStreak(0);
        setLoadState("ready");
        authDevLog("profile: no session, showing login state");
        return;
      }

      void withTimeout(isCurrentUserAdmin(), 5000, "profileAdminCheck")
        .then((admin) => {
          setIsAdmin(admin);
          authDevLog("profile admin check result", { isAdmin: admin });
        })
        .catch(() => setIsAdmin(false));

      try {
        const retention = await withTimeout(
          getStreakUnified(),
          5000,
          "getStreakUnified"
        );
        setStreak(retention?.currentStreak ?? 0);
        setDayNumber(Math.max(1, retention?.currentStreak ?? 1));
      } catch (error) {
        setStreak(0);
        const message =
          error instanceof Error ? error.message : "Profile data fetch failed";
        setProfileError(message);
        authDevLog("profile data error", message);
      }

      authDevLog("profile loaded", {
        hasUser: Boolean(auth.user),
        userEmail: auth.user?.email,
      });
      setLoadState("ready");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Profile load failed";
      authDevLog("profile load error", message);
      finishWithError(message);
    }
  }, [finishWithError]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile, attempt]);

  useLoadingWatchdog({
    active: loadState === "loading",
    onTimeout: useCallback(() => {
      authDevLog("profile watchdog timeout");
      finishWithError("Auth шалгалт хэт удаж байна");
    }, [finishWithError]),
  });

  async function handleLogout() {
    setSigningOut(true);
    await signOut();
    setUser(null);
    setSigningOut(false);
    router.push("/home");
    router.refresh();
  }

  if (loadState === "loading") {
    return (
      <MobileAppShell
        activeTab="profile"
        mainClassName="max-w-[390px] mx-auto w-full"
      >
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Ачааллаж байна…
        </p>
      </MobileAppShell>
    );
  }

  if (loadState === "error") {
    return (
      <MobileAppShell
        activeTab="profile"
        mainClassName="max-w-[390px] mx-auto w-full"
      >
        <AuthLoadErrorCard
          title="Профайл ачаалахад алдаа гарлаа"
          description="Auth эсвэл профайл мэдээлэл татахад алдаа гарлаа."
          result={{
            ...(checkResult ?? buildFallbackAuthCheckResult(PROFILE_ROUTE, profileError ?? "Unknown error")),
            error: profileError ?? checkResult?.error ?? "Unknown error",
          }}
          route={PROFILE_ROUTE}
          onRetry={() => setAttempt((value) => value + 1)}
        />
      </MobileAppShell>
    );
  }

  if (!user) {
    return (
      <MobileAppShell
        activeTab="profile"
        mainClassName="max-w-[390px] mx-auto w-full"
      >
        {!hasSupabaseConfig ? (
          <MobileCard className="mb-4 border border-amber-200 bg-amber-50 !p-3 text-xs text-amber-900">
            Supabase тохиргоо дутуу байна. Local progress only until .env.local is configured.
          </MobileCard>
        ) : null}
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
    ...(features.b2b
      ? [{ href: "/my-assignments", label: "Ангид нэгдэх", icon: "🏫" }]
      : []),
    { href: "/progress", label: "Миний явц", icon: "📊" },
    { href: "/review", label: "Үзсэн үг", icon: "📖" },
    { href: "/settings", label: "Тохиргоо", icon: "🔧" },
  ];

  return (
    <MobileAppShell
      activeTab="profile"
      mainClassName="max-w-[390px] mx-auto w-full"
    >
      {profileError ? (
        <MobileCard className="mb-4 border border-amber-200 bg-amber-50 !p-3 text-xs text-amber-900">
          Зарим профайл мэдээлэл ачаалж чадсангүй: {profileError}
        </MobileCard>
      ) : null}

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

      <ProfileSrsStats
        userId={user.id}
        streak={streak}
        dayNumber={dayNumber}
      />

      <MobileCard padding="sm" className="mb-5 text-center !p-3">
        <p className="text-lg font-bold text-[var(--app-primary-dark)]">
          {completedLessons}
        </p>
        <p className="text-[10px] text-[var(--app-muted)]">Дууссан хичээл</p>
      </MobileCard>

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
