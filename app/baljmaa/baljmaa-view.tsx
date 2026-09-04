"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  BALJMAA_SECTIONS,
  BALJMAA_VOCAB,
  type BaljmaaSentence,
} from "@/lib/baljmaa-content";

function speak(zh: string) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(zh);
    u.lang = "zh-CN";
    u.rate = 0.85;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("zh"));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

function SentenceCard({
  s,
  hideMn,
  hidePy,
}: {
  s: BaljmaaSentence;
  hideMn: boolean;
  hidePy: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const showMn = !hideMn || revealed;
  const showPy = !hidePy || revealed;
  return (
    <div
      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
      onClick={() => (hideMn || hidePy) && setRevealed((v) => !v)}
    >
      <div className="flex items-start gap-2">
        <p className="hanzi min-w-0 flex-1 text-lg font-bold leading-8 text-[var(--app-text)]">
          {s.zh}
        </p>
        <button
          type="button"
          aria-label="Сонсох"
          onClick={(e) => {
            e.stopPropagation();
            speak(s.zh);
          }}
          className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1.5 text-sm ring-1 ring-emerald-200 active:bg-emerald-100"
        >
          🔊
        </button>
      </div>
      {showPy ? (
        <p className="mt-1 text-[13px] leading-6 text-emerald-700">{s.py}</p>
      ) : (
        <p className="mt-1 text-[13px] italic text-slate-300">
          пиньинь нуугдсан — дарж харна
        </p>
      )}
      {showMn ? (
        <p className="mt-1 text-[13px] leading-6 text-[var(--app-muted)]">
          {s.mn}
        </p>
      ) : (
        <p className="mt-1 text-[13px] italic text-slate-300">
          орчуулга нуугдсан — дарж харна
        </p>
      )}
    </div>
  );
}

export function BaljmaaView() {
  const [hideMn, setHideMn] = useState(false);
  const [hidePy, setHidePy] = useState(false);
  const warmVoices = useCallback(() => {
    try {
      window.speechSynthesis?.getVoices();
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-5" onTouchStart={warmVoices}>
      <Link
        href="/settings"
        className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)]"
      >
        ← Тохиргоо руу буцах
      </Link>

      <section className="mb-4 rounded-[24px] bg-gradient-to-br from-[#6b1f3f] to-[#8f2f55] p-5 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-300">
          Зөвхөн Балжмаад 🌟
        </p>
        <h1 className="mt-1 text-xl font-extrabold">
          Шанхайн уулзалтын бэлтгэл — миний танилцуулга
        </h1>
        <p className="mt-2 text-xs leading-5 text-white/85">
          Танилцуулгынхаа гол өгүүлбэрүүд 1-р биеэр, хэсэг бүрээр. Ханз → пиньинь
          → монгол. 🔊 дарж сонсоод чангаар дагаж хэлээрэй. Цээжилснээ шалгахдаа
          доорх нуух горимыг асаагаад өгүүлбэр дээр дарж хариугаа шалгана.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHideMn((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
              hideMn
                ? "bg-amber-300 text-[#6b1f3f] ring-amber-200"
                : "bg-white/15 text-white ring-white/30"
            }`}
          >
            {hideMn ? "✓ Орчуулга нуусан" : "Орчуулга нуух"}
          </button>
          <button
            type="button"
            onClick={() => setHidePy((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
              hidePy
                ? "bg-amber-300 text-[#6b1f3f] ring-amber-200"
                : "bg-white/15 text-white ring-white/30"
            }`}
          >
            {hidePy ? "✓ Пиньинь нуусан" : "Пиньинь нуух"}
          </button>
        </div>
      </section>

      {BALJMAA_SECTIONS.map((sec, i) => (
        <section key={sec.titleZh} className="mb-5">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6b1f3f] text-xs font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="hanzi text-base font-extrabold text-[var(--app-text)]">
                {sec.titleZh}
                <span className="ml-2 text-xs font-semibold text-emerald-700">
                  {sec.titlePy}
                </span>
              </h2>
              <p className="text-xs text-[var(--app-muted)]">{sec.titleMn}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {sec.sentences.map((s) => (
              <SentenceCard key={s.zh} s={s} hideMn={hideMn} hidePy={hidePy} />
            ))}
          </div>
        </section>
      ))}

      <section className="mb-5">
        <h2 className="mb-2 text-base font-extrabold text-[var(--app-text)]">
          📚 Түлхүүр үгс (заавал цээжлэх)
        </h2>
        <p className="mb-2 text-xs text-[var(--app-muted)]">
          Танилцуулгад чинь орсон HSK4+ түвшний үгс — эдгээрийг мэдэхэд яриа
          чинь чөлөөтэй урсана.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BALJMAA_VOCAB.map((w) => (
            <div
              key={w.zh}
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-200"
            >
              <button
                type="button"
                aria-label="Сонсох"
                onClick={() => speak(w.zh)}
                className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs ring-1 ring-emerald-200 active:bg-emerald-100"
              >
                🔊
              </button>
              <span className="hanzi text-base font-bold text-[var(--app-text)]">
                {w.zh}
              </span>
              <span className="text-xs text-emerald-700">{w.py}</span>
              <span className="ml-auto text-right text-xs text-[var(--app-muted)]">
                {w.mn}
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-[var(--app-muted)]">
        Амжилт хүсье, Балжмаа багш аа! 加油！🐫
      </p>
    </div>
  );
}
