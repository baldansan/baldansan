"use client";
// components/lesson/modules/ExercisesModule.tsx
// "exercises_textbook" / "exercises_workbook" модуль — интерактив дасгал.
// Олон төрлийн дасгалыг НЭГ жагсаалт болгож хувиргаад, нэгээр нь үзүүлнэ:
//   • choice  — сонголт (үг нөхөх, үг сонгох, унших ойлголт, сонсголын сонголт)
//   • tf      — үнэн/худал (сонсголын баталгаажуулалт)
//   • order   — A/B/C хэсгийг зөв дараалалд өрөх
//   • scramble— үгсийг эвлүүлж өгүүлбэр болгох
// Бүтцийг ЭНД тодорхойлсон тул types/lesson.ts-г өөрчлөх ШААРДЛАГАГҮЙ.
// Гэрээ: { lesson, source, onDone }. source = "textbook" | "workbook".

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "@/types/lesson";
import "./exercises-module.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

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
      kind: "order";
      n?: number;
      section: string;
      instruction?: string;
      prompt: string;
      tokens: string[]; // харагдах текстүүд (A,B,C-ийн агуулга)
      keys: string[]; // тэдгээрийн түлхүүр (A,B,C)
      answer: string[]; // зөв түлхүүрийн дараалал
    }
  | {
      kind: "scramble";
      n?: number;
      section: string;
      instruction?: string;
      prompt: string;
      tokens: string[]; // холисон үгс
      answer: string; // зөв бүтэн өгүүлбэр
    };

/* ---------- туслах функцууд ---------- */
function valuesOf(o: unknown): { values: string[]; byKey: Record<string, string> } {
  if (Array.isArray(o)) {
    const values = o.map((x) => String(x));
    const byKey: Record<string, string> = {};
    return { values, byKey };
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

/* ---------- хувиргалт (нэг бүтэц) ---------- */
function buildQuestions(lesson: Lesson, source: "textbook" | "workbook"): Question[] {
  const out: Question[] = [];
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
      // retell — нээлттэй ярих дасгал, автоматаар шалгах боломжгүй тул орхив
    } else {
      const wb = lesson.exercises_workbook as any;

      // Сонсгол
      for (const part of wb?.listening?.parts ?? []) {
        const instruction = part?.instruction_mn;
        const sharedAudio = part?.shared_audio;
        for (const it of part?.items ?? []) {
          const audio = it?.audio ?? sharedAudio;
          if (it?.options != null) {
            const { values, byKey } = valuesOf(it.options);
            out.push({
              kind: "choice",
              n: it.n,
              section: "Сонсгол",
              instruction,
              audio,
              prompt: it?.statement_zh ? String(it.statement_zh) : "Сонссоноо сонгоорой:",
              options: values,
              answer: resolveAns(it.answer, byKey),
            });
          } else if (it?.statement_zh != null) {
            out.push({
              kind: "tf",
              n: it.n,
              section: "Сонсгол",
              instruction,
              audio,
              prompt: String(it.statement_zh),
              answer: toBool(it.answer),
            });
          }
        }
      }

      // Унших — үг сонгох
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

      // Унших — дараалал
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

      // Унших — ойлголт
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

      // Бичих — өгүүлбэр эвлүүлэх
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

function questionLabel(q: Question, index: number): number {
  return q.n != null && Number.isFinite(Number(q.n)) ? Number(q.n) : index + 1;
}

type QuestionState = {
  picked: string | null;
  tf: boolean | null;
  seq: number[];
  checked: boolean;
  correct: boolean;
};

function emptyQuestionState(): QuestionState {
  return { picked: null, tf: null, seq: [], checked: false, correct: false };
}

/* ---------- модуль ---------- */
export default function ExercisesModule({
  lesson,
  source,
  onDone,
}: {
  lesson: Lesson;
  source: "textbook" | "workbook";
  onDone: () => void;
}) {
  const base = lesson.audio_base_path;
  const questions = useMemo(() => buildQuestions(lesson, source), [lesson, source]);

  const [qi, setQi] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  /** Асуулт бүрийн хариултын төлөв (чөлөөт үсрэлтэд хадгална). */
  const [states, setStates] = useState<Record<number, QuestionState>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const q = questions[qi];
  const total = questions.length;
  const cur = states[qi] ?? emptyQuestionState();
  const { picked, tf, seq, checked, correct } = cur;

  const score = useMemo(
    () => Object.values(states).filter((s) => s.checked && s.correct).length,
    [states]
  );

  const patchCur = useCallback((patch: Partial<QuestionState>) => {
    setStates((prev) => ({
      ...prev,
      [qi]: { ...(prev[qi] ?? emptyQuestionState()), ...patch },
    }));
  }, [qi]);

  /* ----- аудио (сонсголын файл) ----- */
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
  }, []);

  const jumpTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= total || index === qi) return;
      stopAudio();
      setQi(index);
    },
    [qi, total, stopAudio]
  );

  function audioUrl(path?: string | null): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const b = (base ?? "").replace(/\/+$/, "");
    const p = path.replace(/^\/+/, "");
    return b ? `${b}/${p}` : p;
  }

  function playAudio() {
    const src = q && "audio" in q ? audioUrl(q.audio) : null;
    if (!src) return;
    if (playing) return stopAudio();
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
  }
  function changeSpeed(s: Speed) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  function advance() {
    if (qi < total - 1) {
      stopAudio();
      setQi(qi + 1);
    } else {
      stopAudio();
      setDone(true);
    }
  }

  /* ----- choice ----- */
  function pickChoice(opt: string) {
    if (checked || !q) return;
    const ok = opt === (q as Extract<Question, { kind: "choice" }>).answer;
    patchCur({ picked: opt, checked: true, correct: ok });
  }
  /* ----- tf ----- */
  function pickTf(val: boolean) {
    if (checked || !q) return;
    const ok = val === (q as Extract<Question, { kind: "tf" }>).answer;
    patchCur({ tf: val, checked: true, correct: ok });
  }
  /* ----- order / scramble: токен өр/хас ----- */
  function toggleToken(idx: number) {
    if (checked) return;
    const next = seq.includes(idx) ? seq.filter((i) => i !== idx) : [...seq, idx];
    patchCur({ seq: next });
  }
  function checkSequence() {
    if (!q || checked) return;
    if (q.kind === "order") {
      const chosenKeys = seq.map((i) => q.keys[i]);
      const ok =
        chosenKeys.length === q.answer.length &&
        chosenKeys.every((k, i) => k === q.answer[i]);
      patchCur({ checked: true, correct: ok });
    } else if (q.kind === "scramble") {
      const built = seq.map((i) => q.tokens[i]).join("");
      const ok = norm(built) === norm(q.answer);
      patchCur({ checked: true, correct: ok });
    }
  }

  function navBtnClass(index: number): string {
    const st = states[index];
    let cls = "bs-ex-nav-btn";
    if (index === qi) cls += " bs-current";
    if (st?.checked) {
      cls += st.correct ? " bs-done-ok" : " bs-done-no";
    } else if (st && (st.picked != null || st.tf != null || st.seq.length > 0)) {
      cls += " bs-started";
    }
    return cls;
  }

  useEffect(() => () => stopAudio(), [stopAudio]); // unmount cleanup

  /* ----- дасгал алга ----- */
  if (total === 0) {
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

  /* ----- төгсгөлийн оноо ----- */
  if (done) {
    const pct = Math.round((score / total) * 100);
    return (
      <>
        <div className="bs-card bs-ex">
          <div className="bs-ex-done">
            <div className="bs-ex-done-ic" aria-hidden>
              {pct >= 80 ? "🌟" : pct >= 50 ? "👍" : "💪"}
            </div>
            <div className="bs-ex-done-score">
              {score} / {total}
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
        <button className="bs-cta" onClick={onDone}>
          Дараагийнх →
        </button>
      </>
    );
  }

  const hasAudio = q.kind !== "order" && q.kind !== "scramble" && Boolean(q.audio);

  return (
    <div className="bs-card bs-ex">
      {/* Толгой: хэсэг + тоологч + оноо */}
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          {source === "textbook" ? "Дасгал" : "Дасгал (ном)"}
        </div>
        <span className="bs-counter">
          {questionLabel(q, qi)} · {qi + 1}/{total} · ✓ {score}
        </span>
      </div>

      <nav className="bs-ex-nav" aria-label="Асуултын дугаар — шууд үсрэх">
        {questions.map((item, index) => (
          <button
            key={index}
            type="button"
            className={navBtnClass(index)}
            onClick={() => jumpTo(index)}
            aria-label={`Асуулт ${questionLabel(item, index)}`}
            aria-current={index === qi ? "true" : undefined}
          >
            {questionLabel(item, index)}
          </button>
        ))}
      </nav>

      <div className="bs-ex-section">{q.section}</div>
      {q.instruction && <div className="bs-ex-instr">{q.instruction}</div>}

      {/* Сонсголын аудио */}
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

      {/* Унших ойлголтын эх */}
      {q.kind === "choice" && q.zh && <div className="bs-ex-zh">{q.zh}</div>}

      {/* Асуултын текст */}
      {(q.kind === "choice" || q.kind === "tf") && q.prompt && (
        <div className="bs-ex-prompt">{q.prompt}</div>
      )}

      {/* === choice === */}
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

      {/* === tf === */}
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

      {/* === order / scramble === */}
      {(q.kind === "order" || q.kind === "scramble") && (
        <>
          <div className="bs-ex-prompt">{q.prompt}</div>

          {/* Угсарсан хариу */}
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

          {/* Үлдсэн токенууд */}
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

      {/* Хариултын дараах эргэх холбоо */}
      {checked && (
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

      {/* Дараагийнх */}
      {checked && (
        <button className="bs-cta" onClick={advance} style={{ marginTop: 12 }}>
          {qi === total - 1 ? "Дүн харах →" : "Дараагийнх →"}
        </button>
      )}
    </div>
  );
}
