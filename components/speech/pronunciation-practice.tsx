"use client";

import Link from "next/link";
import { useMemo } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import { VoiceCompare, type VoiceTarget } from "./voice-compare";

/*
 * 2026-11-28 (эзний шийдвэр): энэ хэсэг өмнө нь хөтчийн «үг таних»-ыг ашигладаг байсан тул
 * хэрэглэгчийн дуу Google/Apple-ийн сервер рүү явдаг байв. Одоо зөвхөн «дуугаа бичээд багшийнхтай
 * зэрэгцүүлж сонсох» — бичлэг төхөөрөмж дээрээ л үлдэнэ, автомат оноо байхгүй.
 * Хөгийн оноо (lib/speech/tone-score.ts, pitch-recorder.ts) дараагийн ээлжид буцаж ирнэ.
 */

type Props = {
  /** Дуудах хятад үг (симп.) эсвэл пиньинь. */
  text: string;
  /** Хуучин API-тай нийцүүлэхээр үлдсэн — одоо ашиглахгүй. */
  pinyin?: string | null;
  className?: string;
  /** Хуучин API-тай нийцүүлэхээр үлдсэн — одоо ашиглахгүй. */
  mode?: "auto" | "pitch";
  /** Багшийн бичлэг (хүний mp3). Өгөхгүй бол үгийн бичлэг → утасны хоолой. */
  audioUrl?: string | null;
  /** Доод талд «🎤 Дуудлагын дасгал» холбоос (үндсэн: харуулна). */
  sectionLink?: boolean;
  /** Хэрэглэгч дуугаа бичиж дуусахад. Автомат оноо байхгүй тул үргэлж null. */
  onDone?: (info: { verdict: null; result: null }) => void;
};

export function PronunciationPractice({ text, className, audioUrl, sectionLink = true, onDone }: Props) {
  const locale = useUiLocale();
  const targets = useMemo<VoiceTarget[]>(
    () => [
      audioUrl
        ? { label: text, urls: [audioUrl] }
        : { label: text, urls: [], teacher: () => playChineseWordAudio(text) },
    ],
    [text, audioUrl]
  );

  return (
    <div className={className}>
      <VoiceCompare
        key={text}
        targets={targets}
        onRecorded={onDone ? () => onDone({ verdict: null, result: null }) : undefined}
      />
      {sectionLink ? (
        <Link href="/pronunciation" className="mt-2 block text-center text-[11px] font-semibold text-emerald-700">
          {tr(locale, "🎤 Дуудлагын дасгал")} ›
        </Link>
      ) : null}
    </div>
  );
}
