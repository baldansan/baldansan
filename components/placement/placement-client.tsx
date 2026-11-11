"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MockTestPracticeQuestion } from "@/components/mock-test/mock-test-practice-question";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import type { ActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import {
  buildPracticeFeedback,
  type PracticeFeedback,
} from "@/lib/mock-test/practice-feedback";
import type { MockTestQuestionRow } from "@/lib/mock-test/types";
import {
  PLACEMENT_BLOCK,
  PLACEMENT_BLOCKS,
  PLACEMENT_MINUTES,
  PLACEMENT_TOTAL,
} from "@/lib/placement/constants";

type Props = {
  salt: string;
  byLevel: Record<number, MockTestQuestionRow[]>;
  startLevel: number;
};

type Block = { level: number; correct: number; total: number };
type Phase = "intro" | "run" | "done";

const RESULT_KEY = "bs:placement:v1";

/** Блокийн дүнгээр дараагийн түвшин: ≥4/5 ахина, ≤1/5 буурна. */
function nextLevel(level: number, correct: number): number {
  if (correct >= 4) return Math.min(6, level + 1);
  if (correct <= 1) return Math.max(1, level - 1);
  return level;
}

/** Эцсийн тооцоо: түвшин бүрийн зөв хувь → 60%+ хангасан хамгийн дээд түвшин. */
function estimateLevel(blocks: Block[]): { level: number; note: string } {
  const agg = new Map<number, { c: number; t: number }>();
  for (const b of blocks) {
    const a = agg.get(b.level) ?? { c: 0, t: 0 };
    a.c += b.correct;
    a.t += b.total;
    agg.set(b.level, a);
  }
  let best = 0;
  for (const [lvl, a] of agg) {
    if (a.t > 0 && a.c / a.t >= 0.6 && lvl > best) best = lvl;
  }
  if (best === 0) {
    // Аль ч түвшинд 60% хүрээгүй → хамгийн доод шалгасан түвшнээс нэг доош (мин 1).
    const minLvl = Math.min(...blocks.map((b) => b.level));
    return { level: Math.max(1, minLvl - 1), note: "Шалгасан түвшнүүдэд 60%-д хүрсэнгүй — нэг түвшин доош санал болгож байна." };
  }
  const a = agg.get(best)!;
  const pct = Math.round((a.c / a.t) * 100);
  const above = agg.get(best + 1);
  const note = above
    ? `HSK ${best}-д ${pct}%, HSK ${best + 1}-д ${Math.round((above.c / above.t) * 100)}%.`
    : pct >= 85
      ? `HSK ${best}-д ${pct}% — дараагийн түвшнийг ч туршиж болно.`
      : `HSK ${best}-д ${pct}%.`;
  return { level: best, note };
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlacementClient({ salt, byLevel, startLevel }: Props) {
  useActivityTracker("mock", "placement");
  const { setLevel: setActiveLevel } = useActiveHskLevel();

  const [phase, setPhase] = useState<Phase>("intro");
  const [level, setLevel] = useState(startLevel);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockCorrect, setBlockCorrect] = useState(0);
  const [blockIndex, setBlockIndex] = useState(0); // 0..4 блок доторх
  const [answeredTotal, setAnsweredTotal] = useState(0);
  const [correctTotal, setCorrectTotal] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(PLACEMENT_MINUTES * 60);

  // Түвшин бүрээс хэдийг ашигласан
  const usedRef = useRef<Record<number, number>>({});
  const [question, setQuestion] = useState<MockTestQuestionRow | null>(null);

  const pickNext = useCallback(
    (lvl: number): MockTestQuestionRow | null => {
      // Тухайн түвшинд дууссан бол ойрын түвшнээс авна.
      const order = [lvl, lvl + 1, lvl - 1, lvl + 2, lvl - 2, lvl + 3, lvl - 3].filter((l) => l >= 1 && l <= 6);
      for (const l of order) {
        const pool = byLevel[l] ?? [];
        const used = usedRef.current[l] ?? 0;
        if (used < pool.length) {
          usedRef.current[l] = used + 1;
          return pool[used]!;
        }
      }
      return null;
    },
    [byLevel]
  );

  const finish = useCallback(
    (finalBlocks: Block[]) => {
      setBlocks(finalBlocks);
      setPhase("done");
    },
    []
  );

  const start = useCallback(() => {
    usedRef.current = {};
    const q = pickNext(startLevel);
    setLevel(startLevel);
    setQuestion(q);
    setBlocks([]);
    setBlockCorrect(0);
    setBlockIndex(0);
    setAnsweredTotal(0);
    setCorrectTotal(0);
    setAnswer(null);
    setRevealed(false);
    setFeedback(null);
    setSecondsLeft(PLACEMENT_MINUTES * 60);
    setPhase(q ? "run" : "done");
  }, [pickNext, startLevel]);

  // Цаг
  useEffect(() => {
    if (phase !== "run") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Хугацаа дууссан → одоогийн блокийг хагасаар хааж дүгнэнэ (render дотор биш, товчоор).
  const timeUp = phase === "run" && secondsLeft === 0;
  const finishOnTimeUp = () => {
    const partial: Block[] = blockIndex > 0 ? [{ level, correct: blockCorrect, total: blockIndex }] : [];
    finish([...blocks, ...partial]);
  };

  const handleAnswer = useCallback(
    (value: string) => {
      if (!question || revealed) return;
      const built = buildPracticeFeedback(question, value);
      setAnswer(value);
      setFeedback(built);
      setRevealed(true);
      const ok = built.isCorrect === true;
      setBlockCorrect((c) => c + (ok ? 1 : 0));
      setCorrectTotal((c) => c + (ok ? 1 : 0));
      setAnsweredTotal((c) => c + 1);
    },
    [question, revealed]
  );

  const skip = useCallback(() => {
    if (!question || revealed) return;
    setFeedback(buildPracticeFeedback(question, null));
    setRevealed(true);
    setAnswer(null);
    setAnsweredTotal((c) => c + 1);
  }, [question, revealed]);

  const goNext = useCallback(() => {
    const nextIdx = blockIndex + 1;
    let lvl = level;
    let newBlocks = blocks;
    let nextBlockCorrect = blockCorrect;
    let nextBlockIdx = nextIdx;
    if (nextIdx >= PLACEMENT_BLOCK) {
      newBlocks = [...blocks, { level, correct: blockCorrect, total: PLACEMENT_BLOCK }];
      if (newBlocks.length >= PLACEMENT_BLOCKS) {
        finish(newBlocks);
        return;
      }
      lvl = nextLevel(level, blockCorrect);
      nextBlockCorrect = 0;
      nextBlockIdx = 0;
    }
    const q = pickNext(lvl);
    if (!q) {
      finish(newBlocks.length ? newBlocks : [{ level, correct: blockCorrect, total: nextIdx }]);
      return;
    }
    setBlocks(newBlocks);
    setLevel(lvl);
    setBlockCorrect(nextBlockCorrect);
    setBlockIndex(nextBlockIdx);
    setQuestion(q);
    setAnswer(null);
    setRevealed(false);
    setFeedback(null);
  }, [blockIndex, blocks, blockCorrect, level, pickNext, finish]);

  const estimate = useMemo(() => (blocks.length ? estimateLevel(blocks) : null), [blocks]);

  // Дүн гарсан → идэвхтэй түвшин болгож, локалд хадгална.
  useEffect(() => {
    if (phase !== "done" || !estimate) return;
    setActiveLevel(estimate.level as ActiveHskLevel);
    try {
      localStorage.setItem(
        RESULT_KEY,
        JSON.stringify({ level: estimate.level, at: new Date().toISOString(), correct: correctTotal, total: answeredTotal })
      );
    } catch {
      /* ignore */
    }
  }, [phase, estimate, setActiveLevel, correctTotal, answeredTotal]);

  const available = Object.values(byLevel).reduce((n, arr) => n + arr.length, 0);

  if (phase === "intro") {
    return (
      <MobileAppShell activeTab="study" showBottomNav>
        <div className="bs-mtp-wrap">
          <h1 className="bs-mtp-title">Түвшин тогтоох шалгалт</h1>
          <p className="bs-mtp-sub">{PLACEMENT_TOTAL} асуулт · {PLACEMENT_MINUTES} минут · HSK 1–6</p>
          <div className="bs-mtp-score" style={{ textAlign: "left" }}>
            <p className="bs-mtp-note" style={{ margin: 0 }}>
              Жинхэнэ шалгалтуудын сонсгол, уншлагын асуултаас 5-5-аар өгнө. Сайн хариулвал
              түвшин ахиж, алдвал буурна — {PLACEMENT_BLOCKS} блокийн дараа таны түвшнийг тогтооно.
            </p>
            <ul className="bs-mtp-note" style={{ margin: "10px 0 0", paddingLeft: 18 }}>
              <li>Сонсголын асуулт аудиотой — чихэвчээ бэлдээрэй.</li>
              <li>Мэдэхгүй бол «Мэдэхгүй» дар — таамаглахгүй байх нь дүнг үнэн болгоно.</li>
              <li>Дүн таны идэвхтэй HSK түвшин болж, нүүр хуудас түүнд тохирно.</li>
            </ul>
          </div>
          {available < PLACEMENT_TOTAL ? (
            <p className="bs-mtp-note">Асуултын сан хүрэлцэхгүй байна ({available}).</p>
          ) : null}
          <div className="bs-mtp-done-actions">
            <button type="button" className="bs-mtp-primary" onClick={start} disabled={available === 0}>
              Эхлэх (HSK {startLevel}-аас)
            </button>
            <div className="bs-mtp-level-row">
              {[1, 2, 3, 4, 5, 6].map((l) => (
                <Link
                  key={l}
                  href={`/placement?start=${l}&r=${salt}`}
                  className={`bs-mtp-level-chip${l === startLevel ? " bs-mtp-level-chip--on" : ""}`}
                >
                  {l}
                </Link>
              ))}
            </div>
            <Link href="/home" className="bs-mtp-secondary">Нүүр хуудас</Link>
          </div>
        </div>
      </MobileAppShell>
    );
  }

  if (phase === "done") {
    const lvl = estimate?.level ?? startLevel;
    return (
      <MobileAppShell activeTab="study" showBottomNav>
        <div className="bs-mtp-wrap">
          <h1 className="bs-mtp-title">Таны түвшин</h1>
          <div className="bs-mtp-score">
            <p className="bs-mtp-score-big">HSK {lvl}</p>
            <p className="bs-mtp-score-meta">
              {correctTotal}/{answeredTotal} зөв · {estimate?.note ?? ""}
            </p>
          </div>

          <div className="bs-mtp-blocks">
            {blocks.map((b, i) => (
              <div key={i} className="bs-mtp-block">
                <span className="bs-mtp-block-lvl">HSK {b.level}</span>
                <span className={`bs-mtp-block-val${b.correct >= 4 ? " ok" : b.correct <= 1 ? " bad" : ""}`}>
                  {b.correct}/{b.total}
                </span>
              </div>
            ))}
          </div>

          <p className="bs-mtp-note">
            Идэвхтэй түвшин HSK {lvl} болж тохирлоо. Доорхоос үргэлжлүүл:
          </p>
          <div className="bs-mtp-done-actions">
            <Link href="/home" className="bs-mtp-primary">HSK {lvl} хичээлүүд →</Link>
            <Link href={`/listen/daily?level=${lvl}`} className="bs-mtp-secondary">🎧 Өнөөдрийн сонсгол (HSK {lvl})</Link>
            <Link href="/review/practice" className="bs-mtp-secondary">Жинхэнэ шалгалтын дасгал →</Link>
            <Link href={`/placement?start=${lvl}&r=${salt}x`} className="bs-mtp-secondary">Дахин өгөх</Link>
          </div>
        </div>
      </MobileAppShell>
    );
  }

  if (!question) return null;
  const progress = Math.round((answeredTotal / PLACEMENT_TOTAL) * 100);

  if (timeUp) {
    return (
      <MobileAppShell activeTab="study" showBottomNav>
        <div className="bs-mtp-wrap">
          <h1 className="bs-mtp-title">Хугацаа дууслаа</h1>
          <p className="bs-mtp-sub">{answeredTotal} асуултад хариулсан.</p>
          <div className="bs-mtp-done-actions">
            <button type="button" className="bs-mtp-primary" onClick={finishOnTimeUp}>Дүнг харах</button>
          </div>
        </div>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell activeTab="study" showBottomNav>
      <div className="bs-mtp-wrap">
        <div className="bs-mtp-runbar">
          <Link href="/home" className="bs-mtp-back">← Гарах</Link>
          <span className="bs-mtp-counter">{Math.min(answeredTotal + 1, PLACEMENT_TOTAL)} / {PLACEMENT_TOTAL}</span>
          <span className={`bs-mtp-timer${secondsLeft < 120 ? " bs-mtp-timer--low" : ""}`}>⏱ {fmt(secondsLeft)}</span>
        </div>
        <div className="bs-mtp-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="bs-mtp-group-line">
          Блок {blocks.length + 1}/{PLACEMENT_BLOCKS} · HSK {level} · {question.skill === "listening" ? "Сонсгол" : "Унших"}
        </p>

        <MockTestPracticeQuestion
          key={question.id}
          question={question}
          answer={answer}
          revealed={revealed}
          onAnswer={handleAnswer}
          onSelfGrade={() => undefined}
          feedback={feedback}
          hideAudio={false}
          prefetchAudioUrls={[]}
        />

        <div className="bs-mtp-footer">
          {!revealed ? (
            <button type="button" className="bs-mtp-secondary" onClick={skip}>
              Мэдэхгүй
            </button>
          ) : (
            <button type="button" className="bs-mtp-primary" onClick={goNext}>
              {answeredTotal >= PLACEMENT_TOTAL ? "Дүнг харах" : "Дараагийн асуулт →"}
            </button>
          )}
        </div>
      </div>
    </MobileAppShell>
  );
}
