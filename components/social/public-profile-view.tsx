"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { ts } from "@/lib/social/i18n";
import { blockUser, listBlockedIds, unblockUser } from "@/lib/social/messages";
import { getPointsTotal, getPublicProfile, instagramUrl } from "@/lib/social/profile";
import { openDirectMessage } from "@/lib/social/rooms";
import type { PublicProfile } from "@/lib/social/types";
import { SocialAvatar } from "./avatar";
import { ChatGate } from "./chat-gate";

export function PublicProfileView({ targetUserId }: { targetUserId: string }) {
  return (
    <ChatGate>
      {(userId) => <Inner userId={userId} targetUserId={targetUserId} />}
    </ChatGate>
  );
}

function Inner({ userId, targetUserId }: { userId: string; targetUserId: string }) {
  const locale = useUiLocale();
  const t = (s: string) => ts(locale, s);
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const self = userId === targetUserId;

  useEffect(() => {
    let alive = true;
    async function run() {
      const [p, b] = await Promise.all([getPublicProfile(targetUserId), listBlockedIds()]);
      if (!alive) return;
      setProfile(p.data);
      if (p.error) setError(p.error);
      setIsBlocked((b.data ?? []).includes(targetUserId));
      if (p.data?.is_public) {
        const pts = await getPointsTotal(targetUserId);
        if (alive) setPoints(pts);
      }
      setLoaded(true);
    }
    void run();
    return () => {
      alive = false;
    };
  }, [targetUserId]);

  async function handleMessage() {
    setBusy(true);
    setError(null);
    const res = await openDirectMessage(targetUserId);
    setBusy(false);
    if (res.error || !res.data) {
      setError(res.error);
      return;
    }
    router.push(`/chat/${res.data}`);
  }

  async function handleBlockToggle() {
    setBusy(true);
    const res = isBlocked
      ? await unblockUser(userId, targetUserId)
      : await blockUser(userId, targetUserId);
    setBusy(false);
    if (res.error) setError(res.error);
    else setIsBlocked(!isBlocked);
  }

  return (
    <MobileAppShell activeTab="profile">
      {!loaded ? (
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">{t("Ачааллаж байна…")}</p>
      ) : !profile ? (
        <p className="app-card p-5 text-center text-sm text-[var(--app-muted)]">
          {t("Профайл олдсонгүй")}
        </p>
      ) : (
        <div className="app-card flex flex-col items-center gap-2 p-6 text-center">
          <SocialAvatar name={profile.display_name} avatar={profile.avatar} size={84} />
          <h1 className="text-xl font-extrabold text-[var(--app-text)]" translate="no">
            {profile.display_name || "—"}
          </h1>

          {profile.is_public ? (
            <>
              {profile.level_label ? (
                <span className="rounded-full bg-[var(--app-primary-light)] px-3 py-1 text-xs font-bold text-[var(--app-primary-dark)]">
                  {profile.level_label}
                </span>
              ) : null}
              {points !== null ? (
                <p className="text-sm text-[var(--app-muted)]">
                  {t("Оноо")}: <b className="text-[var(--app-text)]">{points}</b>
                </p>
              ) : null}
              {profile.age_band ? (
                <p className="text-xs text-[var(--app-muted)]">
                  {t("Нас")}: {profile.age_band}
                </p>
              ) : null}
              {profile.bio ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--app-text)]">{profile.bio}</p>
              ) : null}
              {profile.instagram ? (
                <a
                  href={instagramUrl(profile.instagram)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-1 text-sm font-semibold text-emerald-700"
                >
                  📷 @{profile.instagram}
                </a>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-[var(--app-muted)]">{t("Энэ профайл нийтэд харагдахгүй")}</p>
          )}

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          {!self ? (
            <div className="mt-3 flex w-full flex-col gap-2">
              <button
                type="button"
                disabled={busy || isBlocked || profile.chat_banned}
                onClick={() => void handleMessage()}
                className="app-btn-primary w-full disabled:opacity-50"
              >
                💬 {t("Мессеж бичих")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleBlockToggle()}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-red-200 bg-red-50 text-sm font-semibold text-red-700"
              >
                {isBlocked ? t("Хориг арилгах") : `🚫 ${t("Хориглох")}`}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </MobileAppShell>
  );
}
