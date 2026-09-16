"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SKILL_LABELS_MN, type MockTestRow } from "@/lib/mock-test/types";

type Props = {
  tests: MockTestRow[];
};

function levelLabel(level: number): string {
  return `HSK ${level}`;
}

export function MockTestPracticeListClient({ tests }: Props) {
  const levels = useMemo(
    () => [...new Set(tests.map((test) => test.hsk_level))].sort((a, b) => a - b),
    [tests]
  );
  const [level, setLevel] = useState<number | null>(null);

  const shown = level == null ? tests : tests.filter((t) => t.hsk_level === level);

  return (
    <div className="bs-mtp-hub">
      <h1 className="bs-mtp-title">Шалгалтын дасгал</h1>
      <p className="bs-mtp-sub">
        Жинхэнэ HSK шалгалтын асуултууд — гэхдээ цаг хэмжихгүй. Хариулсан
        даруйд зөв хариулт, яагаад тэр болохыг нь шууд харуулна.
      </p>

      {tests.length === 0 ? (
        <p className="bs-mtp-note">
          Одоогоор шалгалт ороогүй байна. Админ хэсэгт шалгалт нэмсний дараа энд
          гарч ирнэ.
        </p>
      ) : null}

      {levels.length > 1 ? (
        <div className="bs-mtp-level-row">
          <button
            type="button"
            className={`bs-mtp-level${level == null ? " bs-mtp-level--on" : ""}`}
            onClick={() => setLevel(null)}
          >
            Бүгд
          </button>
          {levels.map((item) => (
            <button
              key={item}
              type="button"
              className={`bs-mtp-level${level === item ? " bs-mtp-level--on" : ""}`}
              onClick={() => setLevel(item)}
            >
              {levelLabel(item)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="bs-mtp-hub-list">
        {shown.map((test) => (
          <Link
            key={test.id}
            href={`/review/practice/${test.id}`}
            className="bs-mtp-hub-card"
          >
            <span className="bs-mtp-hub-level">{levelLabel(test.hsk_level)}</span>
            <span className="bs-mtp-hub-body">
              <span className="bs-mtp-hub-title">{test.title}</span>
              <span className="bs-mtp-hub-meta">
                {test.total_questions} асуулт ·{" "}
                {test.sections
                  .map((section) => SKILL_LABELS_MN[section.skill] ?? section.skill)
                  .join(", ")}
              </span>
            </span>
            <span className="bs-mtp-hub-chev" aria-hidden>
              ›
            </span>
          </Link>
        ))}
      </div>

      <div className="bs-mtp-note">
        Жинхэнэ цагтай шалгалт өгөхийг хүсвэл{" "}
        <Link href="/review/tests" className="bs-mtp-inline-link">
          HSK бэлтгэл
        </Link>{" "}
        хэсэг рүү ор.
      </div>
    </div>
  );
}
