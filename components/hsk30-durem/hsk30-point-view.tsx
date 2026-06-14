"use client";

import Link from "next/link";
import { Hsk30ExamplesList } from "@/components/hsk30-durem/hsk30-examples-list";
import { Hsk30QuizBlock } from "@/components/hsk30-durem/hsk30-quiz-block";
import { TemeeImage } from "@/components/temee/temee-image";
import { hsk30LevelHref } from "@/lib/hsk30-durem/load-course";
import { highlightZh } from "@/lib/text/highlight-zh";
import type { Hsk30Point } from "@/types/hsk30-durem";

type Props = {
  levelId: string;
  levelTitle: string;
  point: Hsk30Point;
  pointIndex: number;
  prevPointId?: string | null;
  nextPointId?: string | null;
};

export function Hsk30PointView({
  levelId,
  point,
  pointIndex,
  prevPointId,
  nextPointId,
}: Props) {
  const levelHref = hsk30LevelHref(levelId);
  const base = `/review/grammar/hsk30/${levelId}`;
  const exercises = point.exercises ?? [];
  const mistakes = point.mistakes ?? [];

  return (
    <div className="hsk30-pt">
      <div className="p-head">
        <span className="p-num">{pointIndex + 1}</span>
        <span className="p-zh zh">{point.zh}</span>
        <span className="p-pin">{point.pin}</span>
        <span className="p-gloss">{point.gloss}</span>
      </div>

      <div className="teacher">
        <TemeeImage
          variant="think"
          className="ava"
          width={34}
          height={34}
        />
        <div className="t-txt">{point.teacher}</div>
      </div>

      {point.structure ? (
        <div className="struct">
          <div className="lbl">Бүтэц</div>
          <div className="zh">{point.structure}</div>
        </div>
      ) : null}

      <Hsk30ExamplesList examples={point.examples} />

      {mistakes.length > 0 ? (
        <>
          <p className="sub-h">⚠️ Түгээмэл алдаа</p>
          {mistakes.map((row, i) => (
            <div key={`${row.wrong}-${row.right}-${i}`}>
              <div className="mistake">
                <div className="mcard bad">
                  <span className="tag">✗ Буруу</span>
                  <span className="s zh">{row.wrong}</span>
                </div>
                <div className="mcard good">
                  <span className="tag">✓ Зөв</span>
                  <span className="s zh">{row.right}</span>
                </div>
              </div>
              {row.why ? (
                <div className="why">
                  <b>Яагаад:</b> {row.why}
                </div>
              ) : null}
            </div>
          ))}
        </>
      ) : null}

      {point.notes ? (
        <div className="note">🐫 {highlightZh(point.notes)}</div>
      ) : null}

      {exercises.length > 0 ? (
        <>
          <p className="sub-h">✍️ Дасгал</p>
          {exercises.map((ex) => (
            <Hsk30QuizBlock key={ex.id} item={ex} levelId={levelId} />
          ))}
        </>
      ) : null}

      {point.check ? (
        <>
          <p className="sub-h">⚡ Хурдан шалгалт</p>
          <Hsk30QuizBlock item={point.check} levelId={levelId} />
        </>
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
          <Link
            href={`${base}/${nextPointId}`}
            className="hz-nav-link hz-nav-link--next"
          >
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
