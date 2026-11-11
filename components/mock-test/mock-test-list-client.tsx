"use client";

import { describeTestId } from "@/lib/mock-test/test-id-meta";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useActiveHskLevelOptional } from "@/components/providers/active-hsk-level-provider";
import { SKILL_LABELS_MN, type MockTestRow } from "@/lib/mock-test/types";
import type { MockTestLatestScore } from "@/lib/supabase/mock-tests-server";

type Props = {
  tests: MockTestRow[];
  latestScores?: Record<string, MockTestLatestScore>;
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

function skillKeysForTest(test: MockTestRow): string[] {
  const present = new Set(test.sections.map((s) => s.skill));
  return SKILL_ORDER.filter((sk) => present.has(sk));
}

export function MockTestListClient({
  tests,
  latestScores = {},
  embedded = false,
}: Props) {
  const byLevel = tests.reduce<Record<number, MockTestRow[]>>((acc, t) => {
    const lvl = t.hsk_level;
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(t);
    return acc;
  }, {});

  const levels = Object.keys(byLevel)
    .map(Number)
    .sort((a, b) => a - b);

  // Нэг л түвшин нээлттэй — анхдагч нь хэрэглэгчийн идэвхтэй HSK түвшин.
  const active = useActiveHskLevelOptional();
  // undefined = хэрэглэгч хараахан сонгоогүй → идэвхтэй түвшин нээлттэй.
  const [chosen, setChosen] = useState<number | null | undefined>(undefined);
  const defaultLevel =
    active?.hydrated && typeof active.level === "number" && byLevel[active.level] ? active.level : null;
  const openLevel = chosen === undefined ? defaultLevel : chosen;
  const setOpenLevel = (v: number | null) => setChosen(v);

  const listBody = (
    <>
      {!embedded ? (
        <Link href="/games" className="bs-mem-back">
          ← Тоглоом
        </Link>
      ) : null}
      <h1 className={`bs-mt-title ${embedded ? "bs-mt-title--embedded" : "mt-3"}`}>
        HSK жинхэнэ шалгалт
      </h1>
      <p className="bs-mt-sub">
        Албан ёсны 真题 — таймер, аудио, автомат оноо, монгол тайлбар. Түвшнээ сонго.
      </p>

      {tests.length === 0 ? (
        <div className="bs-mt-card mt-4">
          <p className="bs-mt-card-title">Тест олдсонгүй</p>
        </div>
      ) : (
        <div className="bs-mt-levels">
          {levels.map((lvl) => {
            const levelTests = [...byLevel[lvl]].sort((a, b) => b.id.localeCompare(a.id));
            const doneCount = levelTests.filter((t) => latestScores[t.id]).length;
            const open = openLevel === lvl;
            return (
              <section key={lvl} className={`bs-mt-level${open ? " bs-mt-level--open" : ""}`}>
                <button
                  type="button"
                  className="bs-mt-level-head"
                  onClick={() => setOpenLevel(open ? null : lvl)}
                  aria-expanded={open}
                >
                  <span className="bs-mt-level-badge">HSK {lvl}</span>
                  <span className="bs-mt-level-meta">
                    {levelTests.length} шалгалт
                    {doneCount ? ` · ${doneCount} өгсөн` : ""}
                  </span>
                  <span className="bs-mt-level-chev" aria-hidden>{open ? "▾" : "▸"}</span>
                </button>

                {open ? (
                  <div className="bs-mt-rows">
                    {levelTests.map((test) => {
                      const meta = describeTestId(test.id);
                      const latest = latestScores[test.id];
                      const skillKeys = skillKeysForTest(test);
                      const href = embedded ? `/test/${test.id}?from=review` : `/test/${test.id}?from=test`;
                      return (
                        <div key={test.id} className="bs-mt-row">
                          <Link href={href} className="bs-mt-row-main">
                            <span className="bs-mt-row-title">
                              {meta?.isSample
                                ? "Албан загвар (样卷)"
                                : meta
                                  ? `${meta.year} он · №${meta.serial}${meta.variant ? ` ${meta.variant}` : ""}`
                                  : test.id}
                            </span>
                            <span className="bs-mt-row-meta">
                              {test.time_limit_min} мин · {test.total_questions} асуулт ·{" "}
                              {skillKeys.map((sk) => (
                                <TablerIcon key={sk} name={SKILL_ICONS[sk] ?? "book"} />
                              ))}
                            </span>
                          </Link>
                          {latest ? (
                            <Link
                              href={`/test/${test.id}/attempt/${latest.attemptId}`}
                              className="bs-mt-row-score"
                            >
                              {Math.round(latest.rawScore)}/{Math.round(latest.maxScore)}
                            </Link>
                          ) : null}
                          <Link href={`/review/practice/${test.id}`} className="bs-mt-row-practice" aria-label="Дасгал горим">
                            Дасгал
                          </Link>
                          <Link href={href} className="bs-mt-play-btn" aria-label={`${test.id} эхлүүлэх`}>
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path d="M9 7.5v9l7.5-4.5L9 7.5z" />
                            </svg>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
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
      mainClassName=" px-0 pb-8"
    >
      <div className="bs-mt-list px-4">{listBody}</div>
    </MobileAppShell>
  );
}
