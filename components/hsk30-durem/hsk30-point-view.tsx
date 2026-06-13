"use client";

import Link from "next/link";
import { Hsk30ExamplesList } from "@/components/hsk30-durem/hsk30-examples-list";
import { Hsk30QuizBlock } from "@/components/hsk30-durem/hsk30-quiz-block";
import { hsk30LevelHref } from "@/lib/hsk30-durem/load-course";
import type { Hsk30Point } from "@/types/hsk30-durem";

type Props = {
  levelId: string;
  levelTitle: string;
  point: Hsk30Point;
  prevPointId?: string | null;
  nextPointId?: string | null;
};

export function Hsk30PointView({
  levelId,
  levelTitle,
  point,
  prevPointId,
  nextPointId,
}: Props) {
  const levelHref = hsk30LevelHref(levelId);
  const base = `/review/grammar/hsk30/${levelId}`;

  return (
    <div className="bs-gr2-point">
      <header className="bs-gr2-head">
        <p className="bs-gr2-point-zh">{point.zh}</p>
        <p className="bs-gr2-point-py">{point.pin}</p>
        <p className="bs-gr2-point-mn">{point.gloss}</p>
      </header>

      <div className="bs-gr2-teacher">
        <div className="bs-gr2-teacher-ava" aria-hidden>
          🐫
        </div>
        <div>
          <p className="bs-gr2-teacher-name">Тэмээ багш</p>
          <p className="bs-gr2-teacher-txt">{point.teacher}</p>
        </div>
      </div>

      {point.structure ? (
        <div className="bs-gr2-formula">
          <span className="bs-gr2-formula-label">Бүтэц</span>
          <code className="bs-gr2-formula-code">{point.structure}</code>
        </div>
      ) : null}

      <Hsk30ExamplesList examples={point.examples} />

      {point.mistakes && point.mistakes.length > 0 ? (
        <div className="bs-gr2-mistakes">
          <p className="bs-gr2-section-label">Түгээмэл алдаа</p>
          <div className="bs-gr2-mistakes-list">
            {point.mistakes.map((row, i) => (
              <div
                className="bs-gr2-mistake-row"
                key={`${row.wrong}-${row.right}-${i}`}
              >
                <div className="bs-gr2-mistake-card bs-gr2-mistake-card--bad">
                  <span className="bs-gr2-mistake-tag">✗ Буруу</span>
                  <span>{row.wrong}</span>
                </div>
                <div className="bs-gr2-mistake-card bs-gr2-mistake-card--ok">
                  <span className="bs-gr2-mistake-tag">✓ Зөв</span>
                  <span>{row.right}</span>
                </div>
                {row.why ? (
                  <p className="bs-gr2-mistake-why">
                    <strong>Яагаад: </strong>
                    {row.why}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {point.notes ? (
        <div className="bs-gr2-warn">
          <span className="bs-gr2-warn-icon" aria-hidden>
            ⚠️
          </span>
          <div>
            <p className="bs-gr2-warn-title">Анхаарах</p>
            <p className="bs-gr2-warn-body">{point.notes}</p>
          </div>
        </div>
      ) : null}

      {(point.exercises ?? []).map((ex, index) => (
        <Hsk30QuizBlock
          key={ex.id}
          item={ex}
          levelId={levelId}
          label={`Дасгал ${index + 1}`}
        />
      ))}

      {point.check ? (
        <Hsk30QuizBlock
          item={point.check}
          levelId={levelId}
          label="Хурдан шалгалт"
        />
      ) : null}

      <nav className="hz-module-nav">
        {prevPointId ? (
          <Link href={`${base}/${prevPointId}`} className="hz-nav-link">
            ← Өмнөх
          </Link>
        ) : (
          <span />
        )}
        {nextPointId ? (
          <Link href={`${base}/${nextPointId}`} className="hz-nav-link hz-nav-link--next">
            Дараагийн →
          </Link>
        ) : (
          <Link href={levelHref} className="hz-nav-link hz-nav-link--next">
            Жагсаалт руу →
          </Link>
        )}
      </nav>
    </div>
  );
}
