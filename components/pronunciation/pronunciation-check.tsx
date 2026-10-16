"use client";
// components/pronunciation/pronunciation-check.tsx
// «🎤 Дуудлага» — хэрэглэгч үг/өгүүлбэрээ уншина → Web Speech API танина →
// ханз бүрээр зөв/буруу, хөгийн зөрүү, хувь оноо. 80%+ бол оноо олгоно.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { awardPronunciationPoints } from "@/lib/pronunciation/award";
import {
  scorePronunciation,
  scoreVerdictMn,
  type CharResult,
  type PronunciationScore,
} from "@/lib/pronunciation/score";
import {
  abortRecognition,
  isSpeechRecognitionSupported,
  recognitionErrorMessage,
  recognizeOnce,
  type RecognitionErrorCode,
} from "@/lib/pronunciation/speech-recognition";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import { speakWithSavedSettings, stopPronunciation } from "@/lib/tts/play-pronunciation";
import "./pronunciation-check.css";

type Phase = "idle" | "listening" | "scoring" | "result" | "error";

export type PronunciationCheckProps = {
  /** Зорилтот хятад текст (үг эсвэл өгүүлбэр) */
  text: string;
  pinyin?: string | null;
  /** Жижиг чип (мөрийн хажууд) — үр дүн нь доор нь дэлгэгдэнэ */
  compact?: boolean;
  /** Оноо олгохгүй (ж: демо) */
  noPoints?: boolean;
  className?: string;
  /** Үр дүн гарах бүрд */
  onResult?: (score: PronunciationScore) => void;
  /** Товчны бичвэр (үндсэн: «Дуудлага») */
  label?: string;
};

const TONE_NAMES = ["0", "1", "2", "3", "4"];

const noopSubscribe = () => () => {};
/** Сервер дээр true (товч харагдана), клиент дээр жинхэнэ дэмжлэг. */
function useSpeechSupported(): boolean {
  return useSyncExternalStore(noopSubscribe, isSpeechRecognitionSupported, () => true);
}

function statusClass(c: CharResult): string {
  switch (c.status) {
    case "ok":
    case "homophone":
      return "bs-pc-ch--ok";
    case "tone":
      return "bs-pc-ch--tone";
    default:
      return "bs-pc-ch--bad";
  }
}

export function PronunciationCheck({
  text,
  pinyin,
  compact = false,
  noPoints = false,
  className = "",
  onResult,
  label,
}: PronunciationCheckProps) {
  const locale = useUiLocale();
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState<PronunciationScore | null>(null);
  const [errorCode, setErrorCode] = useState<RecognitionErrorCode | null>(null);
  const [awarded, setAwarded] = useState(0);
  const [prevText, setPrevText] = useState(text);
  const supported = useSpeechSupported();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abortRecognition();
    };
  }, []);

  // Текст солигдвол үр дүнг цэвэрлэнэ (render үеийн derived-state reset)
  if (prevText !== text) {
    setPrevText(text);
    setPhase("idle");
    setScore(null);
    setErrorCode(null);
    setAwarded(0);
  }

  const start = useCallback(async () => {
    if (phase === "listening") {
      abortRecognition();
      setPhase("idle");
      return;
    }
    stopPronunciation();
    setScore(null);
    setErrorCode(null);
    setAwarded(0);
    setPhase("listening");
    const res = await recognizeOnce({ lang: "zh-CN", timeoutMs: text.length > 8 ? 9000 : 6000 });
    if (!mounted.current) return;
    if (!res.ok) {
      if (res.error === "aborted") {
        setPhase("idle");
        return;
      }
      setErrorCode(res.error);
      setPhase("error");
      return;
    }
    setPhase("scoring");
    try {
      const s = await scorePronunciation(text, pinyin, res.alternatives);
      if (!mounted.current) return;
      setScore(s);
      setPhase("result");
      onResult?.(s);
      if (!noPoints) setAwarded(awardPronunciationPoints(text, s.percent));
    } catch {
      if (!mounted.current) return;
      setErrorCode("unknown");
      setPhase("error");
    }
  }, [phase, text, pinyin, onResult, noPoints]);

  const playTarget = useCallback(() => {
    const t = text.trim();
    if (!t) return;
    if (t.length <= 4) void playChineseWordAudio(t);
    else void speakWithSavedSettings(t, "zh-CN");
  }, [text]);

  if (!supported) {
    if (compact) return null;
    return (
      <div className={`bs-pc bs-pc--unsupported ${className}`}>
        <span aria-hidden>🎤</span>{" "}
        {tr(locale, "Энэ хөтөч дуу таних чадваргүй байна. Chrome (компьютер, Android) эсвэл iPhone-ийн Safari-гаар нээгээрэй. WeChat, Facebook доторх хөтөч дэмжихгүй.")}
      </div>
    );
  }

  const listening = phase === "listening";
  const buttonLabel = listening
    ? tr(locale, "Сонсож байна… дарж зогсоо")
    : phase === "scoring"
      ? tr(locale, "Үнэлж байна…")
      : label ?? tr(locale, "Дуудлага");

  return (
    <div className={`bs-pc ${compact ? "bs-pc--compact" : ""} ${className}`}>
      <div className="bs-pc-row">
        <button
          type="button"
          className={`bs-pc-btn${listening ? " bs-pc-btn--live" : ""}`}
          onClick={() => void start()}
          disabled={phase === "scoring"}
          aria-pressed={listening}
        >
          <span className="bs-pc-mic" aria-hidden>
            {listening ? "⏺" : "🎤"}
          </span>
          {buttonLabel}
        </button>
        {!compact ? (
          <button type="button" className="bs-pc-play" onClick={playTarget} aria-label={tr(locale, "Жишээг сонсох")}>
            🔊
          </button>
        ) : null}
      </div>

      {listening ? (
        <p className="bs-pc-hint">
          {tr(locale, "Одоо хэлээрэй:")} <b translate="no">{text}</b>
        </p>
      ) : null}

      {phase === "error" && errorCode ? (
        <p className="bs-pc-err" role="alert">
          {tr(locale, recognitionErrorMessage(errorCode))}
        </p>
      ) : null}

      {phase === "result" && score ? (
        <div className="bs-pc-result" aria-live="polite">
          <div className="bs-pc-top">
            <span
              className={`bs-pc-pct ${
                score.percent >= 80 ? "bs-pc-pct--good" : score.percent >= 50 ? "bs-pc-pct--mid" : "bs-pc-pct--low"
              }`}
            >
              {score.percent}%
            </span>
            <span className="bs-pc-verdict">{tr(locale, scoreVerdictMn(score.percent))}</span>
            {awarded > 0 ? <span className="bs-pc-pts">+{awarded} {tr(locale, "оноо")}</span> : null}
          </div>

          <div className="bs-pc-chars" translate="no">
            {score.chars.map((c, i) => (
              <span
                key={i}
                className={`bs-pc-ch ${statusClass(c)}`}
                title={
                  c.status === "ok"
                    ? tr(locale, "Зөв")
                    : c.status === "homophone"
                      ? `${tr(locale, "Дуудлага зөв")} (${c.heard})`
                      : c.status === "tone"
                        ? `${tr(locale, "Хөг зөрсөн")}: ${c.pinyin} → ${c.heardPinyin ?? ""}`
                        : c.status === "missing"
                          ? tr(locale, "Сонсогдсонгүй")
                          : `${tr(locale, "Буруу")}: ${c.heardPinyin ?? c.heard ?? ""}`
                }
              >
                <small>{c.pinyin}</small>
                <b>{c.hanzi}</b>
              </span>
            ))}
          </div>

          {score.toneErrors > 0 ? (
            <ul className="bs-pc-tones">
              {score.chars
                .filter((c) => c.status === "tone")
                .map((c, i) => (
                  <li key={i} translate="no">
                    <b>{c.hanzi}</b> {c.pinyin} — {tr(locale, "та")}{" "}
                    {TONE_NAMES[c.heardTone ?? 0]}-{tr(locale, "р хөгөөр хэлсэн")} ({c.heardPinyin})
                  </li>
                ))}
            </ul>
          ) : null}

          {score.heard && score.percent < 100 ? (
            <p className="bs-pc-heard">
              {tr(locale, "Танигдсан")}: <span translate="no">{score.heard}</span>
            </p>
          ) : null}

          <div className="bs-pc-actions">
            <button type="button" className="bs-pc-again" onClick={() => void start()}>
              ↻ {tr(locale, "Дахин хэлэх")}
            </button>
            <button type="button" className="bs-pc-again bs-pc-again--ghost" onClick={playTarget}>
              🔊 {tr(locale, "Жишээг сонсох")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PronunciationCheck;
