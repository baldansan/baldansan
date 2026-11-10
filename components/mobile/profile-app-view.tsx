"use client";

import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
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
import { ProfileStatsRail } from "@/components/profile/profile-stats-rail";
import { MobileCard } from "@/components/mobile/mobile-card";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { formatActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import { hasSupabaseConfig, signOut } from "@/lib/supabase/auth";
import { ProfileSrsStats } from "@/components/profile/profile-srs-stats";
import { countCompletedLessonsAll } from "@/lib/progress";
import { getStreakUnified } from "@/lib/retention/retention-service";
import type { AuthUser } from "@/types/auth";
import { exitKidMode } from "@/lib/kids/client";
import { isKidEmail } from "@/lib/kids/types";
import { useKidMode } from "@/lib/kids/use-kid-mode";
import { ChatProfileSettings } from "@/components/social/chat-profile-settings";
import { ts } from "@/lib/social/i18n";
import { getOwnProfile } from "@/lib/social/profile";

type LoadState = "loading" | "ready" | "error";

const PROFILE_ROUTE = "/profile";

function ProfileAvatar({
  displayName,
  guest,
  emoji,
}: {
  displayName: string;
  guest?: boolean;
  emoji?: string | null;
}) {
  if (emoji) {
    return (
      <div className="bs-tm-avatar">
        <span className="bs-tm-avatar-initial" aria-hidden>
          {emoji}
        </span>
      </div>
    );
  }
  if (guest) {
    return (
      <div className="bs-tm-avatar">
        <TemeeEmojiIcon
          variant="avatar"
          width={88}
          height={88}
          className="bs-tm-avatar-emoji"
          emojiScale={0.44}
        />
      </div>
    );
  }

  const initial = displayName.trim().charAt(0).toUpperCase() || "S";
  return (
    <div className="bs-tm-avatar">
      <span className="bs-tm-avatar-initial" aria-hidden>
        {initial}
      </span>
    </div>
  );
}

/** Нэг мөр = нэг холбоос; профайл дээр бүлэглэж харуулна. */
function LinkRow({
  href,
  icon,
  title,
  sub,
  iconClass = "",
}: {
  href: string;
  icon: string;
  title: string;
  sub?: string;
  iconClass?: string;
}) {
  return (
    <Link href={href} className="bs-tm-card mt-2">
      <span className={`bs-tm-card-ic ${iconClass}`} aria-hidden>
        {icon}
      </span>
      <span className="flex-1">
        <span className="bs-tm-card-title">{title}</span>
        {sub ? <span className="block text-xs text-[var(--app-muted)]">{sub}</span> : null}
      </span>
      <span className="bs-tm-card-chev" aria-hidden>›</span>
    </Link>
  );
}

export function ProfileAppView() {
  const locale = useUiLocale();
  const router = useRouter();
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const { kid: kidMode } = useKidMode();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakFreeze, setStreakFreeze] = useState<{
    usedThisMonth: number;
    total: number;
  } | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [ownProfile, setOwnProfile] = useState<{ name: string | null; avatar: string | null }>({
    name: null,
    avatar: null,
  });
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
          setStreakFreeze(retention?.streakFreeze ?? null);
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
          setStreakFreeze(retention?.streakFreeze ?? null);
        } catch {
          setStreak(0);
        }
        setLoadState("ready");
        authDevLog("profile: no session, showing guest profile");
        return;
      }

      void withTimeout(getOwnProfile(auth.user.id), 5000, "profileOwn")
        .then((res) =>
          setOwnProfile({
            name: res.data?.display_name?.trim() || null,
            avatar: res.data?.avatar ?? null,
          })
        )
        .catch(() => undefined);

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
          setStreakFreeze(retention?.streakFreeze ?? null);
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
    const t = setTimeout(() => void loadProfile(), 0);
    return () => clearTimeout(t);
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
          {tr(locale, "Ачааллаж байна…")}
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
          title={tr(locale, "Профайл ачаалахад алдаа гарлаа")}
          description={tr(locale, "Auth эсвэл профайл мэдээлэл татахад алдаа гарлаа.")}
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
      ? `${formatActiveHskLevel(activeLevel)} ${tr(locale, "суралцагч")}`
      : tr(locale, "Суралцагч");

    return (
      <MobileAppShell
        activeTab="profile"
        desktopWidth="wide"
        rightRail={<ProfileStatsRail />}
        >
        <div className="bs-tm-phead">
          <ProfileAvatar displayName={tr(locale, "Зочин")} guest />
          <h1 className="bs-tm-pname">{tr(locale, "Зочин хэрэглэгч")}</h1>
          <p className="bs-tm-prank">{guestLevelLabel}</p>
          {streak > 0 ? (
            <span className="bs-tm-plvlbadge">🔥 {streak} {tr(locale, "өдөр дараалан")}</span>
          ) : null}
          {streakFreeze ? (
            <span className="bs-tm-plvlbadge">
              {tr(locale, "🧊 Хамгаалалт:")} {streakFreeze.total - streakFreeze.usedThisMonth}/
              {streakFreeze.total}
            </span>
          ) : null}
        </div>

        {!hasSupabaseConfig ? (
          <MobileCard className="mb-4 border border-amber-200 bg-amber-50 !p-3 text-xs text-amber-900">
            {tr(locale, "Supabase тохиргоо дутуу. Ахицаа зөвхөн энэ төхөөрөмж дээр хадгална.")}
          </MobileCard>
        ) : null}

        <ProfileSrsStats
          userId={null}
          streak={streak}
          completedLessons={completedLessons}
        />

        <MobileCard padding="sm" className="mb-5 text-center !p-4">
          <p className="text-sm font-bold text-[var(--app-text)]">
            {tr(locale, "Бүх төхөөрөмж дээр хадгалах уу?")}
          </p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {tr(locale, "Нэвтэрвэл SRS, streak, тоглоомын оноо синк хийгдэнэ.")}
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center app-btn-primary px-6 py-3"
          >
            {tr(locale, "Нэвтрэх")}
          </Link>
          <Link
            href="/signup"
            className="mt-3 block text-sm font-semibold text-emerald-600"
          >
            {tr(locale, "Бүртгүүлэх")}
          </Link>
        </MobileCard>
      </MobileAppShell>
    );
  }

  // Хүүхдийн бүртгэл: зөвхөн нэр/avatar/streak/статистик + «Эцэг эх рүү буцах»
  // (ангид орох, бүртгэл удирдах, гарах зэргийг эцэг эх хийнэ)
  if (isKidEmail(user.email)) {
    const kidName = kidMode?.displayName || tr(locale, "Хүүхэд");
    return (
      <MobileAppShell activeTab="profile">
        <div className="bs-tm-phead">
          <div className="bs-tm-avatar">
            <span className="bs-tm-avatar-initial" aria-hidden>
              {kidMode?.avatar ?? "🧒"}
            </span>
          </div>
          <h1 className="bs-tm-pname" translate="no">
            {kidName}
          </h1>
          <p className="bs-tm-prank">
            {hydrated
              ? `${formatActiveHskLevel(activeLevel)} ${tr(locale, "суралцагч")}`
              : tr(locale, "Суралцагч")}
          </p>
          {streak > 0 ? (
            <span className="bs-tm-plvlbadge">🔥 {streak} {tr(locale, "өдөр дараалан")}</span>
          ) : null}
        </div>

        <ProfileSrsStats
          userId={user.id}
          streak={streak}
          completedLessons={completedLessons}
        />

        <button
          type="button"
          onClick={() => void exitKidMode("/family")}
          className="bs-tm-card mt-2 w-full text-left"
        >
          <span className="bs-tm-card-ic" aria-hidden>
            👨‍👩‍👧
          </span>
          <span className="flex-1">
            <span className="bs-tm-card-title">{tr(locale, "Эцэг эх рүү буцах")}</span>
            <span className="block text-xs text-[var(--app-muted)]">
              {tr(locale, "Эцэг эх имэйлээрээ дахин нэвтэрнэ")}
            </span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </button>
      </MobileAppShell>
    );
  }

  const emailName = user.email?.split("@")[0] ?? tr(locale, "Хэрэглэгч");
  const displayName = ownProfile.name ?? emailName;
  const freezeLeft = streakFreeze ? streakFreeze.total - streakFreeze.usedThisMonth : 0;

  return (
    <MobileAppShell
      activeTab="profile"
      desktopWidth="wide"
      rightRail={<ProfileStatsRail />}
      >
      <div className="bs-tm-phead">
        <ProfileAvatar displayName={displayName} emoji={ownProfile.avatar} />
        <h1 className="bs-tm-pname" translate="no">{displayName}</h1>
        <p className="bs-tm-prank">
          {hydrated
            ? `${formatActiveHskLevel(activeLevel)} ${tr(locale, "суралцагч")}`
            : tr(locale, "Суралцагч")}
          {user.email ? <span className="block text-xs opacity-70">{user.email}</span> : null}
        </p>
        {streak > 0 ? (
          <span className="bs-tm-plvlbadge">🔥 {streak} {tr(locale, "өдөр дараалан")}</span>
        ) : null}
        {streakFreeze && freezeLeft > 0 ? (
          <span className="bs-tm-plvlbadge" title={tr(locale, "Нэг өдөр алгасвал streak тасрахгүй")}>
            🧊 {tr(locale, "Streak хамгаалалт")} {freezeLeft}/{streakFreeze.total}
          </span>
        ) : null}
      </div>

      {profileError ? (
        <MobileCard className="mb-4 border border-amber-200 bg-amber-50 !p-3 text-xs text-amber-900">
          {tr(locale, "Зарим профайл мэдээлэл ачаалж чадсангүй:")} {profileError}
        </MobileCard>
      ) : null}

      <ProfileSrsStats
        userId={user.id}
        streak={streak}
        completedLessons={completedLessons}
      />

      <p className="bs-tm-sec">{tr(locale, "📚 Миний суралцалт")}</p>
      <LinkRow href="/progress" icon="📈" title={tr(locale, "Ахиц")} sub={tr(locale, "Хичээл, үг, шалгалтын явц")} iconClass="bs-tm-card-ic--green" />
      <LinkRow href="/points" icon="⭐" title={tr(locale, "Оноо, зэрэглэл")} sub={tr(locale, "Миний оноо, бусадтай харьцуулах")} />
      <LinkRow href="/weekly-report" icon="🗓" title={tr(locale, "Долоо хоногийн тайлан")} sub={tr(locale, "Энэ долоо хоногт хэр суралцсан бэ")} />
      <LinkRow href="/reminders" icon="⏰" title={tr(locale, "Сурах сануулга")} sub={tr(locale, "Өдөр бүр ямар цагт сануулах")} />

      <p className="bs-tm-sec mt-5">{tr(locale, "👥 Бусадтай хамт")}</p>
      <LinkRow href="/chat" icon="💬" title={`${ts(locale, "Чат")} · 聊天`} sub={ts(locale, "Хятадаар ярилцъя")} />
      <LinkRow href="/join" icon="🏫" title={tr(locale, "Ангид орох")} sub={tr(locale, "Багшийн өгсөн 6 оронтой кодоор")} />
      <LinkRow href="/family" icon="👨‍👩‍👧" title={tr(locale, "Хүүхдийн бүртгэл")} sub={tr(locale, "Хүүхдэдээ тусдаа бүртгэл нээх (PIN-тэй)")} />

      <p className="bs-tm-sec mt-5">{tr(locale, "⚙️ Бүртгэл")}</p>
      <details className="bs-tm-card mt-2 block">
        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <span className="bs-tm-card-ic" aria-hidden>✏️</span>
          <span className="flex-1">
            <span className="bs-tm-card-title">{tr(locale, "Нэр, зураг засах")}</span>
            <span className="block text-xs text-[var(--app-muted)]">{tr(locale, "Чат болон зэрэглэлд харагдах нэр")}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>▾</span>
        </summary>
        <div className="mt-4 border-t border-[var(--app-border)] pt-4">
          <ChatProfileSettings userId={user.id} defaultName={emailName} />
        </div>
      </details>
      <LinkRow href="/notifications" icon="🔔" title={tr(locale, "Мэдэгдэл")} />
      <LinkRow href="/settings" icon="⚙️" title={tr(locale, "Тохиргоо")} sub={tr(locale, "Хэл, түвшин, дуу, бусад")} />
      {isAdmin ? (
        <LinkRow href="/admin" icon="🛠" title={tr(locale, "Админ самбар")} iconClass="bs-tm-card-ic--purple" />
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
            {tr(locale, signingOut ? "Гарч байна…" : "Гарах")}
          </span>
        </span>
      </button>
    </MobileAppShell>
  );
}
