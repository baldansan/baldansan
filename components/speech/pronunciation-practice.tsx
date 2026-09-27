"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { parsePinyinSyllables } from "@/lib/speech/pinyin-tones";
import {
  normalizeToChao,
  scoreTones,
  splitContours,
  templateContour,
  applyToneSandhi,
  type ChaoPoint,
  type SyllableScore,
  type ToneScoreResult,
} from "@/lib/speech/tone-score";
import {
  pitchTrackFromBuffer,
  startPitchRecorder,
  type PitchRecorderHandle,
  type PitchSample,
} from "@/lib/speech/pitch-recorder";
import { buildAudioCmnUrl, buildHsk30AudioUrl } from "@/lib/tts/audio-cmn";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import { playSyllable, stopSyllable } from "@/lib/pronunciation/syllable-player";

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
  return (value.match(/[㐀-鿿豈-﫿]/g) ?? []).join("");
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
    if (a === t || a.includes(t)) {
      return { verdict: "perfect", heard: alt };
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

/* ---- Жишиг муруй: хүний аудионоос ---- */

const refCache = new Map<string, Promise<number[][] | null>>();

async function decodeToPitch(url: string): Promise<PitchSample[]> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  type AudioContextCtor = typeof AudioContext;
  const Ctx: AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: AudioContextCtor }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(buf);
    const data = decoded.getChannelData(0);
    return pitchTrackFromBuffer(data, decoded.sampleRate);
  } finally {
    void ctx.close().catch(() => undefined);
  }
}

/** Үгийн хүний mp3 → үе бүрийн Chao муруй. Алдаа бол null (чимээгүй fallback). */
function loadReferenceContours(urls: string[], n: number): Promise<number[][] | null> {
  const key = `${urls.join("|")}#${n}`;
  let p = refCache.get(key);
  if (!p) {
    p = (async () => {
      for (const url of urls) {
        try {
          const samples = await decodeToPitch(url);
          const contours = splitContours(samples, n);
          if (contours) return contours;
        } catch {
          // дараагийн url
        }
      }
      return null;
    })();
    refCache.set(key, p);
  }
  return p;
}

/* ---- Нэг график: Chao тор + үеийн багана, жишиг + хэрэглэгч давхар ---- */

type Column = {
  label: string;
  ref: number[];
  user: number[] | null;
  bad: boolean;
};

const PAD_L = 18;
const PAD_R = 6;
const PAD_T = 8;
const PAD_B = 18;

function setupCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 300;
  const cssH = canvas.clientHeight || 120;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);
  return { ctx, cssW, cssH };
}

function drawGrid(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
  const plotH = cssH - PAD_T - PAD_B;
  const chaoY = (v: number) => PAD_T + plotH * (1 - (v - 1) / 4);
  ctx.font = "600 9px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let v = 1; v <= 5; v++) {
    const y = chaoY(v);
    ctx.strokeStyle = "#e8edf0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD_L, y);
    ctx.lineTo(cssW - PAD_R, y);
    ctx.stroke();
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(String(v), PAD_L - 4, y);
  }
  return chaoY;
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  points: number[],
  x0: number,
  x1: number,
  chaoY: (v: number) => number,
  style: { color: string; width: number }
) {
  if (points.length < 2) return;
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((p, k) => {
    const x = x0 + ((x1 - x0) * k) / (points.length - 1);
    const y = chaoY(p);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawToneChart(canvas: HTMLCanvasElement, columns: Column[], live?: ChaoPoint[]) {
  const s = setupCanvas(canvas);
  if (!s) return;
  const { ctx, cssW, cssH } = s;
  const plotW = cssW - PAD_L - PAD_R;
  const plotH = cssH - PAD_T - PAD_B;
  const n = Math.max(1, columns.length);
  const colW = plotW / n;

  // амбер дэвсгэр — алдаатай багана
  columns.forEach((c, i) => {
    if (!c.bad) return;
    ctx.fillStyle = "rgba(251, 191, 36, 0.14)";
    ctx.fillRect(PAD_L + colW * i, PAD_T, colW, plotH);
  });

  const chaoY = drawGrid(ctx, cssW, cssH);

  // багана хоорондын зураас + шошго
  ctx.font = "700 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  columns.forEach((c, i) => {
    const x0 = PAD_L + colW * i + colW * 0.14;
    const x1 = PAD_L + colW * (i + 1) - colW * 0.14;
    if (i > 0) {
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(PAD_L + colW * i, PAD_T);
      ctx.lineTo(PAD_L + colW * i, PAD_T + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    drawLine(ctx, c.ref, x0, x1, chaoY, { color: "#94a3b8", width: 2 });
    if (c.user) drawLine(ctx, c.user, x0, x1, chaoY, { color: "#059669", width: 3.5 });
    ctx.fillStyle = c.bad ? "#b45309" : "#475569";
    ctx.fillText(c.label, PAD_L + colW * i + colW / 2, cssH - 4);
  });

  // амьд муруй — хугацаагаар зүүнээс баруун тийш ургана
  if (live && live.length >= 2) {
    const t0 = live[0].t;
    const tLast = live[live.length - 1].t;
    const span = Math.max(tLast - t0, 1.2);
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 3.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    let prev = t0;
    live.forEach((p, i) => {
      const x = PAD_L + (plotW * (p.t - t0)) / span;
      const y = chaoY(p.chao);
      if (i === 0 || p.t - prev > 0.25) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      prev = p.t;
    });
    ctx.stroke();
  }
}

/* ---- Компонент ---- */

type Phase = "idle" | "listening" | "done" | "unsupported" | "denied";

type Props = {
  /** Дуудах хятад үг (симп.) — эсвэл `mode="pitch"` үед пиньинь ч болно */
  text: string;
  pinyin?: string | null;
  className?: string;
  /** "pitch" — таних системгүй, зөвхөн аялгын хэмжигч (ганц үе, самбар) */
  mode?: "auto" | "pitch";
  /** Жишиг аудио (хүний mp3). Өгөхгүй бол audio-cmn / HSK 3.0 url-ээс хайна. */
  audioUrl?: string | null;
  /** Доод талд «🎤 Дуудлагын дасгал» холбоос (үндсэн: харуулна) */
  sectionLink?: boolean;
  /** Оролдлого дуусахад (таних + аялгын оноо) — өдрийн дасгал зэрэгт оноо өгөхөд */
  onDone?: (info: { verdict: Verdict | null; result: ToneScoreResult | null }) => void;
};

const LISTEN_TIMEOUT_MS = 5000;
const PITCH_ONLY_MS = 3000;
/** Зарим Android утсан дээр таних систем + хэмжигч микрофоныг зэрэг авч чаддаггүй. */
const CONFLICT_KEY = "buunduu-pron-mic-conflict-v1";

type RoundMode = "both" | "rec" | "pitch";

function readConflictFlag(): boolean {
  try {
    return localStorage.getItem(CONFLICT_KEY) === "1";
  } catch {
    return false;
  }
}

function statusIcon(s: SyllableScore): string {
  if (s.status === "ok") return "✓";
  if (s.status === "warn") return "⚠";
  if (s.status === "skip") return "·";
  return "✗";
}

export function PronunciationPractice({
  text,
  pinyin,
  className,
  mode = "auto",
  audioUrl,
  sectionLink = true,
  onDone,
}: Props) {
  const locale = useUiLocale();
  const [phase, setPhase] = useState<Phase>("idle");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [heard, setHeard] = useState<string>("");
  const [result, setResult] = useState<ToneScoreResult | null>(null);
  const [recognitionAvailable, setRecognitionAvailable] = useState(true);
  const [roundMode, setRoundMode] = useState<RoundMode>("both");
  const [conflictJustDetected, setConflictJustDetected] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [refState, setRefState] = useState<{ key: string; contours: number[][] } | null>(null);
  const [playing, setPlaying] = useState<"ref" | "mine" | null>(null);
  const [prevText, setPrevText] = useState(text);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const pitchRef = useRef<PitchRecorderHandle | null>(null);
  const samplesRef = useRef<PitchSample[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const pitchDelayRef = useRef<number | null>(null);
  const gotResultRef = useRef(false);
  const roundModeRef = useRef<RoundMode>("both");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const recordingUrlRef = useRef<string | null>(null);
  const myAudioRef = useRef<HTMLAudioElement | null>(null);
  const listeningRef = useRef(false);
  const verdictRef = useRef<Verdict | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const syllables = useMemo(
    () => (pinyin ? applyToneSandhi(parsePinyinSyllables(pinyin)) : []),
    [pinyin]
  );
  const nSyl = syllables.length;
  const refKey = `${text}|${audioUrl ?? ""}|${nSyl}`;
  const refContours = refState && refState.key === refKey ? refState.contours : null;

  // Үг солигдоход төлөвийг render дундаа шинэчилнэ (adjusting state on prop change)
  if (prevText !== text) {
    setPrevText(text);
    setPhase("idle");
    setVerdict(null);
    setHeard("");
    setResult(null);
    setPlaying(null);
  }

  const cleanup = useCallback(() => {
    listeningRef.current = false;
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pitchDelayRef.current != null) {
      window.clearTimeout(pitchDelayRef.current);
      pitchDelayRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

  // Үг солигдох / unmount үед бичлэг, дууг зогсооно
  useEffect(() => {
    samplesRef.current = [];
    return () => {
      cleanup();
      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current);
        recordingUrlRef.current = null;
      }
      stopSyllable();
    };
  }, [text, cleanup]);

  // Жишиг муруй — хүний аудионоос (байхгүй бол загвар)
  useEffect(() => {
    if (nSyl === 0) return;
    const urls = audioUrl
      ? [audioUrl]
      : cjkOnly(text)
        ? [buildAudioCmnUrl(text), buildHsk30AudioUrl(text)]
        : [];
    if (urls.length === 0) return;
    let alive = true;
    void loadReferenceContours(urls, nSyl).then((c) => {
      if (alive && c) setRefState({ key: refKey, contours: c });
    });
    return () => {
      alive = false;
    };
  }, [text, audioUrl, nSyl, refKey]);

  const finish = useCallback(() => {
    listeningRef.current = false;
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pitchDelayRef.current != null) {
      window.clearTimeout(pitchDelayRef.current);
      pitchDelayRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pitchRef.current) {
      const handle = pitchRef.current;
      samplesRef.current = handle.stop();
      pitchRef.current = null;
      void handle.recording.then((blob) => {
        if (recordingUrlRef.current) {
          URL.revokeObjectURL(recordingUrlRef.current);
          recordingUrlRef.current = null;
        }
        if (blob) {
          const url = URL.createObjectURL(blob);
          recordingUrlRef.current = url;
          setRecordingUrl(url);
        } else {
          setRecordingUrl(null);
        }
      });
    }
    const scored = pinyin ? scoreTones(samplesRef.current, pinyin) : null;
    setResult(scored);
    onDoneRef.current?.({ verdict: verdictRef.current, result: scored });

    // Зөрчил илрүүлэх: дуу бичигдсэн атлаа таних систем юу ч сонсоогүй бол
    // энэ төхөөрөмж дээр микрофоныг хуваалцаж чадахгүй гэж үзээд
    // дараагийн оролдлогуудыг таних-л горимд шилжүүлнэ.
    if (
      roundModeRef.current === "both" &&
      !gotResultRef.current &&
      samplesRef.current.length >= 5
    ) {
      try {
        localStorage.setItem(CONFLICT_KEY, "1");
      } catch {
        // ignore
      }
      setConflictJustDetected(true);
    }

    setPhase("done");
  }, [pinyin]);

  const start = useCallback(
    async (wanted?: RoundMode) => {
      verdictRef.current = null;
      setVerdict(null);
      setHeard("");
      setResult(null);
      setConflictJustDetected(false);
      setPlaying(null);
      stopSyllable();
      gotResultRef.current = false;
      samplesRef.current = [];

      const Ctor = mode === "pitch" ? null : getRecognitionCtor();
      const hasMedia =
        typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

      if (!Ctor && !hasMedia) {
        setPhase("unsupported");
        return;
      }
      setRecognitionAvailable(Boolean(Ctor));

      // Горим: зөрчилтэй төхөөрөмж дээр таних + хэмжигчийг зэрэг ажиллуулахгүй
      const rm: RoundMode =
        wanted === "pitch" || !Ctor
          ? "pitch"
          : readConflictFlag()
            ? "rec"
            : "both";
      roundModeRef.current = rm;
      setRoundMode(rm);

      // Зөвхөн аялга хэмжих горим — таних системгүй, 3 секунд бичнэ
      if (rm === "pitch") {
        if (!hasMedia) {
          setPhase("unsupported");
          return;
        }
        try {
          pitchRef.current = await startPitchRecorder({ record: true });
        } catch {
          setPhase("denied");
          return;
        }
        listeningRef.current = true;
        setPhase("listening");
        timeoutRef.current = window.setTimeout(() => finish(), PITCH_ONLY_MS);
        return;
      }

      // Ярианы таних (эхэлж микрофоныг таних системд өгнө)
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
            const r = event.results[0];
            for (let i = 0; i < r.length; i++) {
              alts.push(r[i].transcript);
            }
            const j = judge(text, alts);
            verdictRef.current = j.verdict;
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

      // «both» горимд хэмжигчийг таних систем эхэлснээс хойш жаахан
      // хоцроож асаана — микрофоныг таних системд түрүүлж өгнө.
      if (rm === "both" && hasMedia) {
        pitchDelayRef.current = window.setTimeout(() => {
          pitchDelayRef.current = null;
          void startPitchRecorder({ record: true })
            .then((handle) => {
              if (listeningRef.current) pitchRef.current = handle;
              else handle.stop(); // таних систем аль хэдийн дууссан — микрофоныг суллана
            })
            .catch(() => {
              pitchRef.current = null;
            });
        }, 300);
      }

      listeningRef.current = true;
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
    },
    [text, mode, cleanup, finish]
  );

  const columnsFor = useCallback(
    (res: ToneScoreResult | null): Column[] =>
      syllables.map((s, i) => {
        const sc = res?.syllables[i];
        return {
          label: s.syllable,
          ref: refContours?.[i] ?? templateContour(s.tone),
          user: sc && sc.contour.length > 0 ? sc.contour : null,
          bad: !!sc && !res?.empty && (sc.status === "warn" || sc.status === "bad"),
        };
      }),
    [syllables, refContours]
  );

  // Бичлэгийн явцад амьд зурах
  useEffect(() => {
    if (phase !== "listening") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cols = columnsFor(null);
    const tick = () => {
      const samples = pitchRef.current?.peek() ?? [];
      const live = samples.length >= 2 ? normalizeToChao(samples).points : undefined;
      drawToneChart(canvas, cols, live);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [phase, columnsFor]);

  // done болоход эцсийн график
  useEffect(() => {
    if (phase !== "done") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawToneChart(canvas, columnsFor(result));
  }, [phase, result, columnsFor]);

  const playReference = useCallback(async () => {
    setPlaying("ref");
    try {
      if (audioUrl) await playSyllable(audioUrl);
      else await playChineseWordAudio(text);
    } finally {
      setPlaying(null);
    }
  }, [audioUrl, text]);

  const playMine = useCallback(() => {
    if (!recordingUrl) return;
    stopSyllable();
    if (myAudioRef.current) {
      myAudioRef.current.pause();
    }
    const a = new Audio(recordingUrl);
    myAudioRef.current = a;
    setPlaying("mine");
    a.onended = () => setPlaying(null);
    a.onerror = () => setPlaying(null);
    void a.play().catch(() => setPlaying(null));
  }, [recordingUrl]);

  const link = sectionLink ? (
    <Link
      href="/pronunciation"
      className="mt-2 block text-center text-[11px] font-semibold text-emerald-700"
    >
      {tr(locale, "🎤 Дуудлагын дасгал")} ›
    </Link>
  ) : null;

  if (phase === "unsupported") {
    return (
      <div className={className}>
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
          {tr(
            locale,
            "Энэ хөтөч дуу таних боломж дэмжихгүй байна. Chrome (Android) дээр туршаад үзээрэй."
          )}
        </p>
        {link}
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <div className={className}>
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
          {tr(
            locale,
            "Микрофоны зөвшөөрөл хэрэгтэй — хөтчийн тохиргооноос зөвшөөрөөд дахин дараарай."
          )}
        </p>
        <button
          type="button"
          onClick={() => void start()}
          className="mt-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
        >
          {tr(locale, "🎤 Дахин оролдох")}
        </button>
        {link}
      </div>
    );
  }

  const summary = (() => {
    if (!result || result.total === 0 || result.empty) return null;
    if (result.correct === result.total) return `${result.correct}/${result.total} ${tr(locale, "аялгуу зөв")}`;
    const retry = result.syllables.filter((s) => s.tone > 0 && !s.ok).map((s) => s.syllable);
    return `${result.correct}/${result.total} — ${retry.join(", ")}${locale === "zh" ? " " : "-г "}${tr(locale, "дахин")}`;
  })();

  const hints = result && !result.empty ? result.syllables.filter((s) => s.tone > 0 && !s.ok && s.hint) : [];

  return (
    <div className={className}>
      {phase === "idle" ? (
        <>
          <button
            type="button"
            onClick={() => void start()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
          >
            {tr(locale, "🎤 Дагаж хэлээд шалгуулах")}
          </button>
          {link}
        </>
      ) : null}

      {phase === "listening" || phase === "done" ? (
        <div className="rounded-2xl border border-[var(--app-border,#e2e8f0)] bg-white p-3">
          {phase === "listening" ? (
            <div className="flex items-center justify-center gap-3 rounded-xl bg-rose-50 px-3 py-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
              </span>
              <span className="text-sm font-bold text-rose-600">
                {roundMode === "pitch"
                  ? `${tr(locale, "Аялгыг бичиж байна")} — «${text}» ${tr(locale, "гэж хэлээрэй")}`
                  : `${tr(locale, "Сонсож байна")} — «${text}» ${tr(locale, "гэж хэлээрэй")}`}
              </span>
            </div>
          ) : null}

          {phase === "done" ? (
            <>
              {/* 1) Үе бүрийн chip */}
              {result && !result.empty && nSyl > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {result.syllables.map((s, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                        s.status === "ok"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : s.status === "warn"
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : s.status === "skip"
                              ? "bg-slate-50 text-slate-500 ring-slate-200"
                              : "bg-rose-50 text-rose-700 ring-rose-200"
                      }`}
                    >
                      <span translate="no">{s.syllable}</span> {statusIcon(s)}
                      {s.status === "warn" && s.short ? (
                        <span className="font-semibold">{tr(locale, s.short)}</span>
                      ) : null}
                    </span>
                  ))}
                  {summary ? (
                    <span className="ml-auto text-xs font-bold text-slate-600">{summary}</span>
                  ) : null}
                </div>
              ) : null}

              {/* Таних системийн дүгнэлт */}
              {roundMode === "pitch" && result?.empty ? (
                <p className="text-xs font-bold text-slate-500">
                  {tr(locale, "🤔 Дуу сонсогдсонгүй — микрофондоо ойртож тод хэлээрэй")}
                </p>
              ) : null}
              {roundMode !== "pitch" ? (
                recognitionAvailable ? (
                  verdict === "perfect" ? (
                    <p className="mt-1.5 text-xs font-bold text-emerald-600">
                      {tr(locale, "✅ Маш сайн!")} «{text}» {tr(locale, "гэж зөв сонсогдлоо")}
                    </p>
                  ) : verdict === "close" ? (
                    <p className="mt-1.5 text-xs font-bold text-amber-600">
                      {tr(locale, "🟡 Ойрхон байна — надад")} «{heard}» {tr(locale, "гэж сонсогдлоо")}
                    </p>
                  ) : heard ? (
                    <p className="mt-1.5 text-xs font-bold text-rose-600">
                      {tr(locale, "❌ Надад")} «{heard}» {tr(locale, "гэж сонсогдлоо — дахиад сонсоод давтаарай")}
                    </p>
                  ) : conflictJustDetected ? (
                    <p className="mt-1.5 text-xs font-semibold text-amber-700">
                      {tr(
                        locale,
                        "⚠️ Таны утсан дээр таних систем ба аялгын хэмжигч микрофоныг зэрэг ашиглаж чадахгүй байна. Дараагийн оролдлогоос таних горимоор ажиллана — аялгаа «🎵 Аялга» товчоор тусад нь шалгаарай."
                      )}
                    </p>
                  ) : !result || result.empty ? (
                    <p className="mt-1.5 text-xs font-bold text-slate-500">
                      {tr(locale, "🤔 Дуу сонсогдсонгүй — микрофондоо ойртож тод хэлээрэй")}
                    </p>
                  ) : null
                ) : (
                  <p className="mt-1.5 text-[11px] font-semibold text-slate-500">
                    {tr(locale, "(Энэ хөтөч үг таних дэмжихгүй тул зөвхөн аялгын муруй харуулав)")}
                  </p>
                )
              ) : null}
            </>
          ) : null}

          {/* 2) Нэг график */}
          {nSyl > 0 ? (
            <canvas
              ref={canvasRef}
              className="mt-2 h-[120px] w-full"
              aria-label={tr(locale, "Аялгуу")}
            />
          ) : null}
          {nSyl > 0 ? (
            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
              {refContours
                ? tr(locale, "Саарал = хүний жишиг дуу · Ногоон = таны дуу")
                : tr(locale, "Саарал = жишиг аялгуу · Ногоон = таны дуу")}
            </p>
          ) : null}

          {/* 3) Товчнууд */}
          {phase === "done" ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void start()}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
              >
                {tr(locale, "🎤 Дахин")}
              </button>
              <button
                type="button"
                onClick={() => void playReference()}
                className={`rounded-full px-4 py-2 text-xs font-bold ring-1 ${
                  playing === "ref" ? "bg-sky-100 text-sky-800 ring-sky-300" : "bg-white text-sky-700 ring-sky-300"
                }`}
              >
                {tr(locale, "🔊 Жишиг")}
              </button>
              {recordingUrl ? (
                <button
                  type="button"
                  onClick={playMine}
                  className={`rounded-full px-4 py-2 text-xs font-bold ring-1 ${
                    playing === "mine"
                      ? "bg-emerald-100 text-emerald-800 ring-emerald-300"
                      : "bg-white text-emerald-700 ring-emerald-300"
                  }`}
                >
                  {tr(locale, "▶ Таны дуу")}
                </button>
              ) : null}
              {roundMode !== "pitch" && mode !== "pitch" ? (
                <button
                  type="button"
                  onClick={() => void start("pitch")}
                  className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-300"
                >
                  {tr(locale, "🎵 Аялгуу")}
                </button>
              ) : null}
            </div>
          ) : null}

          {/* 4) Зөвлөгөө */}
          {phase === "done" && hints.length > 0 ? (
            <p className="mt-2 text-[11px] font-semibold leading-5 text-amber-700">
              {hints.map((s, i) => (
                <span key={i} className="block">
                  <span translate="no">{s.syllable}</span>: {tr(locale, s.hint)}
                </span>
              ))}
            </p>
          ) : null}
          {phase === "done" && result && !result.empty && hints.length === 0 && result.total > 0 ? (
            <p className="mt-2 text-[11px] font-semibold text-emerald-700">
              {tr(locale, "✅ Маш сайн! Аялгуу бүгд зөв.")}
            </p>
          ) : null}
          {link}
        </div>
      ) : null}
    </div>
  );
}
