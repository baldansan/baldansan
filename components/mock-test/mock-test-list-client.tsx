"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SKILL_LABELS_MN, type MockTestRow } from "@/lib/mock-test/types";

type Props = {
  tests: MockTestRow[];
  /** Давтах hub дотор — shell/back linkгүй */
  embedded?: boolean;
};

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
          levels.map((lvl) => (
            <section key={lvl} className="mt-4">
              <h2 className="bs-mt-section-title">HSK {lvl}</h2>
              <div className="flex flex-col gap-3 mt-2">
                {byLevel[lvl].map((test) => {
                  const skills = test.sections
                    .map((s) => SKILL_LABELS_MN[s.skill] ?? s.skill)
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <Link
                      key={test.id}
                      href={`/test/${test.id}`}
                      className="bs-mt-card block no-underline"
                    >
                      <p className="bs-mt-card-code">{test.id}</p>
                      <p className="bs-mt-card-title">{test.title}</p>
                      <p className="bs-mt-card-meta">
                        {test.total_questions} асуулт · {test.time_limit_min} мин
                        {skills ? ` · ${skills}` : ""}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
    </>
  );

  if (embedded) {
    return <div className="bs-mt-list">{listBody}</div>;
  }

  return (
    <MobileAppShell activeTab="games" showBottomNav mainClassName="max-w-[430px] mx-auto w-full px-0 pb-8">
      <div className="bs-mt-list px-4">{listBody}</div>
    </MobileAppShell>
  );
}
