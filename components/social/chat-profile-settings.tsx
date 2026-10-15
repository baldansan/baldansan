"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { ts } from "@/lib/social/i18n";
import { getOwnProfile, saveOwnProfile } from "@/lib/social/profile";
import { AGE_BANDS, type AgeBand } from "@/lib/social/types";
import { SocialAvatar } from "./avatar";

const AVATAR_CHOICES = ["🐼", "🦊", "🐯", "🐰", "🐸", "🦄", "🐧", "🐶", "🌟", "📚", "🎧", "🍜"];

/** Профайл хуудсан дахь «Чат ба нийтийн профайл» хэсэг (хүүхэд биш, нэвтэрсэн хэрэглэгчид). */
export function ChatProfileSettings({
  userId,
  defaultName,
}: {
  userId: string;
  defaultName: string;
}) {
  const locale = useUiLocale();
  const t = (s: string) => ts(locale, s);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [instagram, setInstagram] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [bio, setBio] = useState("");
  const [banned, setBanned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    void getOwnProfile(userId).then((res) => {
      if (!alive) return;
      const p = res.data;
      setName(p?.display_name || defaultName);
      setAvatar(p?.avatar ?? null);
      setAgeBand(p?.age_band ?? null);
      setInstagram(p?.instagram ?? "");
      setIsPublic(p?.is_public ?? false);
      setBio(p?.bio ?? "");
      setBanned(p?.chat_banned ?? false);
      if (res.error) setMessage({ ok: false, text: res.error });
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [userId, defaultName]);

  async function save() {
    setBusy(true);
    setMessage(null);
    const res = await saveOwnProfile(userId, {
      display_name: name,
      avatar,
      instagram,
      is_public: isPublic,
      age_band: ageBand,
      bio,
    });
    setBusy(false);
    setMessage(
      res.error
        ? { ok: false, text: res.error }
        : { ok: true, text: t("Профайл хадгалагдлаа") }
    );
  }

  if (!loaded) return null;

  return (
    <section id="chat-profile" className="app-card mb-5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--app-text)]">{t("Чат ба нийтийн профайл")}</h2>
        <Link href="/chat" className="text-xs font-semibold text-emerald-700">
          💬 {t("Чат руу орох")}
        </Link>
      </div>

      {banned ? (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{t("Түгжигдсэн")}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <SocialAvatar name={name} avatar={avatar} size={48} />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={t("Нэр")}
            className="min-h-[44px] flex-1 rounded-xl border border-[var(--app-border)] px-3 text-sm"
          />
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-[var(--app-muted)]">{t("Тэмдэг")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAvatar(null)}
              className={`app-chip ${avatar === null ? "app-chip-active" : ""}`}
            >
              Aa
            </button>
            {AVATAR_CHOICES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`app-chip ${avatar === a ? "app-chip-active" : ""}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-[var(--app-muted)]">{t("Нас")}</p>
          <div className="flex flex-wrap gap-2">
            {AGE_BANDS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setAgeBand(b)}
                className={`app-chip ${ageBand === b ? "app-chip-active" : ""}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <input
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          maxLength={60}
          placeholder="Instagram @"
          autoCapitalize="none"
          className="min-h-[44px] rounded-xl border border-[var(--app-border)] px-3 text-sm"
        />

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder={t("Танилцуулга")}
          className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm"
        />

        <label className="flex items-center justify-between gap-3 text-sm font-semibold text-[var(--app-text)]">
          {t("Профайлыг нийтэд харуулах")}
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-5 w-5 accent-emerald-600"
          />
        </label>

        {message ? (
          <p className={`text-xs ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>
        ) : null}

        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => void save()}
          className="app-btn-primary w-full disabled:opacity-50"
        >
          {t("Хадгалах")}
        </button>
      </div>
    </section>
  );
}
