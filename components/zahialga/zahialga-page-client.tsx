"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { ZahialgaLessonContentView } from "@/components/zahialga/zahialga-lesson-content";
import {
  ZAHIALGA_CARGO_URL,
  ZAHIALGA_COUNTRIES,
  ZAHIALGA_LESSONS,
} from "@/lib/zahialga/data";
import type { ZahialgaCountryId } from "@/lib/zahialga/types";
import "@/components/zahialga/zahialga.css";

function initialOpenLessons() {
  return new Set(
    ZAHIALGA_LESSONS.filter((l) => !l.locked && l.defaultOpen).map(
      (l) => l.number
    )
  );
}

export function ZahialgaPageClient() {
  const [activeCountry, setActiveCountry] = useState<ZahialgaCountryId>("cn");
  const [openLessons, setOpenLessons] = useState(initialOpenLessons);

  const panelNote = useMemo(
    () => ZAHIALGA_COUNTRIES.find((c) => c.id === activeCountry)?.panelNote,
    [activeCountry]
  );

  function toggleLesson(number: number, locked: boolean) {
    if (locked) return;
    setOpenLessons((prev) => {
      const next = new Set(prev);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  }

  return (
    <MobileAppShell activeTab="home" mainClassName={SHELL_MAIN_NARROW}>
      <div className="zahialga-page">
        <h2 className="sr-only">
          Бөөндөө захиалгын сургалт: Хятад, Солонгос, Америкаас онлайн захиалах
          алхам алхмын заавар
        </h2>

        <header className="zah-header">
          <div className="zah-brand">
            <div className="zah-brand-mark" aria-hidden>
              Б
            </div>
            <div className="zah-brand-name">
              Бөөндөө <span>Сургалт</span>
            </div>
          </div>
          <div className="zah-hero">
            <h1 className="zah-hero-title">
              Дэлхийн хаанаас ч <em>өөрөө захиал.</em>
            </h1>
            <p className="zah-hero-sub">
              Хятад, Солонгос, Америкаас онлайн захиалахыг эхнээс нь зааж байна.
              Хятад үг мэдэхгүй ч болно.
            </p>
          </div>
        </header>

        <div className="zah-pick" role="tablist" aria-label="Улс сонгох">
          {ZAHIALGA_COUNTRIES.map((country) => {
            const selected = activeCountry === country.id;
            return (
              <button
                key={country.id}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={country.disabled}
                className="zah-ctry"
                onClick={() => {
                  if (!country.disabled) setActiveCountry(country.id);
                }}
              >
                <span className="zah-ctry-flag" aria-hidden>
                  {country.flag}
                </span>
                <span className="zah-ctry-label">{country.label}</span>
                {country.subtitle ? (
                  <span className="zah-ctry-sub">{country.subtitle}</span>
                ) : (
                  <span className="zah-soon">удахгүй</span>
                )}
              </button>
            );
          })}
        </div>

        {panelNote ? (
          <div className="zah-panel-note">
            <span className="zah-panel-dot" aria-hidden />
            {panelNote}
          </div>
        ) : null}

        <div className="zah-path">
          {ZAHIALGA_LESSONS.map((lesson, index) => {
            const isOpen = openLessons.has(lesson.number);
            const isLast = index === ZAHIALGA_LESSONS.length - 1;
            const bodyId = `zah-lesson-body-${lesson.number}`;

            return (
              <div
                key={lesson.number}
                className={`zah-lesson ${lesson.locked ? "zah-lesson--locked" : ""} ${isOpen ? "zah-lesson--open" : ""}`}
              >
                {!isLast ? <div className="zah-rail" aria-hidden /> : null}
                <div className="zah-node" aria-hidden>
                  {lesson.locked ? (
                    <span className="zah-lock">{lesson.lockIcon ?? "🔒"}</span>
                  ) : (
                    lesson.number
                  )}
                </div>
                <div className="zah-lcard">
                  {lesson.locked ? (
                    <div className="zah-lhead zah-lhead--locked">
                      <span className="zah-ltitle">
                        {lesson.title}
                        <span className="zah-lsub">{lesson.subtitle}</span>
                      </span>
                      <span className="zah-tag-soon">удахгүй</span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="zah-lhead"
                        aria-expanded={isOpen}
                        aria-controls={bodyId}
                        onClick={() =>
                          toggleLesson(lesson.number, lesson.locked)
                        }
                      >
                        <span className="zah-ltitle">
                          {lesson.title}
                          <span className="zah-lsub">{lesson.subtitle}</span>
                        </span>
                        <span className="zah-chev" aria-hidden>
                          ▾
                        </span>
                      </button>
                      {lesson.content ? (
                        <div className="zah-lbody" id={bodyId}>
                          <ZahialgaLessonContentView content={lesson.content} />
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="zah-cta">
          <h3>Захиалснаа Бөөндөөгөөр аваарай</h3>
          <p>
            Хятадаас захиалсан бараагаа манай агуулахын хаягаар захиалаад,
            Монгол хүртэл хүргүүлээрэй.
          </p>
          <a
            href={ZAHIALGA_CARGO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Бөөндөө Карго
          </a>
        </div>

        <footer className="zah-footer">
          © Бөөндөө Карго · Захиалгын сургалт
        </footer>

        <Link href="/home" className="zah-back">
          ← Нүүр рүү
        </Link>
      </div>
    </MobileAppShell>
  );
}
