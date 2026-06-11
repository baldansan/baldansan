"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SKILL_LABELS_MN, type MockTestRow } from "@/lib/mock-test/types";

type Props = {
  tests: MockTestRow[];
  /** Давтах hub дотор — shell/back linkгүй */
  embedded?: boolean;
};

const SKILL_ORDER = ["listening", "reading", "writing"] as const;

const SKILL_ICONS: Record<string, TablerIconName> = {
  listening: "headphones",
  reading: "book",
  writing: "pencil",
};

type TablerIconName =
  | "clock"
  | "list-numbers"
  | "headphones"
  | "book"
  | "pencil";

function TablerIcon({ name }: { name: TablerIconName }) {
  const paths: Record<TablerIconName, ReactNode> = {
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    "list-numbers": (
      <>
        <path d="M11 6h9" />
        <path d="M11 12h9" />
        <path d="M11 18h9" />
        <path d="M4 6h1v4" />
        <path d="M4 10h2" />
        <path d="M6 18h-2" />
        <path d="M5 18v-6h-1l1-2h2" />
      </>
    ),
    headphones: (
      <>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M4 13v4a2 2 0 0 0 2 2h1v-7a2 2 0 0 0-2-2" />
        <path d="M20 13v4a2 2 0 0 1-2 2h-1v-7a2 2 0 0 1 2-2" />
      </>
    ),
    book: (
      <>
        <path d="M3 19a9 9 0 0 1 9 0" />
        <path d="M12 19a9 9 0 0 0 9 0" />
        <path d="M12 5v14" />
        <path d="M5 7a7 7 0 0 1 14 0" />
      </>
    ),
    pencil: (
      <>
        <path d="M4 20h4l10.5-10.5a2.828 2.828 0 1 0-4-4l-10.5 10.5v4" />
        <path d="M13.5 6.5l4 4" />
      </>
    ),
  };

  return (
    <svg
      className="bs-mt-chip-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

function skillsForTest(test: MockTestRow): string[] {
  const present = new Set(test.sections.map((s) => s.skill));
  return SKILL_ORDER.filter((sk) => present.has(sk)).map(
    (sk) => SKILL_LABELS_MN[sk] ?? sk
  );
}

function skillKeysForTest(test: MockTestRow): string[] {
  const present = new Set(test.sections.map((s) => s.skill));
  return SKILL_ORDER.filter((sk) => present.has(sk));
}

export function MockTestListClient({ tests, embedded = false }: Props) {
  const byLevel = tests.reduce<Record<number, MockTestRow[]>>((acc, t) => {
    const lvl = t.hsk_level;
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(t);
    return acc;
  }, {});

  const levels = Object.keys(byLevel)
    .map(Number)
    .sort((a, b) => a - b);

  const listBody = (
    <>
      {!embedded ? (
        <Link href="/games" className="bs-mem-back">
          ← Тоглоом
        </Link>
      ) : null}
      <h1 className={`bs-mt-title ${embedded ? "" : "mt-3"}`}>
        HSK загвар шалгалт
      </h1>
      <p className="bs-mt-sub">
        Албан ёсны загварын бүтэн шалгалт — таймер, аудио, автомат оноо
      </p>

      {tests.length === 0 ? (
        <div className="bs-mt-card mt-4">
          <p className="bs-mt-card-title">Тест олдсонгүй</p>
          <p className="bs-mt-card-meta mt-2">
            <code>data/tests/&lt;TID&gt;/</code> фолдер нэмээд{" "}
            <code>npm run load:tests</code> ажиллуулна уу.
          </p>
        </div>
      ) : (
        levels.map((lvl) => {
          const levelTests = [...byLevel[lvl]].sort((a, b) =>
            a.id.localeCompare(b.id)
          );
          return (
            <section key={lvl} className="bs-mt-level-section">
              <h2 className="bs-mt-section-title">HSK {lvl}</h2>
              <div className="bs-mt-card-list">
                {levelTests.map((test, index) => {
                  const skillKeys = skillKeysForTest(test);
                  const skillLabels = skillsForTest(test);
                  return (
                    <Link
                      key={test.id}
                      href={`/test/${test.id}`}
                      className="bs-mt-card bs-mt-card--row"
                    >
                      <div className="bs-mt-card-body">
                        <div className="bs-mt-card-head">
                          <h3 className="bs-mt-card-title">
                            Загвар {index + 1}
                          </h3>
                          <span className="bs-mt-card-badge">{test.id}</span>
                        </div>
                        <div className="bs-mt-chip-row">
                          <span className="bs-mt-chip bs-mt-chip--meta">
                            <TablerIcon name="clock" />
                            {test.time_limit_min} мин
                          </span>
                          <span className="bs-mt-chip bs-mt-chip--meta">
                            <TablerIcon name="list-numbers" />
                            {test.total_questions} асуулт
                          </span>
                          {skillLabels.map((label, i) => {
                            const sk = skillKeys[i] ?? "reading";
                            const icon = SKILL_ICONS[sk] ?? "book";
                            return (
                              <span
                                key={`${test.id}-${sk}`}
                                className="bs-mt-chip bs-mt-chip--skill"
                              >
                                <TablerIcon name={icon} />
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <span className="bs-mt-play-btn" aria-hidden>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 7.5v9l7.5-4.5L9 7.5z" />
                        </svg>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </>
  );

  if (embedded) {
    return <div className="bs-mt-list">{listBody}</div>;
  }

  return (
    <MobileAppShell
      activeTab="games"
      showBottomNav
      mainClassName="max-w-[430px] mx-auto w-full px-0 pb-8"
    >
      <div className="bs-mt-list px-4">{listBody}</div>
    </MobileAppShell>
  );
}
