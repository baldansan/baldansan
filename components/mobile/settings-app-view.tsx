"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DeleteAccountCard } from "@/components/account/delete-account-card";
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
    <MobileAppShell activeTab="profile" >
      <Link
        href="/profile"
        className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
      >
        ← Профайл руу буцах
      </Link>

      <MobilePageHeader title="Тохиргоо" subtitle="Бүртгэл болон app-ийн тохиргоо" />

      {!language ? (
        <MobileCard className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900">
            Сурах хэл сонгоогүй байна
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Доорх сонголтоос сурах хэлээ сонгоно уу.
          </p>
          <Link href="/onboarding" className="app-btn-secondary mt-3 inline-flex !min-h-0 !py-2 !text-xs">
            Эхлэх заавар
          </Link>
        </MobileCard>
      ) : null}

      <MobileCard padding="lg" className="mb-4">
        <h2 className="text-sm font-bold text-[var(--app-text)]">Бүртгэл</h2>
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

      {email ? <div className="mt-4"><DeleteAccountCard /></div> : null}

      <p className="mt-4 text-center text-xs text-[var(--app-muted)]">
        <Link href="/privacy" className="font-semibold text-emerald-600">
          Нууцлалын бодлого
        </Link>
      </p>

      {!onboardingDone ? (
        <p className="mt-4 text-center text-xs text-[var(--app-muted)]">
          <Link href="/onboarding" className="font-semibold text-emerald-600">
            App-ийн заавар
          </Link>
        </p>
      ) : null}
    </MobileAppShell>
  );
}
