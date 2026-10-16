/**
 * Web Speech API (SpeechRecognition) — нэг удаагийн таних.
 * Chrome (desktop/Android), iOS Safari 14.5+ дэмжинэ; Firefox, WeChat/Facebook
 * доторх хөтөч дэмжихгүй → `isSpeechRecognitionSupported()` false.
 *
 * Гадны API түлхүүр шаардахгүй — хөтөч өөрөө (Google/Apple сервер) таних тул
 * интернэт холболт хэрэгтэй.
 */

type RecognitionAlternativeLike = { transcript: string };
type RecognitionEventLike = {
  results: ArrayLike<ArrayLike<RecognitionAlternativeLike>>;
};
type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getCtor() !== null;
}

export const SPEECH_UNSUPPORTED_MESSAGE =
  "Энэ хөтөч дуу таних чадваргүй байна. Chrome (компьютер, Android) эсвэл iPhone-ийн Safari-гаар нээгээрэй. WeChat, Facebook доторх хөтөч дэмжихгүй.";

export type RecognitionErrorCode =
  | "unsupported"
  | "no-speech"
  | "not-allowed"
  | "network"
  | "aborted"
  | "busy"
  | "unknown";

export type RecognitionResult =
  | { ok: true; alternatives: string[] }
  | { ok: false; error: RecognitionErrorCode };

export function recognitionErrorMessage(code: RecognitionErrorCode): string {
  switch (code) {
    case "unsupported":
      return SPEECH_UNSUPPORTED_MESSAGE;
    case "no-speech":
      return "Дуу сонсогдсонгүй — микрофондоо ойртож, дахин хэлээрэй.";
    case "not-allowed":
      return "Микрофон зөвшөөрөгдөөгүй — хөтчийн хаягийн мөрөөс микрофоныг зөвшөөрнө үү.";
    case "network":
      return "Таних сервертэй холбогдож чадсангүй — интернэтээ шалгаарай.";
    case "busy":
      return "Микрофон өөр юманд ашиглагдаж байна.";
    case "aborted":
      return "Цуцлагдсан.";
    default:
      return "Таних явцад алдаа гарлаа — дахин оролдоно уу.";
  }
}

type ActiveSession = { rec: RecognitionLike; cancel: () => void };
let active: ActiveSession | null = null;

/** Явагдаж буй танилтыг зогсооно (хуудас солигдох, дахин эхлүүлэх үед). */
export function abortRecognition(): void {
  if (!active) return;
  const s = active;
  active = null;
  try {
    s.rec.abort();
  } catch {
    /* ignore */
  }
  s.cancel();
}

/**
 * Нэг хэллэг таних. Хэрэглэгч чимээгүй байвал timeoutMs дараа зогсоож
 * «no-speech» буцаана. Хятад хэл (zh-CN) үндсэн.
 */
export function recognizeOnce(opts: {
  lang?: string;
  timeoutMs?: number;
  maxAlternatives?: number;
  /** Таних систем микрофон нээсний дараа (UI «Сонсож байна» болгох) */
  onStart?: () => void;
} = {}): Promise<RecognitionResult> {
  const Ctor = getCtor();
  if (!Ctor) return Promise.resolve({ ok: false, error: "unsupported" });

  abortRecognition();

  return new Promise<RecognitionResult>((resolve) => {
    let settled = false;
    let timer: number | null = null;
    const rec = new Ctor();
    rec.lang = opts.lang ?? "zh-CN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = opts.maxAlternatives ?? 5;

    const finish = (result: RecognitionResult) => {
      if (settled) return;
      settled = true;
      if (timer) window.clearTimeout(timer);
      if (active?.rec === rec) active = null;
      resolve(result);
    };

    rec.onresult = (event) => {
      const alts: string[] = [];
      const first = event.results[0];
      if (first) {
        for (let i = 0; i < first.length; i++) {
          const t = first[i]?.transcript?.trim();
          if (t) alts.push(t);
        }
      }
      if (alts.length === 0) finish({ ok: false, error: "no-speech" });
      else finish({ ok: true, alternatives: alts });
    };
    rec.onerror = (event) => {
      const e = event.error ?? "";
      const code: RecognitionErrorCode =
        e === "no-speech"
          ? "no-speech"
          : e === "not-allowed" || e === "service-not-allowed"
            ? "not-allowed"
            : e === "network"
              ? "network"
              : e === "aborted"
                ? "aborted"
                : e === "audio-capture"
                  ? "busy"
                  : "unknown";
      finish({ ok: false, error: code });
    };
    rec.onend = () => {
      // result ирэлгүй дууссан бол чимээгүй гэж үзнэ
      finish({ ok: false, error: "no-speech" });
    };

    active = {
      rec,
      cancel: () => finish({ ok: false, error: "aborted" }),
    };

    try {
      rec.start();
      opts.onStart?.();
    } catch {
      finish({ ok: false, error: "busy" });
      return;
    }

    timer = window.setTimeout(() => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      // stop() → onresult/onend ирнэ; ирэхгүй бол 1с дараа албадан дуусгана
      window.setTimeout(() => finish({ ok: false, error: "no-speech" }), 1000);
    }, opts.timeoutMs ?? 6000);
  });
}
