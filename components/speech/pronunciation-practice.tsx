"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  parsePinyinSyllables,
  toneContour,
  TONE_LABELS_MN,
} from "@/lib/speech/pinyin-tones";
import {
  smoothPitch,
  startPitchRecorder,
  type PitchRecorderHandle,
  type PitchSample,
} from "@/lib/speech/pitch-recorder";

/* ---- Web Speech API (recognition) — TS-д стандарт төрөл байхгүй ---- */
type SpeechRecognitionResultLike = {
  transcript: string;
};
type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/* ---- Харьцуулалт ---- */

function cjkOnly(value: string): string {
  return (value.match(/[㐀-鿿豈-﫿]/g) ?? []).join("");
}

type Verdict = "perfect" | "close" | "wrong";

function judge(target: string, alternatives: string[]): {
  verdict: Verdict;
  heard: string;
} {
  const t = cjkOnly(target);
  let best: { verdict: Verdict; heard: string; score: number } = {
    verdict: "wrong",
    heard: alternatives[0] ?? "",
    score: -1,
  };
  for (const alt of alternatives) {
    const a = cjkOnly(alt);
    if (!a) continue;
    if (a === t || a.includes(t) || (t.length > 1 && t.includes(a) && a.length >= t.length - 0)) {
      if (a === t || a.includes(t)) {
        return { verdict: "perfect", heard: alt };
      }
    }
    const tChars = new Set(t.split(""));
    let overlap = 0;
    for (const ch of a) if (tChars.has(ch)) overlap++;
    const score = t.length > 0 ? overlap / t.length : 0;
    if (score > best.score) {
      best = {
        verdict: score >= 0.5 ? "close" : "wrong",
        heard: alt,
        score,
      };
    }
  }
  return { verdict: best.verdict, heard: best.heard };
}

/* ---- Аялгын муруй зурах ---- */

function drawContours(
  canvas: HTMLCanvasElement,
  pinyin: string | null | undefined,
  samples: PitchSample[]
) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 300;
  const cssH = canvas.clientHeight || 96;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  const padX = 8;
  const padY = 10;
  const plotW = cssW - padX * 2;
  const plotH = cssH - padY * 2;
  // Chao 1..5 → y координат
  const chaoY = (v: number) => padY + plotH * (1 - (v - 1) / 4);

  // 1) Жишиг муруйнууд — үе бүрд саарал тасархай
  const syllables = pinyin ? parsePinyinSyllables(pinyin) : [];
  if (syllables.length > 0) {
    const segW = plotW / syllables.length;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#94a3b8";
    ctx.fillStyle = "#64748b";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    syllables.forEach((syl, i) => {
      const points = toneContour(syl.tone);
      const x0 = padX + segW * i + segW * 0.12;
      const x1 = padX + segW * (i + 1) - segW * 0.12;
      ctx.beginPath();
      points.forEach((p, k) => {
        const x = x0 + ((x1 - x0) * k) / (points.length - 1);
        const y = chaoY(p);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillText(syl.syllable, padX + segW * i + segW / 2, cssH - 1);
      if (i > 0) {
        ctx.save();
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(padX + segW * i, padY);
        ctx.lineTo(padX + segW * i, padY + plotH);
        ctx.stroke();
        ctx.restore();
      }
    });
    ctx.setLineDash([]);
  }

  // 2) Хэрэглэгчийн муруй — ногоон
  const voiced = smoothPitch(samples);
  if (voiced.length >= 3) {
    const semis = voiced.map((s) => 12 * Math.log2(s.f0 / 100));
    let lo = Math.min(...semis);
    let hi = Math.max(...semis);
    if (hi - lo < 4) {
      // хэт нам хэлбэлзэлтэй бол мужийг өргөсгөж голлуулна
      const mid = (hi + lo) / 2;
      lo = mid - 2;
      hi = mid + 2;
    }
    const t0 = voiced[0].t;
    const t1 = voiced[voiced.length - 1].t;
    const span = Math.max(t1 - t0, 0.15);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#059669";
    ctx.lineJoin = "round";
    ctx.beginPath();
    let started = false;
    let prevT = t0;
    for (let i = 0; i < voiced.length; i++) {
      const s = voiced[i];
      const x = padX + (plotW * (s.t - t0)) / span;
      const chao = 1 + (4 * (semis[i] - lo)) / (hi - lo);
      const y = chaoY(chao);
      // 250мс-ээс урт завсар — шинэ хэсэг (үг хоорондын зай)
      if (!started || s.t - prevT > 0.25) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
      prevT = s.t;
    }
    ctx.stroke();
  }
}

/* ---- Компонент ---- */

type Phase = "idle" | "listening" | "done" | "unsupported" | "denied";

type Props = {
  /** Дуудах хятад үг (симп.) */
  text: string;
  pinyin?: string | null;
  className?: string;
};

const LISTEN_TIMEOUT_MS = 5000;

export function PronunciationPractice({ text, pinyin, className }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [heard, setHeard] = useState<string>("");
  const [hasPitch, setHasPitch] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const pitchRef = useRef<PitchRecorderHandle | null>(null);
  const samplesRef = useRef<PitchSample[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const gotResultRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Үг солигдоход бүгдийг цэвэрлэнэ
  useEffect(() => {
    setPhase("idle");
    setVerdict(null);
    setHeard("");
    setHasPitch(false);
    samplesRef.current = [];
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const cleanup = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (pitchRef.current) {
      samplesRef.current = pitchRef.current.stop();
      pitchRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pitchRef.current) {
      samplesRef.current = pitchRef.current.stop();
      pitchRef.current = null;
    }
    setHasPitch(samplesRef.current.length >= 3);
    setPhase("done");
  }, []);

  const start = useCallback(async () => {
    setVerdict(null);
    setHeard("");
    gotResultRef.current = false;
    samplesRef.current = [];

    const Ctor = getRecognitionCtor();
    const hasMedia =
      typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

    if (!Ctor && !hasMedia) {
      setPhase("unsupported");
      return;
    }
    setRecognitionAvailable(Boolean(Ctor));

    // Аялгын муруйд — микрофон
    if (hasMedia) {
      try {
        pitchRef.current = await startPitchRecorder();
      } catch {
        pitchRef.current = null;
        if (!Ctor) {
          setPhase("denied");
          return;
        }
      }
    }

    // Ярианы таних
    if (Ctor) {
      try {
        const rec = new Ctor();
        rec.lang = "zh-CN";
        rec.interimResults = false;
        rec.maxAlternatives = 5;
        rec.continuous = false;
        rec.onresult = (event) => {
          gotResultRef.current = true;
          const alts: string[] = [];
          const result = event.results[0];
          for (let i = 0; i < result.length; i++) {
            alts.push(result[i].transcript);
          }
          const j = judge(text, alts);
          setVerdict(j.verdict);
          setHeard(j.heard);
        };
        rec.onerror = (event) => {
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            cleanup();
            setPhase("denied");
            return;
          }
          finish();
        };
        rec.onend = () => {
          recognitionRef.current = null;
          finish();
        };
        recognitionRef.current = rec;
        rec.start();
      } catch {
        recognitionRef.current = null;
      }
    }

    setPhase("listening");

    // Таних систем удаан/дуугүй бол өөрсдөө зогсооно
    timeoutRef.current = window.setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          finish();
        }
      } else {
        finish();
      }
    }, LISTEN_TIMEOUT_MS);
  }, [text, cleanup, finish]);

  // done болоход муруй зурна
  useEffect(() => {
    if (phase !== "done") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawContours(canvas, pinyin, samplesRef.current);
  }, [phase, pinyin, hasPitch]);

  const syllables = pinyin ? parsePinyinSyllables(pinyin) : [];
  const toneHints = syllables
    .filter((s) => s.tone > 0 || syllables.length <= 3)
    .map((s) => `${s.syllable} — ${TONE_LABELS_MN[s.tone] ?? ""}`);

  if (phase === "unsupported") {
    return (
      <div className={className}>
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
          Энэ хөтөч дуу таних боломж дэмжихгүй байна. Chrome (Android) дээр
          туршаад үзээрэй.
        </p>
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <div className={className}>
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
          Микрофоны зөвшөөрөл хэрэгтэй — хөтчийн тохиргооноос зөвшөөрөөд дахин
          дараарай.
        </p>
        <button
          type="button"
          onClick={() => void start()}
          className="mt-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
        >
          🎤 Дахин оролдох
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {phase === "idle" ? (
        <button
          type="button"
          onClick={() => void start()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
        >
          🎤 Дагаж хэлээд шалгуулах
        </button>
      ) : null}

      {phase === "listening" ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
          </span>
          <span className="text-sm font-bold text-rose-600">
            Сонсож байна — «{text}» гэж хэлээрэй
          </span>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="rounded-2xl border border-[var(--app-border,#e2e8f0)] bg-white p-3">
          {recognitionAvailable ? (
            verdict === "perfect" ? (
              <p className="text-sm font-bold text-emerald-600">
                ✅ Маш сайн! «{text}» гэж зөв сонсогдлоо
              </p>
            ) : verdict === "close" ? (
              <p className="text-sm font-bold text-amber-600">
                🟡 Ойрхон байна — надад «{heard}» гэж сонсогдлоо
              </p>
            ) : heard ? (
              <p className="text-sm font-bold text-rose-600">
                ❌ Надад «{heard}» гэж сонсогдлоо — дахиад сонсоод давтаарай
              </p>
            ) : (
              <p className="text-sm font-bold text-slate-500">
                🤔 Дуу сонсогдсонгүй — микрофондоо ойртож тод хэлээрэй
              </p>
            )
          ) : (
            <p className="text-xs font-semibold text-slate-500">
              (Энэ хөтөч үг таних дэмжихгүй тул зөвхөн аялгын муруй харуулав)
            </p>
          )}

          {hasPitch ? (
            <>
              <canvas
                ref={canvasRef}
                className="mt-2 h-24 w-full"
                aria-label="Аялгын муруй"
              />
              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                Саарал тасархай = жишиг аялга · Ногоон = таны дуу
              </p>
            </>
          ) : null}

          {toneHints.length > 0 ? (
            <p className="mt-1.5 text-[11px] font-semibold text-slate-500">
              {toneHints.join(" · ")}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void start()}
            className="mt-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
          >
            🎤 Дахин хэлэх
          </button>
        </div>
      ) : null}
    </div>
  );
}
