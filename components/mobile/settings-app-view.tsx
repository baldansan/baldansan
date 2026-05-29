"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import {
  getOnboardingCompleted,
  getSelectedLanguage,
  setLearnerLanguagePreference,
  type SelectedLanguage,
} from "@/lib/learner-onboarding";
import {
  LANGUAGE_SELECTION_OPTIONS,
  languageTrackLabel,
} from "@/lib/language-track";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";

export function SettingsAppView() {
  const [email, setEmail] = useState<string | null>(null);
  const [language, setLanguage] = useState<SelectedLanguage | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState<"system" | "light">("system");

  useEffect(() => {
    async function load() {
      if (hasSupabaseConfig) {
        const { data } = await getCurrentUser();
        setEmail(data?.email ?? null);
      }
      setLanguage(getSelectedLanguage());
      setOnboardingDone(getOnboardingCompleted());
    }
    void load();
  }, []);

  function handleLanguageChange(next: SelectedLanguage, courseId: string) {
    setLanguage(next);
    setLearnerLanguagePreference(next, courseId);
    setOnboardingDone(true);
  }

  return (
    <MobileAppShell activeTab="profile" mainClassName="max-w-[390px] mx-auto w-full">
      <Link
        href="/profile"
        className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
      >
        ← Профайл руу буцах
      </Link>

      <MobilePageHeader title="Тохиргоо" subtitle="Account болон app тохиргоо" />

      {!language ? (
        <MobileCard className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900">
            Сурах хэл сонгоогүй байна
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Доорх сонголтоос хэлээ сонгоно уу. Profile/Settings руу буцаахад
            onboarding руу шилжихгүй.
          </p>
          <Link href="/onboarding" className="app-btn-secondary mt-3 inline-flex !min-h-0 !py-2 !text-xs">
            Onboarding заавар
          </Link>
        </MobileCard>
      ) : null}

      <MobileCard padding="lg" className="mb-4">
        <h2 className="text-sm font-bold text-[var(--app-text)]">Account</h2>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {email ?? "Зочин — нэвтрээгүй"}
        </p>
        {!email ? (
          <Link href="/login" className="app-btn-primary mt-3 inline-flex">
            Нэвтрэх
          </Link>
        ) : null}
      </MobileCard>

      <MobileCard padding="lg" className="mb-4">
        <h2 className="text-sm font-bold text-[var(--app-text)]">Сурах хэл</h2>
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          Зөвхөн сонгосон хэлний хичээлүүд харагдана.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {LANGUAGE_SELECTION_OPTIONS.map((option) => (
            <label
              key={option.lang}
              className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-3 py-2.5 text-sm ${
                language === option.lang
                  ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-900"
                  : "border-[var(--app-border)] bg-white text-[var(--app-text)]"
              }`}
            >
              <input
                type="radio"
                name="learner-language"
                className="accent-emerald-600"
                checked={language === option.lang}
                onChange={() => handleLanguageChange(option.lang, option.courseId)}
              />
              <span aria-hidden>{option.emoji}</span>
              {option.label}
            </label>
          ))}
        </div>
        {language ? (
          <p className="mt-3 text-xs text-[var(--app-muted)]">
            Идэвхтэй: {languageTrackLabel(language)}
          </p>
        ) : null}
      </MobileCard>

      <MobileCard padding="lg" className="mb-4">
        <h2 className="text-sm font-bold text-[var(--app-text)]">Мэдэгдэл</h2>
        <label className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-[var(--app-muted)]">Push мэдэгдэл (placeholder)</span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-emerald-600"
            checked={notificationsEnabled}
            onChange={(event) => setNotificationsEnabled(event.target.checked)}
          />
        </label>
        <p className="mt-2 text-xs text-[var(--app-muted)]">
          Бодит push идэвхжүүлэлт дараагийн sprint-д нэмэгдэнэ.
        </p>
      </MobileCard>

      <MobileCard padding="lg">
        <h2 className="text-sm font-bold text-[var(--app-text)]">Theme</h2>
        <div className="mt-3 flex gap-2">
          {(["system", "light"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                theme === value
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
              onClick={() => setTheme(value)}
            >
              {value === "system" ? "System" : "Light"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--app-muted)]">
          Dark mode placeholder — одоогоор light app shell ашиглана.
        </p>
      </MobileCard>

      {!onboardingDone ? (
        <p className="mt-4 text-center text-xs text-[var(--app-muted)]">
          <Link href="/onboarding" className="font-semibold text-emerald-600">
            App заавар (/onboarding)
          </Link>
        </p>
      ) : null}
    </MobileAppShell>
  );
}
