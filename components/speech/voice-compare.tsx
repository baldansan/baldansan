"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playTemeeSequence, stopTemeeAudio } from "@/lib/temee-lesson/audio";
import {
  startVoiceRecording,
  VoiceError,
  voiceProblemMessage,
  type VoiceProblem,
  type VoiceRecording,
} from "@/lib/speech/voice-recorder";
import "./voice-compare.css";

export type VoiceTarget = {
  /** Хэлэх зүйл (пиньинь эсвэл ханз). */
  label: string;
  /** Багшийн бичлэгийн URL-ууд (дараалан тоглоно). */
  urls: string[];
};

/** Хамгийн уртдаа ийм удаан бичнэ — мартаж орхисон ч микрофон асаалттай үлдэхгүй. */
const MAX_MS = 6000;

type Phase = "idle" | "asking" | "recording" | "done";

/**
 * «Өөрөө хэлж үз»: дуугаа бичээд багшийнхтай зэрэгцүүлж сонсоно.
 * Бичлэг зөвхөн санах ойд — дэлгэцээс гарахад устна. Сервер рүү юу ч явахгүй.
 * Заавал биш: алгасаад цааш явж болно.
 */
export function VoiceCompare({
  targets,
  active,
  onPick,
}: {
  targets: VoiceTarget[];
  /** Сонгогдсон зорилтын индекс (сүүлд сонссон авиа). */
  active: number;
  onPick?: (index: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [problem, setProblem] = useState<VoiceProblem | null>(null);
  const [mine, setMine] = useState<{ url: string; target: number } | null>(null);
  const [playing, setPlaying] = useState<"teacher" | "mine" | "both" | null>(null);
  const recRef = useRef<VoiceRecording | null>(null);
  const timerRef = useRef<number | null>(null);
  const mineUrlRef = useRef<string | null>(null);

  const target = targets[Math.min(active, targets.length - 1)];

  const dropMine = useCallback(() => {
    if (mineUrlRef.current) URL.revokeObjectURL(mineUrlRef.current);
    mineUrlRef.current = null;
    setMine(null);
  }, []);

  // Дэлгэцээс гарахад: микрофоныг унтрааж, бичлэгийг устгана.
  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      recRef.current?.cancel();
      recRef.current = null;
      if (mineUrlRef.current) URL.revokeObjectURL(mineUrlRef.current);
      mineUrlRef.current = null;
    },
    []
  );

  const stop = useCallback(async () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const rec = recRef.current;
    recRef.current = null;
    if (!rec) return;
    try {
      const blob = await rec.stop();
      if (mineUrlRef.current) URL.revokeObjectURL(mineUrlRef.current);
      const url = URL.createObjectURL(blob);
      mineUrlRef.current = url;
      setMine({ url, target: active });
      setPhase("done");
    } catch (err) {
      setProblem(err instanceof VoiceError ? err.problem : "empty");
      setPhase("idle");
    }
  }, [active]);

  const start = useCallback(async () => {
    stopTemeeAudio();
    setPlaying(null);
    setProblem(null);
    dropMine();
    setPhase("asking");
    try {
      recRef.current = await startVoiceRecording();
    } catch (err) {
      setProblem(err instanceof VoiceError ? err.problem : "unsupported");
      setPhase("idle");
      return;
    }
    setPhase("recording");
    timerRef.current = window.setTimeout(() => void stop(), MAX_MS);
  }, [dropMine, stop]);

  const play = useCallback(
    (what: "teacher" | "mine" | "both") => {
      if (!target) return;
      const urls =
        what === "teacher"
          ? target.urls
          : what === "mine"
            ? mine
              ? [mine.url]
              : []
            : mine
              ? [...target.urls, mine.url]
              : target.urls;
      if (urls.length === 0) return;
      setPlaying(what);
      void playTemeeSequence(urls, 350).then(() => setPlaying((p) => (p === what ? null : p)));
    },
    [target, mine]
  );

  if (!target) return null;
  // Өөр авиа сонгосон бол хуучин бичлэг тэр авианых биш — харьцуулах товчийг нууна.
  const hasMine = phase === "done" && mine != null && mine.target === active;

  return (
    <div className="vc">
      <p className="vc-kicker">Өөрөө хэлж үз</p>

      {targets.length > 1 ? (
        <div className="vc-targets" role="group" aria-label="Аль авиаг хэлэх вэ">
          {targets.map((t, i) => (
            <button
              key={t.label}
              type="button"
              className={`vc-target${i === active ? " is-on" : ""}`}
              aria-pressed={i === active}
              disabled={phase === "recording" || phase === "asking"}
              onClick={() => onPick?.(i)}
            >
              <span translate="no">{t.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {phase === "recording" ? (
        <button type="button" className="vc-main is-rec" onClick={() => void stop()}>
          <span className="vc-dot" aria-hidden />
          <span>
            Бичиж байна. «<span translate="no">{target.label}</span>» гэж хэл
          </span>
          <b>Болсон ■</b>
        </button>
      ) : (
        <button
          type="button"
          className="vc-main"
          disabled={phase === "asking"}
          onClick={() => void start()}
        >
          <span aria-hidden>🎤</span>
          <span>
            {phase === "asking" ? (
              "Микрофон асааж байна"
            ) : hasMine ? (
              "Дахин бичих"
            ) : (
              <>
                «<span translate="no">{target.label}</span>» гэж хэлээд бич
              </>
            )}
          </span>
        </button>
      )}

      {hasMine ? (
        <>
          <button
            type="button"
            className={`vc-both${playing === "both" ? " is-on" : ""}`}
            onClick={() => play("both")}
          >
            <span aria-hidden>⇄</span> Зэрэгцүүлж сонсох
            <small>эхлээд багш, дараа нь чи</small>
          </button>
          <div className="vc-row">
            <button
              type="button"
              className={`vc-sm${playing === "teacher" ? " is-on" : ""}`}
              onClick={() => play("teacher")}
            >
              🔊 Багш
            </button>
            <button
              type="button"
              className={`vc-sm${playing === "mine" ? " is-on" : ""}`}
              onClick={() => play("mine")}
            >
              ▶ Миний дуу
            </button>
          </div>
          <p className="vc-tip">Ялгаа сонсогдож байна уу. Сонсогдвол дахин бичээд ойртуул.</p>
        </>
      ) : null}

      {problem ? (
        <div className="vc-problem" role="alert">
          {voiceProblemMessage(problem).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}

      <p className="vc-private">Дуу чинь энэ утсан дээр л үлдэнэ. Хаашаа ч илгээхгүй. Алгасаж болно.</p>
    </div>
  );
}
