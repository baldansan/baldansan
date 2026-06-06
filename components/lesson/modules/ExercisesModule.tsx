"use client";
// components/lesson/modules/ExercisesModule.tsx
// "exercises_textbook" / "exercises_workbook" модуль — интерактив дасгал.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearBsExercisesProgress,
  getBsExercisesProgress,
  markBsModuleCompleted,
  saveBsExercisesProgress,
  type BsGroupAnswerSnapshot,
} from "@/lib/lesson/bs-step-progress";
import { resolveLessonPackagePlayableUrl } from "@/lib/lesson/package-audio-resolve";
import { resolveWorkbookListeningItemAudio } from "@/lib/lesson/workbook-listening-audio";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import "./exercises-module.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

type ListeningSubQuestion =
  | {
      kind: "choice";
      n?: number;
      prompt: string;
      options: string[];
      answer: string;
    }
  | {
      kind: "tf";
      n?: number;
      prompt: string;
      answer: boolean;
    };

type Question =
  | {
      kind: "choice";
      n?: number;
      section: string;
      instruction?: string;
      audio?: string;
      zh?: string;
      prompt: string;
      options: string[];
      answer: string;
    }
  | {
      kind: "tf";
      n?: number;
      section: string;
      instruction?: string;
      audio?: string;
      prompt: string;
      answer: boolean;
    }
  | {
      kind: "listening_group";
      section: string;
      instruction?: string;
      audio: string;
      items: ListeningSubQuestion[];
    }
  | {
      kind: "order";
      n?: number;
      section: string;
      instruction?: string;
      prompt: string;
      tokens: string[];
      keys: string[];
      answer: string[];
    }
  | {
      kind: "scramble";
      n?: number;
      section: string;
      instruction?: string;
      prompt: string;
      tokens: string[];
      answer: string;
    };

type GroupAnswerState = {
  picked: string | null;
  tf: boolean | null;
  checked: boolean;
  correct: boolean;
};

type NavEntry = { n: number; qi: number };

function valuesOf(o: unknown): { values: string[]; byKey: Record<string, string> } {
  if (Array.isArray(o)) {
    const values = o.map((x) => String(x));
    return { values, byKey: {} };
  }
  const byKey: Record<string, string> = {};
  const values: string[] = [];
  if (o && typeof o === "object") {
    for (const k of Object.keys(o as Record<string, unknown>)) {
      const v = String((o as Record<string, unknown>)[k]);
      byKey[k] = v;
      values.push(v);
    }
  }
  return { values, byKey };
}

function resolveAns(ans: unknown, byKey: Record<string, string>): string {
  const key = String(ans);
  return byKey[key] != null ? byKey[key] : key;
}

function toBool(a: unknown): boolean {
  return /^(true|对|正确|√|t|right|yes|y|1)$/i.test(String(a).trim());
}

function norm(s: string): string {
  return String(s).replace(/[\s。，、！？!?,.;；：:""''「」（）()]/g, "");
}

function countGradableItems(questions: Question[]): number {
  return questions.reduce((sum, q) => {
    if (q.kind === "listening_group") return sum + q.items.length;
    return sum + 1;
  }, 0);
}

function buildNavEntries(questions: Question[]): NavEntry[] {
  const entries: NavEntry[] = [];
  questions.forEach((q, qi) => {
    if (q.kind === "listening_group") {
      for (const item of q.items) {
        if (item.n != null) entries.push({ n: item.n, qi });
      }
    } else if (q.n != null) {
      entries.push({ n: q.n, qi });
    }
  });
  return entries;
}

function positionCounterLabel(q: Question, qi: number, questions: Question[]): string {
  if (q.kind === "listening_group") {
    const nums = q.items.map((it) => it.n).filter((n): n is number => n != null);
    if (nums.length >= 2) return `${nums[0]}–${nums[nums.length - 1]}`;
    if (nums.length === 1) return String(nums[0]);
  }
  if ("n" in q && q.n != null) return String(q.n);
  let offset = 0;
  for (let i = 0; i < qi; i++) {
    const step = questions[i];
    if (step.kind === "listening_group") offset += step.items.length;
    else offset += 1;
  }
  return String(offset + 1);
}

function listeningAudioKey(
  rawPath: string | undefined,
  base: string | undefined,
  soloId: string | number
): string {
  const path = rawPath?.trim();
  if (!path) return `__solo__:${soloId}`;
  const resolved = resolveLessonPackagePlayableUrl(path, { packageAudioBase: base });
  return resolved ?? path;
}

function buildListeningSubQuestion(it: Record<string, unknown>): ListeningSubQuestion | null {
  if (it.options != null) {
    const { values, byKey } = valuesOf(it.options);
    return {
      kind: "choice",
      n: Number(it.n) || undefined,
      prompt: it.statement_zh
        ? String(it.statement_zh)
        : it.statement
          ? String(it.statement)
          : "Сонссоноо сонгоорой:",
      options: values,
      answer: resolveAns(it.answer, byKey),
    };
  }
  const statement =
    it.statement_zh != null
      ? String(it.statement_zh)
      : it.statement != null
        ? String(it.statement)
        : null;
  if (statement == null) return null;
  return {
    kind: "tf",
    n: Number(it.n) || undefined,
    prompt: statement,
    answer: toBool(it.answer),
  };
}

type ListeningDraft = {
  sub: ListeningSubQuestion;
  audio?: string;
  audioKey: string;
};

function flushListeningDrafts(
  out: Question[],
  drafts: ListeningDraft[],
  section: string,
  instruction?: string
): void {
  let i = 0;
  while (i < drafts.length) {
    const key = drafts[i].audioKey;
    const group: ListeningDraft[] = [];
    while (i < drafts.length && drafts[i].audioKey === key) {
      group.push(drafts[i]);
      i++;
    }
    const audio = group[0].audio;
    if (group.length > 1 && audio) {
      out.push({
        kind: "listening_group",
        section,
        instruction,
        audio,
        items: group.map((g) => g.sub),
      });
      continue;
    }
    const g0 = group[0];
    if (g0.sub.kind === "choice") {
      out.push({
        ...g0.sub,
        section,
        instruction,
        audio: g0.audio,
      });
    } else {
      out.push({
        ...g0.sub,
        section,
        instruction,
        audio: g0.audio,
      });
    }
  }
}

function buildQuestions(
  lesson: HskLessonPackage,
  source: "textbook" | "workbook"
): Question[] {
  const out: Question[] = [];
  const base = lesson.audio_base_path;

  try {
    if (source === "textbook") {
      const tb = lesson.exercises_textbook as any;
      const banks = tb?.fill_in?.banks ?? [];
      for (const b of banks) {
        const words: string[] = (b?.words ?? []).map((w: unknown) => String(w));
        for (const it of b?.items ?? []) {
          if (it?.q == null || it?.answer == null) continue;
          out.push({
            kind: "choice",
            n: it.n,
            section: "Үг нөхөх",
            instruction: tb?.fill_in?.instruction_mn,
            prompt: String(it.q),
            options: words.length ? words : [String(it.answer)],
            answer: String(it.answer),
          });
        }
      }
    } else {
      const wb = lesson.exercises_workbook as any;

      for (const part of wb?.listening?.parts ?? []) {
        const instruction = part?.instruction_mn;
        const partRecord =
          part && typeof part === "object" ? (part as Record<string, unknown>) : null;
        const drafts: ListeningDraft[] = [];

        for (const it of part?.items ?? []) {
          const itemRecord =
            it && typeof it === "object" ? (it as Record<string, unknown>) : null;
          if (!itemRecord) continue;
          const sub = buildListeningSubQuestion(itemRecord);
          if (!sub) continue;
          const audio =
            partRecord != null
              ? resolveWorkbookListeningItemAudio(partRecord, itemRecord)
              : trimAudio(itemRecord.audio) || trimAudio(itemRecord.audioFile);
          drafts.push({
            sub,
            audio,
            audioKey: listeningAudioKey(audio, base, sub.n ?? drafts.length),
          });
        }

        flushListeningDrafts(out, drafts, "Сонсгол", instruction);
      }

      for (const b of wb?.reading?.select_word ?? []) {
        const { values, byKey } = valuesOf(b?.bank ?? {});
        for (const it of b?.items ?? []) {
          if (it?.q == null) continue;
          out.push({
            kind: "choice",
            n: it.n,
            section: "Үг сонгох",
            prompt: String(it.q),
            options: values,
            answer: resolveAns(it.answer, byKey),
          });
        }
      }

      for (const it of wb?.reading?.ordering ?? []) {
        const parts = it?.parts ?? {};
        const keys = Object.keys(parts);
        const tokens = keys.map((k) => String(parts[k]));
        const answer = String(it?.answer ?? "").split("").filter(Boolean);
        if (keys.length && answer.length) {
          out.push({
            kind: "order",
            n: it.n,
            section: "Дараалал",
            prompt: "Зөв дарааллаар нь өрөөрэй:",
            tokens,
            keys,
            answer,
          });
        }
      }

      for (const it of wb?.reading?.comprehension ?? []) {
        const { values, byKey } = valuesOf(it?.options ?? {});
        out.push({
          kind: "choice",
          n: it.n,
          section: "Унших ойлголт",
          zh: it?.passage_zh ? String(it.passage_zh) : undefined,
          prompt: String(it?.q_zh ?? ""),
          options: values,
          answer: resolveAns(it.answer, byKey),
        });
      }

      const ms = wb?.writing?.make_sentence;
      for (const it of ms?.items ?? []) {
        const words: string[] = (it?.words ?? []).map((w: unknown) => String(w));
        if (words.length && it?.answer != null) {
          out.push({
            kind: "scramble",
            n: it.n,
            section: "Өгүүлбэр эвлүүлэх",
            instruction: ms?.instruction_mn,
            prompt: "Үгсийг эвлүүлж зөв өгүүлбэр болгоорой:",
            tokens: words,
            answer: String(it.answer),
          });
        }
      }
    }
  } catch {
    // бүтэц санаанд оромгүй бол байгаа хэдийг нь буцаана
  }
  return out;
}

function trimAudio(value: unknown): string | undefined {
  const s = String(value ?? "").trim();
  return s || undefined;
}

function emptyGroupAnswers(q: Question): GroupAnswerState[] {
  if (q.kind !== "listening_group") return [];
  return q.items.map(() => ({
    picked: null,
    tf: null,
    checked: false,
    correct: false,
  }));
}

function resultsByNFromSaved(raw: Record<string, "ok" | "no">): Record<number, "ok" | "no"> {
  const out: Record<number, "ok" | "no"> = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = Number(k);
    if (!Number.isNaN(n)) out[n] = v;
  }
  return out;
}

function snapshotGroupAnswers(rows: GroupAnswerState[]): BsGroupAnswerSnapshot[] {
  return rows.map((row) => ({
    picked: row.picked,
    tf: row.tf,
    checked: row.checked,
    correct: row.correct,
  }));
}

function restoreGroupAnswers(
  step: Question | undefined,
  saved?: BsGroupAnswerSnapshot[]
): GroupAnswerState[] {
  const empty = step ? emptyGroupAnswers(step) : [];
  if (!saved?.length) return empty;
  return empty.map((row, i) => {
    const snap = saved[i];
    if (!snap) return row;
    return {
      picked: snap.picked,
      tf: snap.tf,
      checked: snap.checked,
      correct: snap.correct,
    };
  });
}

export default function ExercisesModule({
  lessonId,
  lesson,
  source,
  onDone,
}: {
  lessonId: string;
  lesson: HskLessonPackage;
  source: "textbook" | "workbook";
  onDone: () => void;
}) {
  const base = lesson.audio_base_path;
  const questions = useMemo(() => buildQuestions(lesson, source), [lesson, source]);
  const totalItems = useMemo(() => countGradableItems(questions), [questions]);
  const navEntries = useMemo(() => buildNavEntries(questions), [questions]);

  const [qi, setQi] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [resultsByN, setResultsByN] = useState<Record<number, "ok" | "no">>({});

  const [picked, setPicked] = useState<string | null>(null);
  const [tf, setTf] = useState<boolean | null>(null);
  const [seq, setSeq] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [groupAnswers, setGroupAnswers] = useState<GroupAnswerState[]>([]);

  const hydrateDoneRef = useRef(false);
  const persistReadyRef = useRef(false);
  const skipResetOnceRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const q = questions[qi];
  const totalSteps = questions.length;

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
  }, []);

  function audioUrl(path?: string | null): string | null {
    return resolveLessonPackagePlayableUrl(path, { packageAudioBase: base });
  }

  const startAudio = useCallback(() => {
    const raw =
      q?.kind === "listening_group"
        ? q.audio
        : q && "audio" in q
          ? q.audio
          : null;
    const src = audioUrl(raw);
    if (!src) return;
    stopAudio();
    const a = new Audio(src);
    a.playbackRate = speed;
    audioRef.current = a;
    setPlaying(true);
    const clear = () => setPlaying(false);
    a.onended = () => {
      if (audioRef.current === a) audioRef.current = null;
      clear();
    };
    a.onerror = clear;
    void a.play().catch(clear);
  }, [q, speed, base, stopAudio]);

  function playAudio() {
    if (playing) return stopAudio();
    startAudio();
  }

  function changeSpeed(s: Speed) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  function resetQForStep(stepIndex: number) {
    const step = questions[stepIndex];
    setPicked(null);
    setTf(null);
    setSeq([]);
    setChecked(false);
    setCorrect(false);
    setGroupAnswers(step ? emptyGroupAnswers(step) : []);
    stopAudio();
  }

  function goToStep(stepIndex: number) {
    if (stepIndex < 0 || stepIndex >= totalSteps) return;
    setQi(stepIndex);
  }

  function recordResult(n: number | undefined, ok: boolean) {
    if (n == null) return;
    setResultsByN((prev) => ({ ...prev, [n]: ok ? "ok" : "no" }));
  }

  function advanceFromStep(wasCorrect: number) {
    if (wasCorrect > 0) setScore((s) => s + wasCorrect);
    if (qi < totalSteps - 1) {
      setQi(qi + 1);
    } else {
      stopAudio();
      setDone(true);
      const moduleKey =
        source === "workbook" ? "exercises_workbook" : "exercises_textbook";
      markBsModuleCompleted(lessonId, moduleKey);
    }
  }

  function advanceSingle() {
    advanceFromStep(correct ? 1 : 0);
  }

  function advanceGroup() {
    const gained = groupAnswers.filter((a) => a.checked && a.correct).length;
    if (q.kind === "listening_group") {
      q.items.forEach((item, i) => {
        const state = groupAnswers[i];
        if (state?.checked) recordResult(item.n, state.correct);
      });
    }
    advanceFromStep(gained);
  }

  function pickChoice(opt: string) {
    if (checked || q.kind !== "choice") return;
    const ok = opt === q.answer;
    setPicked(opt);
    setChecked(true);
    setCorrect(ok);
    recordResult(q.n, ok);
  }

  function pickTf(val: boolean) {
    if (checked || q.kind !== "tf") return;
    const ok = val === q.answer;
    setTf(val);
    setChecked(true);
    setCorrect(ok);
    recordResult(q.n, ok);
  }

  function pickChoiceInGroup(index: number, opt: string) {
    if (q.kind !== "listening_group") return;
    const item = q.items[index];
    if (!item || item.kind !== "choice") return;
    const row = groupAnswers[index];
    if (!row || row.checked) return;
    const ok = opt === item.answer;
    if (item.n != null) recordResult(item.n, ok);
    setGroupAnswers((prev) => {
      const next = [...prev];
      next[index] = {
        ...row,
        picked: opt,
        checked: true,
        correct: ok,
      };
      return next;
    });
  }

  function pickTfInGroup(index: number, val: boolean) {
    if (q.kind !== "listening_group") return;
    const item = q.items[index];
    if (!item || item.kind !== "tf") return;
    const row = groupAnswers[index];
    if (!row || row.checked) return;
    const ok = val === item.answer;
    if (item.n != null) recordResult(item.n, ok);
    setGroupAnswers((prev) => {
      const next = [...prev];
      next[index] = {
        ...row,
        tf: val,
        checked: true,
        correct: ok,
      };
      return next;
    });
  }

  function toggleToken(idx: number) {
    if (checked) return;
    setSeq((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  function checkSequence() {
    if (q.kind === "order") {
      const chosenKeys = seq.map((i) => q.keys[i]);
      const ok =
        chosenKeys.length === q.answer.length &&
        chosenKeys.every((k, i) => k === q.answer[i]);
      setChecked(true);
      setCorrect(ok);
      recordResult(q.n, ok);
    } else if (q.kind === "scramble") {
      const built = seq.map((i) => q.tokens[i]).join("");
      const ok = norm(built) === norm(q.answer);
      setChecked(true);
      setCorrect(ok);
      recordResult(q.n, ok);
    }
  }

  function restartExercises() {
    clearBsExercisesProgress(lessonId, source);
    persistReadyRef.current = true;
    skipResetOnceRef.current = true;
    setQi(0);
    setScore(0);
    setDone(false);
    setResultsByN({});
    resetQForStep(0);
  }

  const groupAllChecked =
    q?.kind === "listening_group" &&
    groupAnswers.length === q.items.length &&
    groupAnswers.every((a) => a.checked);

  useEffect(() => () => stopAudio(), [stopAudio]);

  useEffect(() => {
    if (totalSteps === 0 || hydrateDoneRef.current) return;
    hydrateDoneRef.current = true;
    const saved = getBsExercisesProgress(lessonId, source);
    if (saved) {
      const nextQi = Math.min(Math.max(0, saved.qi), totalSteps - 1);
      skipResetOnceRef.current = true;
      setQi(nextQi);
      setScore(saved.score ?? 0);
      setDone(saved.done ?? false);
      setResultsByN(resultsByNFromSaved(saved.resultsByN ?? {}));
      const step = questions[nextQi];
      if (step?.kind === "listening_group") {
        setGroupAnswers(restoreGroupAnswers(step, saved.groupAnswers));
      }
    }
    persistReadyRef.current = true;
  }, [lessonId, source, totalSteps, questions]);

  useEffect(() => {
    if (skipResetOnceRef.current) {
      skipResetOnceRef.current = false;
      return;
    }
    resetQForStep(qi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi]);

  useEffect(() => {
    if (!persistReadyRef.current || totalItems === 0) return;
    const resultsPayload: Record<string, "ok" | "no"> = {};
    for (const [n, v] of Object.entries(resultsByN)) {
      resultsPayload[String(n)] = v;
    }
    saveBsExercisesProgress(lessonId, source, {
      qi,
      score,
      done,
      completed: done,
      totalItems,
      resultsByN: resultsPayload,
      groupAnswers:
        q?.kind === "listening_group" ? snapshotGroupAnswers(groupAnswers) : undefined,
    });
  }, [
    lessonId,
    source,
    qi,
    score,
    done,
    totalItems,
    resultsByN,
    groupAnswers,
    q,
  ]);

  useEffect(() => {
    const step = questions[qi];
    const hasAudio =
      step?.kind === "listening_group"
        ? Boolean(step.audio)
        : step && "audio" in step && Boolean(step.audio);
    if (!hasAudio) return;
    const t = setTimeout(() => startAudio(), 120);
    return () => clearTimeout(t);
  }, [qi, questions, startAudio]);

  if (totalSteps === 0) {
    return (
      <div className="bs-card">
        <div className="bs-soon">
          <div className="bs-soon-ic">🎯</div>
          <p>Энэ хичээлд (энэ хэсэгт) дасгал алга.</p>
        </div>
        <button className="bs-cta" onClick={onDone} style={{ marginTop: 4 }}>
          Дараагийнх →
        </button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / totalItems) * 100);
    return (
      <>
        <div className="bs-card bs-ex">
          <div className="bs-ex-done">
            <div className="bs-ex-done-ic" aria-hidden>
              {pct >= 80 ? "🌟" : pct >= 50 ? "👍" : "💪"}
            </div>
            <div className="bs-ex-done-score">
              {score} / {totalItems}
            </div>
            <div className="bs-ex-done-sub">
              {pct >= 80
                ? "Маш сайн! Бараг бүгдийг зөв хийлээ."
                : pct >= 50
                  ? "Гайгүй байна — дахин давтвал бүр сайжирна."
                  : "Зүгээр ээ, дахин үзээд давтаарай. Чи чадна."}
            </div>
          </div>
        </div>
        <button type="button" className="bs-cta bs-cta-secondary" onClick={restartExercises}>
          Дахин эхлэх
        </button>
        <button className="bs-cta" onClick={onDone}>
          Дараагийнх →
        </button>
      </>
    );
  }

  const hasAudio =
    q.kind === "listening_group"
      ? Boolean(q.audio)
      : q.kind !== "order" && q.kind !== "scramble" && Boolean(q.audio);

  const counterLabel = positionCounterLabel(q, qi, questions);

  return (
    <div className="bs-card bs-ex">
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          {source === "textbook" ? "Дасгал" : "Дасгал (ном)"}
        </div>
        <span className="bs-counter">
          {counterLabel} / {totalItems} · ✓ {score}
        </span>
      </div>

      {navEntries.length > 0 && (
        <nav className="bs-ex-nav" aria-label="Асуултын дугаар — шууд үсрэх">
          {navEntries.map(({ n, qi: stepQi }) => {
            const result = resultsByN[n];
            const isCurrent = stepQi === qi;
            const cls = [
              "bs-ex-nav-btn",
              isCurrent ? "bs-current" : "",
              result === "ok" ? "bs-done-ok" : "",
              result === "no" ? "bs-done-no" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={n}
                type="button"
                className={cls}
                onClick={() => goToStep(stepQi)}
                aria-label={`Асуулт ${n}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {n}
              </button>
            );
          })}
        </nav>
      )}

      <div className="bs-ex-section">{q.section}</div>
      {q.instruction && <div className="bs-ex-instr">{q.instruction}</div>}

      {hasAudio && (
        <div className="bs-ex-audiobar">
          <button
            type="button"
            className={`bs-txt-play ${playing ? "bs-on" : ""}`}
            onClick={playAudio}
            aria-label={playing ? "Зогсоох" : "Сонсох"}
          >
            <span aria-hidden>{playing ? "⏸" : "▶"}</span> Сонсох
          </button>
          <div className="bs-speeds" role="group" aria-label="Сонсох хурд">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className={`bs-speed ${speed === s ? "bs-on" : ""}`}
                onClick={() => changeSpeed(s)}
                aria-pressed={speed === s}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      )}

      {q.kind === "listening_group" && (
        <div className="bs-ex-group">
          {q.items.map((item, index) => {
            const state = groupAnswers[index];
            if (!state) return null;
            return (
              <div key={item.n ?? index} className="bs-ex-group-item">
                {item.n != null && <div className="bs-ex-group-n">Асуулт {item.n}</div>}
                {item.prompt && <div className="bs-ex-prompt">{item.prompt}</div>}
                {item.kind === "choice" && (
                  <div className="bs-ex-opts">
                    {item.options.map((opt, i) => {
                      let cls = "bs-ex-opt";
                      if (state.checked) {
                        if (opt === item.answer) cls += " bs-correct";
                        else if (opt === state.picked) cls += " bs-wrong";
                      }
                      return (
                        <button
                          key={i}
                          type="button"
                          className={cls}
                          onClick={() => pickChoiceInGroup(index, opt)}
                          disabled={state.checked}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
                {item.kind === "tf" && (
                  <div className="bs-ex-tf">
                    {[
                      { v: true, label: "✓ Үнэн" },
                      { v: false, label: "✗ Худал" },
                    ].map(({ v, label }) => {
                      let cls = "bs-ex-opt";
                      if (state.checked) {
                        if (v === item.answer) cls += " bs-correct";
                        else if (v === state.tf) cls += " bs-wrong";
                      }
                      return (
                        <button
                          key={String(v)}
                          type="button"
                          className={cls}
                          onClick={() => pickTfInGroup(index, v)}
                          disabled={state.checked}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {state.checked && (
                  <div className={`bs-ex-fb ${state.correct ? "bs-ok" : "bs-no"}`}>
                    {state.correct ? (
                      <span>✓ Зөв!</span>
                    ) : (
                      <span>
                        ✗ Буруу.{" "}
                        {item.kind === "choice" && <b>Зөв: {item.answer}</b>}
                        {item.kind === "tf" && (
                          <b>Зөв: {item.answer ? "Үнэн" : "Худал"}</b>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {q.kind === "choice" && q.zh && <div className="bs-ex-zh">{q.zh}</div>}

      {(q.kind === "choice" || q.kind === "tf") && q.prompt && (
        <div className="bs-ex-prompt">{q.prompt}</div>
      )}

      {q.kind === "choice" && (
        <div className="bs-ex-opts">
          {q.options.map((opt, i) => {
            let cls = "bs-ex-opt";
            if (checked) {
              if (opt === q.answer) cls += " bs-correct";
              else if (opt === picked) cls += " bs-wrong";
            }
            return (
              <button
                key={i}
                type="button"
                className={cls}
                onClick={() => pickChoice(opt)}
                disabled={checked}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {q.kind === "tf" && (
        <div className="bs-ex-tf">
          {[
            { v: true, label: "✓ Үнэн" },
            { v: false, label: "✗ Худал" },
          ].map(({ v, label }) => {
            let cls = "bs-ex-opt";
            if (checked) {
              if (v === q.answer) cls += " bs-correct";
              else if (v === tf) cls += " bs-wrong";
            }
            return (
              <button
                key={String(v)}
                type="button"
                className={cls}
                onClick={() => pickTf(v)}
                disabled={checked}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {(q.kind === "order" || q.kind === "scramble") && (
        <>
          <div className="bs-ex-prompt">{q.prompt}</div>
          <div className="bs-ex-build">
            {seq.length === 0 && <span className="bs-ex-ph">Доороос товшиж нэмнэ…</span>}
            {seq.map((idx, pos) => (
              <button
                key={pos}
                type="button"
                className="bs-ex-tok bs-built"
                onClick={() => toggleToken(idx)}
                disabled={checked}
              >
                {q.tokens[idx]}
              </button>
            ))}
          </div>
          <div className="bs-ex-pool">
            {q.tokens.map((tok, idx) =>
              seq.includes(idx) ? null : (
                <button
                  key={idx}
                  type="button"
                  className="bs-ex-tok"
                  onClick={() => toggleToken(idx)}
                  disabled={checked}
                >
                  {tok}
                </button>
              )
            )}
          </div>
          {!checked && (
            <button
              type="button"
              className="bs-ex-check"
              onClick={checkSequence}
              disabled={seq.length !== q.tokens.length}
            >
              Шалгах
            </button>
          )}
        </>
      )}

      {q.kind !== "listening_group" && checked && (
        <div className={`bs-ex-fb ${correct ? "bs-ok" : "bs-no"}`}>
          {correct ? (
            <span>✓ Зөв!</span>
          ) : (
            <span>
              ✗ Буруу.{" "}
              {q.kind === "scramble" && <b>Зөв: {q.answer}</b>}
              {q.kind === "order" && <b>Зөв: {q.answer.join(" → ")}</b>}
              {q.kind === "choice" && <b>Зөв: {q.answer}</b>}
              {q.kind === "tf" && <b>Зөв: {q.answer ? "Үнэн" : "Худал"}</b>}
            </span>
          )}
        </div>
      )}

      {q.kind !== "listening_group" && checked && (
        <button className="bs-cta" onClick={advanceSingle} style={{ marginTop: 12 }}>
          {qi === totalSteps - 1 ? "Дүн харах →" : "Дараагийнх →"}
        </button>
      )}

      {q.kind === "listening_group" && groupAllChecked && (
        <button className="bs-cta" onClick={advanceGroup} style={{ marginTop: 12 }}>
          {qi === totalSteps - 1 ? "Дүн харах →" : "Дараагийнх →"}
        </button>
      )}
    </div>
  );
}
