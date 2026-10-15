"use client";

import { useGlobalAudio } from "@/components/providers/global-audio-provider";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import "./lesson-audio-button.css";

type Props = {
  src: string;
  /** Mini-player дээр харагдах гарчиг. */
  title: string;
  subtitle?: string;
  /** Mini-player гарчиг дарахад буцах хуудас. */
  href?: string;
  className?: string;
};

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * `<audio controls>`-ийн оронд — глобал тоглуулагчаар тоглуулна. Хуудас
 * солиход тасрахгүй, доод mini-player-т үргэлжилнэ.
 */
export function LessonAudioButton({ src, title, subtitle, href, className }: Props) {
  const locale = useUiLocale();
  const audio = useGlobalAudio();
  const id = `lesson-audio:${src}`;
  const active = audio.isActive(id);
  const current = audio.isCurrent(id);
  const { currentTime, duration, status } = audio.state;
  const pct = current && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const label = active
    ? tr(locale, "Зогсоох")
    : current && status === "paused"
      ? tr(locale, "Үргэлжлүүлэх")
      : tr(locale, "Сонсох");

  return (
    <button
      type="button"
      onClick={() => void audio.toggle({ id, src, title, subtitle, href })}
      className={`bs-lesson-audio-btn${active ? " bs-on" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={active}
    >
      <span className="bs-lesson-audio-ic" aria-hidden>
        {active ? "⏸" : "▶"}
      </span>
      <span className="bs-lesson-audio-body">
        <span className="bs-lesson-audio-label">{label}</span>
        {current && duration > 0 ? (
          <span className="bs-lesson-audio-time">
            {fmt(currentTime) || "0:00"} / {fmt(duration)}
          </span>
        ) : null}
        <span className="bs-lesson-audio-bar" aria-hidden>
          <i style={{ width: `${pct}%` }} />
        </span>
      </span>
    </button>
  );
}
