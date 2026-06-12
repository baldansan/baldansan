"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  url: string;
  playKey: number;
};

export function MockTestListeningAudioOnce({ url, playKey }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "done" | "blocked">(
    "loading"
  );

  useEffect(() => {
    setStatus("loading");
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
      />
      {status === "loading" || status === "playing" ? (
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
