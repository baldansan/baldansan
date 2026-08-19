"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { PwaInstallCard } from "@/components/pwa-install-card";
import {
  getSelectedLanguage,
  setLearnerLanguagePreference,
  type SelectedLanguage,
} from "@/lib/learner-onboarding";
import { LANGUAGE_SELECTION_OPTIONS } from "@/lib/language-track";

const guideSteps = [
  {
    title: "Хэл сонго",
    body: "Сурах хэлээ сонгоно. Сонгосон хэлний хичээлүүд харагдана.",
  },
  {
    title: "Хичээл үзэх",
    body: "Богино бичлэг, хадмал, romanization, Монгол орчуулгатай үзнэ.",
  },
  {
    title: "Үгийн сан сур",
    body: "Хичээлийн үгсийг жишээ өгүүлбэртэй сурна.",
  },
  {
    title: "Quiz өг",
    body: "Сурсан зүйлээ quiz-ээр шалгаж, оноо хадгална.",
  },
  {
    title: "Давталт хий",
    body: "Давталт хэсэгт сурсан үгээ давтан бататгана.",
  },
  {
    title: "Ахиц account дээр хадгал",
    body: "Нэвтэрсэн хэрэглэгчийн ахиц account дээр хадгалагдана. Guest — төхөөрөмж дээр.",
  },
];

export function OnboardingAppView() {
  const locale = useUiLocale();
  const router = useRouter();
  const [phase, setPhase] = useState<"pick" | "guide">("pick");
  const [existingLang, setExistingLang] = useState<SelectedLanguage | null>(null);

  useEffect(() => {
    const lang = getSelectedLanguage();
    setExistingLang(lang);
    if (lang) {
      setPhase("guide");
    }
  }, []);

  function handleLanguageSelect(lang: SelectedLanguage, courseId: string) {
    setLearnerLanguagePreference(lang, courseId);
    setExistingLang(lang);
    setPhase("guide");
  }

  function handleContinueHome() {
    router.push("/home");
    router.refresh();
  }

  return (
    <MobileAppShell activeTab="profile" showBottomNav={phase === "guide"}>
      <section className="mb-5">
        <h1 className="text-xl font-bold text-[var(--app-text)]">
          {tr(locale, phase === "pick" ? "Ямар хэл сурах вэ?" : "App хэрхэн ажилладаг вэ?")}
        </h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {tr(
            locale,
            phase === "pick"
              ? "Сонгосон хэлний хичээлүүд л харагдана. Дараа нь Settings-оос солих боломжтой."
              : "Шинэ хэрэглэгчид зориулсан богино заавар."
          )}
        </p>
      </section>

      {phase === "pick" ? (
        <div className="mb-6 flex flex-col gap-3">
          {LANGUAGE_SELECTION_OPTIONS.map((option) => (
            <button
              key={option.lang}
              type="button"
              className="app-menu-row w-full text-left"
              onClick={() => handleLanguageSelect(option.lang, option.courseId)}
            >
              <span aria-hidden className="text-2xl">
                {option.emoji}
              </span>
              <span className="flex-1 text-base font-semibold">{tr(locale, option.label)}</span>
              <span className="text-[var(--app-muted)]">›</span>
            </button>
          ))}
          {existingLang ? (
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-emerald-600"
              onClick={() => setPhase("guide")}
            >
              {tr(locale, "Заавар үзэх →")}
            </button>
          ) : null}
        </div>
      ) : (
        <>
          {existingLang ? (
            <MobileCard className="mb-4 border-emerald-200 bg-emerald-50">
              <p className="text-sm font-semibold text-emerald-900">
                {tr(locale, "Сонгосон хэл:")}{" "}
                {tr(
                  locale,
                  LANGUAGE_SELECTION_OPTIONS.find((o) => o.lang === existingLang)
                    ?.label ?? ""
                )}
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-emerald-700 underline"
                onClick={() => setPhase("pick")}
              >
                {tr(locale, "Хэл солих")}
              </button>
            </MobileCard>
          ) : null}

          <div className="mb-4">
            <PwaInstallCard />
          </div>

          <ol className="mb-6 flex flex-col gap-3">
            {guideSteps.map((step, index) => (
              <MobileCard key={step.title} padding="lg">
                <span className="text-xs font-semibold text-emerald-600">
                  {tr(locale, "Алхам")} {index + 1}
                </span>
                <h2 className="mt-1 text-base font-semibold text-[var(--app-text)]">
                  {tr(locale, step.title)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                  {tr(locale, step.body)}
                </p>
              </MobileCard>
            ))}
          </ol>

          <div className="flex flex-col gap-2">
            <button type="button" className="app-btn-primary" onClick={handleContinueHome}>
              {tr(locale, "Нүүр хуудас руу")}
            </button>
            <Link href="/login" className="app-btn-secondary text-center">
              {tr(locale, "Нэвтрэх")}
            </Link>
            <Link href="/help" className="text-center text-sm font-semibold text-emerald-600">
              {tr(locale, "Тусламж")}
            </Link>
          </div>
        </>
      )}
    </MobileAppShell>
  );
}
