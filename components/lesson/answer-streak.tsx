"use client";

/**
 * Дасгал, сорилын «дараалсан зөв» тоо (🔥) ба хариулт бүрийн дараах Балдангийн нэг мөр.
 * Тоо нь хичээл бүрд sessionStorage-д хадгалагдана — дасгалаас сорил руу шилжихэд тасрахгүй,
 * дүгнэлтийн карт хамгийн урт дарааллыг харуулна. Серверт юу ч бичихгүй.
 */
import { useCallback, useEffect, useState } from "react";
import { BaldanSay } from "@/components/lesson/baldan-say";
import { baldanLine } from "@/lib/temee/baldan-lines";
import "./lesson-fresh.css";

export type AnswerStreak = { cur: number; best: number };

const key = (lessonId: string) => `bs:streak:${lessonId}`;

export function readAnswerStreak(lessonId: string): AnswerStreak {
  try {
    const raw = window.sessionStorage.getItem(key(lessonId));
    if (!raw) return { cur: 0, best: 0 };
    const p = JSON.parse(raw) as Partial<AnswerStreak>;
    return { cur: Number(p.cur) || 0, best: Number(p.best) || 0 };
  } catch {
    return { cur: 0, best: 0 };
  }
}

function writeAnswerStreak(lessonId: string, value: AnswerStreak) {
  try {
    window.sessionStorage.setItem(key(lessonId), JSON.stringify(value));
  } catch {
    // хадгалж чадахгүй бол зөвхөн энэ дэлгэцэд тоолно
  }
}

export function useAnswerStreak(lessonId: string) {
  const [streak, setStreak] = useState<AnswerStreak>({ cur: 0, best: 0 });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage-оос нэг удаа сэргээнэ
    setStreak(readAnswerStreak(lessonId));
  }, [lessonId]);
  const register = useCallback(
    (ok: boolean) => {
      const prev = readAnswerStreak(lessonId);
      const cur = ok ? prev.cur + 1 : 0;
      const next = { cur, best: Math.max(prev.best, cur) };
      writeAnswerStreak(lessonId, next);
      setStreak(next);
    },
    [lessonId]
  );
  return { streak, register };
}

/** 2-оос дээш дараалсан зөв үед л харагдана. */
export function StreakBadge({ n }: { n: number }) {
  if (n < 2) return null;
  return (
    <span className="bs-streak" key={n} aria-label={`${n} дараалсан зөв`}>
      🔥 {n}
    </span>
  );
}

/** Хариултын дараах Балдангийн нэг мөр: зөв / 3, 6, 9… дараалсан зөв / буруу. */
export function BaldanReaction({ ok, streak, seed }: { ok: boolean; streak: number; seed: number }) {
  const hot = ok && streak >= 3 && streak % 3 === 0;
  return (
    <div className="bs-vreveal">
      <BaldanSay
        pose={ok ? (hot ? "celebrate" : "thumbsup") : "encourage"}
        text={baldanLine(ok ? (hot ? "streak" : "correct") : "wrong", seed)}
      />
    </div>
  );
}
