"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PronunciationPractice } from "@/components/speech/pronunciation-practice";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { getKidModeChildId } from "@/lib/kids/client";
import { getKidPathState, setKidTaskDone } from "@/lib/kids/path";
import { useKidPathVersion } from "@/lib/kids/use-kid-path";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import { speakWithSavedSettings, stopPronunciation } from "@/lib/tts/play-pronunciation";
import "@/components/kids/kid-path.css";

export type KidSanzijingLine = { id: string; zh: string; pinyin: string; phrases: string[]; n?: number };

type Props = {
  day: number;
  lines: KidSanzijingLine[];
  /** 7-р өдөр: 1–20 мөр («бүгдийг уншъя») */
  allLines: KidSanzijingLine[];
  attribution: string;
};

async function speakZh(text: string): Promise<void> {
  stopPronunciation();
  const cmn = await playChineseWordAudio(text);
  if (cmn.ok) return;
  await speakWithSavedSettings(text, "zh-CN");
}

/** Мөрийн пиньинийг хэллэг бүрээр (таслалаар) хуваана — хэллэгийн чип доор харуулна. */
function phrasePinyin(pinyin: string, count: number): string[] {
  const parts = pinyin.split(/[,，]/).map((s) => s.replace(/[.?!。？！]/g, "").trim());
  return parts.length === count ? parts : [];
}

export function KidSanzijingClient({ day, lines, allLines, attribution }: Props) {
  const locale = useUiLocale();
  const router = useRouter();
  const taskId = `d${day}-sanzijing`;
  const [practice, setPractice] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const version = useKidPathVersion();
  const done = useMemo(() => {
    if (version < 0) return false;
    const kidId = getKidModeChildId() ?? "guest";
    return Boolean(getKidPathState(kidId).days[day]?.tasks[taskId]);
  }, [day, taskId, version]);

  useEffect(() => () => stopPronunciation(), []);

  function finish() {
    const kidId = getKidModeChildId() ?? "guest";
    setKidTaskDone(kidId, day, taskId, true);
    router.push(`/kids/path?day=${day}`);
  }

  const range = lines.length > 0 ? `${lines[0].n ?? ""}–${lines[lines.length - 1].n ?? ""}` : "";

  return (
    <div>
      <Link href={`/kids/path?day=${day}`} className="mb-2 inline-block text-sm font-bold text-emerald-700">
        ← {tr(locale, "Хүүхдийн 7 хоног")}
      </Link>
      <header className="mb-4 rounded-[24px] bg-gradient-to-br from-rose-200 via-amber-100 to-amber-200 p-4 text-center">
        <p className="text-3xl" aria-hidden>
          📜
        </p>
        <h1 className="hanzi text-2xl font-extrabold text-[#3b2410]" translate="no">
          三字经
        </h1>
        <p className="text-sm font-bold text-[#6b3f1d]">
          {locale === "zh" ? `第 ${day} 天` : `${tr(locale, "Өдөр")} ${day}`} · {tr(locale, "Мөр")} {range}
        </p>
      </header>

      <ol className="flex flex-col gap-3" translate="no">
        {lines.map((line) => (
          <LineCard
            key={line.id}
            line={line}
            locale={locale}
            practicing={practice === line.id}
            onPractice={() => setPractice((p) => (p === line.id ? null : line.id))}
          />
        ))}
      </ol>

      {allLines.length > 0 ? (
        <section className="mt-4">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="app-btn-secondary flex w-full items-center justify-center gap-2 text-lg"
          >
            📖 {tr(locale, "Бүгдийг уншъя")} 1–{allLines.length} {showAll ? "▾" : "▸"}
          </button>
          {showAll ? (
            <ol className="mt-3 flex flex-col gap-2" translate="no">
              {allLines.map((line) => (
                <li key={line.id} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-100">
                  <span className="w-6 shrink-0 text-center text-xs font-bold text-[var(--app-muted)]">{line.n}</span>
                  <span className="min-w-0 flex-1">
                    <span className="hanzi block text-xl font-bold leading-relaxed text-[var(--app-text)]">{line.zh}</span>
                    <span className="block text-xs leading-5 text-[var(--app-muted)]">{line.pinyin}</span>
                  </span>
                  <SpeakerButton text={line.zh} lang="zh-CN" size="sm" />
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      <button
        type="button"
        onClick={finish}
        className={`mt-5 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-[22px] text-2xl font-extrabold text-white shadow-md active:scale-[0.98] ${
          done ? "bg-emerald-500" : "bg-emerald-600"
        }`}
      >
        {tr(locale, "Дууслаа ✓")}
      </button>

      <p className="mt-4 text-center text-[11px] leading-4 text-[var(--app-muted)]">{attribution}</p>
    </div>
  );
}

function LineCard({
  line,
  locale,
  practicing,
  onPractice,
}: {
  line: KidSanzijingLine;
  locale: "mn" | "zh";
  practicing: boolean;
  onPractice: () => void;
}) {
  const pins = phrasePinyin(line.pinyin, line.phrases.length);
  return (
    <li className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-amber-100">
      <div className="flex items-start gap-3">
        <span className="mt-1 w-7 shrink-0 rounded-full bg-amber-100 text-center text-sm font-extrabold leading-7 text-amber-800">
          {line.n}
        </span>
        <div className="min-w-0 flex-1">
          <p className="hanzi text-3xl font-bold leading-[1.6] tracking-wide text-[var(--app-text)]">{line.zh}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">{line.pinyin}</p>
        </div>
        <SpeakerButton text={line.zh} lang="zh-CN" size="lg" className="mt-1" />
      </div>

      {line.phrases.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {line.phrases.map((ph, i) => (
            <button
              key={ph + i}
              type="button"
              onClick={() => void speakZh(ph)}
              className="flex min-h-[56px] flex-col items-center justify-center rounded-2xl bg-amber-50 px-3 py-1.5 ring-1 ring-amber-200 active:bg-amber-100"
            >
              <span className="hanzi text-xl font-bold text-[var(--app-text)]">{ph}</span>
              {pins[i] ? <span className="text-[11px] leading-4 text-[var(--app-muted)]">{pins[i]}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onPractice}
        className={`mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl text-base font-extrabold ring-2 ${
          practicing ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-blue-700 ring-blue-200"
        }`}
      >
        🎤 {tr(locale, "Дагаж хэл")}
      </button>
      {practicing ? (
        <PronunciationPractice key={line.id} text={line.zh} pinyin={line.pinyin} mode="pitch" sectionLink={false} className="mt-2" />
      ) : null}
    </li>
  );
}
