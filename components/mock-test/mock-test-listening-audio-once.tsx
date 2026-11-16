"use client";

import { useEffect, useRef, useState } from "react";

export type ListeningCue = { qNo: number; start: number };

type Props = {
  url: string;
  playKey: number;
  /** Асуулт бүрийн аудио дахь эхлэх секунд (өссөн дарааллаар). Байвал аудио аль асуулт дээр явааг дагана. */
  cues?: ListeningCue[];
  /** Аудио шинэ асуулт руу шилжих бүрд дуудагдана. */
  onQuestionChange?: (qNo: number) => void;
};

function fmt(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function MockTestListeningAudioOnce({ url, playKey, cues, onQuestionChange }: Props) {
  const [cueQNo, setCueQNo] = useState<number | null>(null);
  const [toNext, setToNext] = useState<number | null>(null);
  const cuesRef = useRef(cues);
  const onChangeRef = useRef(onQuestionChange);
  const lastQRef = useRef<number | null>(null);
  useEffect(() => {
    cuesRef.current = cues;
    onChangeRef.current = onQuestionChange;
  });

  function handleTime(t: number, duration: number) {
    const list = cuesRef.current;
    if (!list?.length) return;
    let idx = -1;
    for (let i = 0; i < list.length; i++) {
      if (t >= list[i].start - 0.2) idx = i;
      else break;
    }
    if (idx < 0) {
      setToNext(Math.ceil(list[0].start - t));
      return;
    }
    const q = list[idx].qNo;
    const nextStart = list[idx + 1]?.start ?? (Number.isFinite(duration) ? duration : t);
    setToNext(Math.ceil(nextStart - t));
    if (lastQRef.current !== q) {
      lastQRef.current = q;
      setCueQNo(q);
      onChangeRef.current?.(q);
    }
  }

  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "done" | "blocked">(
    "loading"
  );

  useEffect(() => {
    setStatus("loading");
    lastQRef.current = null;
    setCueQNo(null);
    setToNext(null);
    const el = audioRef.current;
    if (!el) return;

    let finished = false;
    const blockReplay = () => {
      if (finished) {
        el.pause();
        el.currentTime = el.duration || el.currentTime;
      }
    };

    el.currentTime = 0;
    el.addEventListener("ended", () => {
      finished = true;
      setStatus("done");
    });
    el.addEventListener("play", blockReplay);

    const playPromise = el.play();
    if (playPromise) {
      void playPromise
        .then(() => setStatus("playing"))
        .catch(() => setStatus("blocked"));
    }

    return () => {
      el.removeEventListener("play", blockReplay);
    };
  }, [url, playKey]);

  return (
    <div className="bs-mt-audio-once">
      <audio
        ref={audioRef}
        src={url}
        preload="auto"
        onEnded={() => setStatus("done")}
        onPlay={() => setStatus("playing")}
        onTimeUpdate={(e) => handleTime(e.currentTarget.currentTime, e.currentTarget.duration)}
      />
      {status === "playing" && cues?.length ? (
        <p className="bs-mt-audio-cue" aria-live="polite">
          {cueQNo == null ? (
            <>Удахгүй эхэлнэ{toNext != null ? ` · ${fmt(toNext)}` : ""}</>
          ) : (
            <>
              🔊 Одоо <b>{cueQNo}-р асуулт</b>
              {toNext != null ? <span> · дараагийн асуулт хүртэл {fmt(toNext)}</span> : null}
            </>
          )}
        </p>
      ) : null}
      {status === "loading" || (status === "playing" && !cues?.length) ? (
        <p className="bs-mt-audio-once-msg">🔊 Сонсгол тоглож байна…</p>
      ) : null}
      {status === "done" ? (
        <p className="bs-mt-audio-once-msg bs-mt-audio-once-msg--done">
          Аудио дууслаа — дахин сонсох боломжгүй
        </p>
      ) : null}
      {status === "blocked" ? (
        <p className="bs-mt-audio-once-msg bs-mt-audio-once-msg--warn">
          Аудио автоматаар тоглохгүй байна. Хуудас дахин ачаална уу.
        </p>
      ) : null}
    </div>
  );
}
