"use client";

import { useEffect, useMemo, useState } from "react";
import type { SubtitleWord } from "@/lib/bichleg/types";
import { fireConfetti, playSfx, recordDailyMissionProgress } from "@/lib/games/game-fx";
import { saveGameResult } from "@/lib/games/game-progress";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

type Q = { zh: string; pinyin?: string; answer: string; options: string[] };

const MAX_Q = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Түлхүүр үгс + бусад үгсээс 10 хүртэл асуулт (ханз → монгол утга сонгох). */
export function buildEpisodeQuiz(keyWords: SubtitleWord[], allWords: SubtitleWord[]): Q[] {
  const pool = allWords.filter((w) => w.zh && w.mn);
  const targets = shuffle(keyWords.filter((w) => w.zh && w.mn)).slice(0, MAX_Q);
  const meanings = [...new Set(pool.map((w) => w.mn!))];
  if (meanings.length < 4) return [];
  return targets.map((w) => {
    const distractors = shuffle(meanings.filter((m) => m !== w.mn)).slice(0, 3);
    return { zh: w.zh, pinyin: w.pinyin, answer: w.mn!, options: shuffle([w.mn!, ...distractors]) };
  });
}

type Props = {
  videoId: string;
  keyWords: SubtitleWord[];
  allWords: SubtitleWord[];
  onClose: () => void;
  onSaveWord?: (w: SubtitleWord) => void;
};

/** Ангийн төгсгөлийн шалгалт — баруун самбарт. */
export function BichlegEpisodeQuiz({ videoId, keyWords, allWords, onClose, onSaveWord }: Props) {
  const locale = useUiLocale();
  const questions = useMemo(() => buildEpisodeQuiz(keyWords, allWords), [keyWords, allWords]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrongWords, setWrongWords] = useState<SubtitleWord[]>([]);
  const [done, setDone] = useState(false);
  const q = questions[i];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || !q) return;
      if (e.key >= "1" && e.key <= "4" && !picked) {
        const opt = q.options[Number(e.key) - 1];
        if (opt) pick(opt);
      } else if (e.key === "Enter" && picked) next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function pick(opt: string) {
    if (picked || !q) return;
    setPicked(opt);
    const ok = opt === q.answer;
    playSfx(ok ? "correct" : "wrong");
    if (ok) setCorrect((c) => c + 1);
    else {
      const w = keyWords.find((k) => k.zh === q.zh);
      if (w) setWrongWords((prev) => [...prev, w]);
    }
  }

  function next() {
    if (i >= questions.length - 1) {
      const finalCorrect = correct;
      const total = questions.length;
      const accuracy = total ? Math.round((finalCorrect / total) * 100) : 0;
      saveGameResult({
        gameType: "bichleg-quiz",
        lessonId: `bichleg:${videoId}`,
        score: finalCorrect * 10,
        correct: finalCorrect,
        total,
        accuracy,
        playedAt: new Date().toISOString(),
      });
      recordDailyMissionProgress({ correct: finalCorrect, bestCombo: 0 });
      playSfx("finish");
      if (accuracy >= 80) fireConfetti();
      setDone(true);
      return;
    }
    setI((n) => n + 1);
    setPicked(null);
  }

  if (questions.length === 0) {
    return (
      <div className="bs-bd-card">
        <p className="bs-bd-hint">{tr(locale, "Энэ ангид шалгалт үүсгэхэд хангалттай үг алга.")}</p>
        <button type="button" className="bs-bd-chip" onClick={onClose}>✕ {tr(locale, "Хаах")}</button>
      </div>
    );
  }

  if (done) {
    const total = questions.length;
    const acc = Math.round((correct / total) * 100);
    return (
      <div className="bs-bd-card bs-bd-quiz">
        <div className="bs-bd-card-top">
          <span className="bs-bd-sec">{tr(locale, "Ангийн шалгалт")}</span>
          <button type="button" className="bs-bd-chip" onClick={onClose}>✕</button>
        </div>
        <p className="bs-bd-quiz-result">
          {acc >= 80 ? "🏆" : acc >= 50 ? "👍" : "💪"} {correct}/{total} · {acc}%
        </p>
        <p className="bs-bd-hint">
          {acc >= 80
            ? tr(locale, "Гайхалтай! Энэ ангийн үгсийг сайн мэдэж байна.")
            : tr(locale, "Алдсан үгсээ давталтад нэмээд, ангиа дахин үзээрэй.")}
        </p>
        {wrongWords.length > 0 ? (
          <div className="bs-bd-keychips" translate="no">
            {wrongWords.map((w) => (
              <button
                key={w.zh}
                type="button"
                className="bs-bd-keychip"
                onClick={() => onSaveWord?.(w)}
                title={tr(locale, "＋ Үгсэд нэмэх")}
              >
                <b className="hanzi">{w.zh}</b>
                <span>{w.mn} ＋</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bs-bd-card bs-bd-quiz">
      <div className="bs-bd-card-top">
        <span className="bs-bd-sec">
          {tr(locale, "Ангийн шалгалт")} · {i + 1}/{questions.length}
        </span>
        <button type="button" className="bs-bd-chip" onClick={onClose}>✕</button>
      </div>
      <div className="bs-bd-quiz-q" translate="no">
        <b className="hanzi">{q.zh}</b>
        {q.pinyin ? <span>{q.pinyin}</span> : null}
      </div>
      <div className="bs-bd-quiz-opts">
        {q.options.map((opt, n) => {
          let cls = "bs-bd-quiz-opt";
          if (picked) {
            if (opt === q.answer) cls += " bs-bd-quiz-opt--ok";
            else if (opt === picked) cls += " bs-bd-quiz-opt--bad";
          }
          return (
            <button key={opt} type="button" className={cls} onClick={() => pick(opt)} disabled={Boolean(picked)}>
              <kbd>{n + 1}</kbd>
              {opt}
            </button>
          );
        })}
      </div>
      {picked ? (
        <button type="button" className="bs-bd-primary" onClick={next}>
          {i >= questions.length - 1 ? tr(locale, "Дүн харах") : tr(locale, "Дараах")} <kbd style={{ marginLeft: 8 }}>Enter</kbd>
        </button>
      ) : null}
    </div>
  );
}
