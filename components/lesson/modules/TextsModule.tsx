"use client";
// components/lesson/modules/TextsModule.tsx
// Богино эх / mainText — LiveTextReader (үг дарах + toggle).
// subtitles.json (subtitle_lines) байвал 课文 сонсох үед өгүүлбэр highlight хийнэ.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LiveTextReader } from "@/components/lesson/live-text-reader";
import { useGlobalAudio } from "@/components/providers/global-audio-provider";
import { globalAudio } from "@/lib/audio/global-audio-store";
import { WritingSampleCard } from "@/components/lesson/modules/WritingSampleCard";
import { resolveLessonPackagePlayableUrl } from "@/lib/lesson/package-audio-resolve";
import { speakText, stopSpeaking } from "@/lib/tts/speech";
import {
  buildSentenceTimeWindows,
  findActiveSentenceIndex,
} from "@/lib/lesson/subtitle-sync";
import type {
  HskLessonPackage,
  HskPackageShortText,
  HskPackageTextSentence,
} from "@/types/hsk-lesson-package";
import type { TimedSubtitle } from "@/types/lesson";
import "./texts-module.css";
import "./teacher-overlay.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

export default function TextsModule({
  lesson,
  timedSubtitles = [],
  onDone,
  trackHref,
}: {
  lesson: HskLessonPackage;
  /** subtitle_lines rows — enables sentence highlight while 课文 audio plays. */
  timedSubtitles?: TimedSubtitle[];
  onDone: () => void;
  /** Mini-player дээрх гарчиг дарахад буцах холбоос (хичээлийн watch хуудас). */
  trackHref?: string;
}) {
  const texts: HskPackageShortText[] = lesson.texts ?? [];
  const base = lesson.audio_base_path;

  const [ti, setTi] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);

  // Глобал тоглуулагч — хуудас солиход 课文 аудио тасрахгүй, доод mini-player-т үргэлжилнэ.
  const audio = useGlobalAudio();
  const lessonTitle = lesson.title?.mn?.trim() || lesson.title?.zh?.trim() || "Хичээл";

  const text = texts[ti];
  const total = texts.length;
  const sentences: HskPackageTextSentence[] = text?.sentences ?? [];

  const src = resolveLessonPackagePlayableUrl(text?.audio, { packageAudioBase: base });
  const trackId = src ? `texts:${src}` : `texts:none:${ti}`;
  const filePlaying = audio.isActive(trackId);
  const currentTime = audio.isCurrent(trackId) ? audio.state.currentTime : 0;

  const fullZh = useMemo(
    () => sentences.map((s) => s.zh).join(""),
    [sentences]
  );

  // Албан аудио байхгүй (файл заагаагүй / storage-д алга → 404) номуудад (发展汉语
  // 中级 II, 初级, 高级) «Сонсох» ажиллахгүй байсан. Файл тоглож чадахгүй бол
  // хөтчийн дуугаар (SpeechSynthesis, zh-CN) эхийг уншина — юу ч болохгүйгээс дээр.
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set());
  const fileFailed = src != null && failedSrcs.has(src);
  const useTts = !src || fileFailed;
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsRun = useRef(0);
  const playing = useTts ? ttsPlaying : filePlaying;

  const stopTts = useCallback(() => {
    ttsRun.current += 1;
    stopSpeaking();
    setTtsPlaying(false);
  }, []);

  const speakFull = useCallback(
    async (rate: number) => {
      if (!fullZh) return;
      const run = ++ttsRun.current;
      setTtsPlaying(true);
      await speakText(fullZh, { lang: "zh-CN", rate: Math.max(0.5, rate * 0.9) });
      if (ttsRun.current === run) setTtsPlaying(false);
    },
    [fullZh]
  );

  // Модулиас гарахад хөтчийн уншлагыг зогсооно (файл бол mini-player үргэлжилнэ).
  useEffect(() => () => stopSpeaking(), []);

  /** Per-sentence [start, end) windows from subtitle rows (null → no sync). */
  const sentenceWindows = useMemo(
    () => buildSentenceTimeWindows(sentences, timedSubtitles),
    [sentences, timedSubtitles]
  );

  /** Тоглож буй секундээр идэвхтэй өгүүлбэр — глобал store-ийн currentTime-аас. */
  const activeSentence = useMemo(
    () =>
      playing && sentenceWindows
        ? findActiveSentenceIndex(sentenceWindows, currentTime)
        : null,
    [playing, sentenceWindows, currentTime]
  );

  const stopAudio = useCallback(() => {
    audio.stopIf(trackId);
    stopTts();
  }, [audio, trackId, stopTts]);

  async function playAudio() {
    if (useTts || !src) {
      if (ttsPlaying) stopTts();
      else void speakFull(speed);
      return;
    }
    const wasActive = audio.isActive(trackId);
    const ok = await audio.toggle(
      {
        id: trackId,
        src,
        title: text?.title_mn?.trim() || "Богино эх",
        subtitle: lessonTitle,
        href: trackHref,
      },
      { rate: speed }
    );
    // Файл тоглуулах гэтэл алдаа (storage-д байхгүй → 404 г.м.) → энэ эхийг TTS-ээр уншина.
    if (!ok && !wasActive && globalAudio.getState().status === "error") {
      setFailedSrcs((prev) => new Set(prev).add(src));
      audio.stopIf(trackId);
      void speakFull(speed);
    }
  }

  function changeSpeed(s: Speed) {
    setSpeed(s);
    if (audio.isCurrent(trackId)) audio.setRate(s);
    if (useTts && ttsPlaying) void speakFull(s);
  }

  function goPrev() {
    if (ti > 0) {
      stopAudio();
      setTi(ti - 1);
    }
  }

  function goNext() {
    stopAudio();
    if (ti < total - 1) setTi(ti + 1);
    else onDone();
  }

  // Модуль хаагдахад (хуудас солиход) аудио ЗОГСООХГҮЙ — mini-player үргэлжлүүлнэ.

  if (!text || (sentences.length === 0 && !text.writingSample)) {
    return (
      <div className="bs-card">
        <div className="bs-soon">
          <div className="bs-soon-ic">📖</div>
          <p>Энэ хичээлд богино эх алга.</p>
        </div>
        <button className="bs-cta" onClick={onDone} style={{ marginTop: 4 }}>
          Дараагийнх →
        </button>
      </div>
    );
  }

  return (
    <div className="bs-card bs-txt">
      <div className="bs-vtop">
        <div translate="no" className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          {text.title_mn?.trim() || "Богино эх"}
        </div>
        <span className="bs-counter">
          {ti + 1} / {total}
        </span>
      </div>

      {sentences.length > 0 ? (
        <>
          <div className="bs-txt-bar">
            <div className="bs-speeds" role="group" aria-label="Тоглуулах хурд">
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
            <button
              type="button"
              className={`bs-txt-play ${playing ? "bs-on" : ""}`}
              onClick={() => void playAudio()}
              disabled={!text.audio && !fullZh}
              aria-label={playing ? "Зогсоох" : "Сонсох"}
            >
              <span aria-hidden>{playing ? "⏸" : "▶"}</span>{" "}
              {playing ? "Зогсоож байна" : "Сонсох"}
            </button>
          </div>
          {useTts && fullZh ? (
            <p className="bs-txt-ttsnote" translate="no">
              {fileFailed
                ? "Энэ хичээлийн аудио файл олдсонгүй — хөтчийн дуугаар уншиж байна."
                : "Энэ номд албан аудио байхгүй — хөтчийн дуугаар уншина."}
            </p>
          ) : null}

          <LiveTextReader
            text={text}
            vocabulary={lesson.vocabulary}
            activeSentenceIndex={playing ? activeSentence : null}
          />
        </>
      ) : null}

      {text.writingSample ? (
        <WritingSampleCard
          sample={text.writingSample}
          sectionTitle={text.title_mn}
        />
      ) : null}

      <div className="bs-navrow">
        <button className="bs-navbtn" onClick={goPrev} disabled={ti === 0}>
          ← Өмнөх
        </button>
        <button className="bs-navbtn" onClick={goNext}>
          {ti === total - 1 ? "Дуусгах →" : "Дараагийнх →"}
        </button>
      </div>
    </div>
  );
}
