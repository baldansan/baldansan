"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { APP_NAV_ITEMS, type AppNavTab } from "@/lib/app-navigation";
import { tr } from "@/lib/i18n/translate";
import { switchUiLocale, useUiLocale } from "@/lib/i18n/ui-locale";
import { getSelectedLanguage } from "@/lib/learner-onboarding";

type Props = {
  active: AppNavTab;
};

/**
 * PC / laptop (≥920px) дээд цэс. Доод nav-ын 5 товч + хайлт + HSK түвшин + хэл.
 * CSS: components/app/desktop-shell.css (утсан дээр display:none).
 */
export function DesktopTopNav({ active }: Props) {
  const locale = useUiLocale();
  const pathname = usePathname() ?? "";
  const [showChinese, setShowChinese] = useState(false);
  useEffect(() => {
    setShowChinese(getSelectedLanguage() !== "ko");
  }, [pathname]);

  return (
    <header className="bs-desknav" aria-label="Үндсэн цэс">
      <Link href="/home" className="bs-desknav-brand">
        <span className="bs-desknav-logo" aria-hidden>
          学
        </span>
        <span className="bs-desknav-title">Бөөндөө Сурцгаая</span>
      </Link>

      <nav className="bs-desknav-tabs" aria-label="App navigation">
        {APP_NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`bs-desknav-tab${active === item.key ? " bs-on" : ""}`}
            aria-current={active === item.key ? "page" : undefined}
          >
            {item.icon}
            {tr(locale, item.label)}
          </Link>
        ))}
      </nav>

      <div className="bs-desknav-spacer" />

      {showChinese ? (
        <form action="/dictionary" method="get" className="bs-desknav-search" role="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            name="q"
            placeholder={tr(locale, "Ханз, пиньинь, монголоор хайх…")}
            aria-label={tr(locale, "Толь бичигт хайх")}
            autoComplete="off"
          />
        </form>
      ) : null}

      {showChinese ? <HskLevelSelector placement="header" /> : null}

      <div className="bs-desknav-seg" role="group" aria-label="UI хэл">
        <button
          type="button"
          className={locale === "mn" ? "bs-on" : ""}
          onClick={() => {
            if (locale !== "mn") switchUiLocale("mn");
          }}
        >
          MN
        </button>
        <button
          type="button"
          className={locale === "zh" ? "bs-on" : ""}
          onClick={() => {
            if (locale !== "zh") switchUiLocale("zh");
          }}
        >
          中文
        </button>
      </div>

      <Link href="/settings" className="bs-desknav-icon" aria-label={tr(locale, "Тохиргоо")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </Link>
    </header>
  );
}
