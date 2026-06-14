"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthLoadErrorCard } from "@/components/auth/auth-load-error-card";
import { buildFallbackAuthCheckResult } from "@/lib/auth/auth-check-utils";
import {
  runClientAuthCheck,
  type ClientAuthCheckResult,
} from "@/lib/auth/client-auth-check";
import { authDevLog } from "@/lib/auth/auth-dev-log";
import { useLoadingWatchdog } from "@/lib/hooks/use-loading-watchdog";
import { withTimeout } from "@/lib/async/with-timeout";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { TEMEE_ASSETS } from "@/lib/temee/assets";
import { formatActiveHskLevel } from "@/lib/hsk/active-hsk-level";
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
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [streak, setStreak] = useState(0);
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
        try {
          const retention = await getStreakUnified();
          setStreak(retention?.currentStreak ?? 0);
        } catch {
          setStreak(0);
        }
        setCheckResult(buildFallbackAuthCheckResult(PROFILE_ROUTE, "Supabase тохиргоо дутуу байна"));
        setLoadState("ready");
        return;
      }

      const auth = await runClientAuthCheck({
        includeAdmin: false,
        route: PROFILE_ROUTE,
        timeoutMs: 4000,
      });
      setCheckResult(auth);

      if (auth.timedOut) {
        finishWithError(auth.error ?? "Auth шалгалт хэт удаж байна");
        return;
      }

      if (auth.error && !auth.user) {
        finishWithError(auth.error);
        return;
      }

      setUser(auth.user);

      if (!auth.user) {
        setIsAdmin(false);
        try {
          const retention = await withTimeout(
            getStreakUnified(),
            5000,
            "getStreakUnifiedGuest"
          );
          setStreak(retention?.currentStreak ?? 0);
        } catch {
          setStreak(0);
        }
        setLoadState("ready");
        authDevLog("profile: no session, showing guest profile");
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
    const guestLevelLabel = hydrated
      ? `${formatActiveHskLevel(activeLevel)} суралцагч`
      : "Суралцагч";

    return (
      <MobileAppShell
        activeTab="profile"
        >
        <div className="bs-tm-phead">
          <div className="bs-tm-avatar">
            <Image
              src={TEMEE_ASSETS.avatar}
              alt="Тэмээ багш"
              width={96}
              height={96}
            />
          </div>
          <h1 className="bs-tm-pname">Зочин хэрэглэгч</h1>
          <p className="bs-tm-prank">{guestLevelLabel}</p>
          {streak > 0 ? (
            <span className="bs-tm-plvlbadge">🔥 {streak} өдөр дараалан</span>
          ) : null}
        </div>

        {!hasSupabaseConfig ? (
          <MobileCard className="mb-4 border border-amber-200 bg-amber-50 !p-3 text-xs text-amber-900">
            Supabase тохиргоо дутуу. Ахицаа зөвхөн энэ төхөөрөмж дээр хадгална.
          </MobileCard>
        ) : null}

        <ProfileSrsStats
          userId={null}
          streak={streak}
          completedLessons={completedLessons}
        />

        <MobileCard padding="sm" className="mb-5 text-center !p-4">
          <p className="text-sm font-bold text-[var(--app-text)]">
            Бүх төхөөрөмж дээр хадгалах уу?
          </p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Нэвтэрвэл SRS, streak, тоглоомын оноо синк хийгдэнэ.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center app-btn-primary px-6 py-3"
          >
            Нэвтрэх
          </Link>
          <Link
            href="/signup"
            className="mt-3 block text-sm font-semibold text-emerald-600"
          >
            Бүртгүүлэх
          </Link>
        </MobileCard>
      </MobileAppShell>
    );
  }

  const displayName = user.email?.split("@")[0] ?? "Хэрэглэгч";

  return (
    <MobileAppShell
      activeTab="profile"
      >
      <div className="bs-tm-phead">
        <div className="bs-tm-avatar">
          <Image
            src={TEMEE_ASSETS.avatar}
            alt="Тэмээ багш"
            width={96}
            height={96}
          />
        </div>
        <h1 className="bs-tm-pname">{displayName}</h1>
        <p className="bs-tm-prank">
          {hydrated ? `${formatActiveHskLevel(activeLevel)} суралцагч` : "Суралцагч"}
        </p>
        {streak > 0 ? (
          <span className="bs-tm-plvlbadge">🔥 {streak} өдөр дараалан</span>
        ) : null}
      </div>

      {profileError ? (
        <MobileCard className="mb-4 border border-amber-200 bg-amber-50 !p-3 text-xs text-amber-900">
          Зарим профайл мэдээлэл ачаалж чадсангүй: {profileError}
        </MobileCard>
      ) : null}

      <ProfileSrsStats
        userId={user.id}
        streak={streak}
        completedLessons={completedLessons}
      />

      {isAdmin ? (
        <Link href="/admin" className="bs-tm-card mt-2">
          <span className="bs-tm-card-ic bs-tm-card-ic--purple" aria-hidden>
            ⚙️
          </span>
          <span className="flex-1">
            <span className="bs-tm-card-title">Админ самбар</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>
      ) : null}

      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={signingOut}
        className="bs-tm-card mt-2 w-full text-left text-red-600"
      >
        <span className="bs-tm-card-ic bs-tm-card-ic--red" aria-hidden>
          🚪
        </span>
        <span className="flex-1">
          <span className="bs-tm-card-title">
            {signingOut ? "Гарч байна…" : "Гарах"}
          </span>
        </span>
      </button>
    </MobileAppShell>
  );
}
