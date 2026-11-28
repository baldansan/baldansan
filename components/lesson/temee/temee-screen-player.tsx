"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { temeePoseSrc } from "@/lib/temee/poses";
import {
  playTemeeSequence,
  preloadTemeeAudio,
  stopTemeeAudio,
  temeeAudioUrl,
} from "@/lib/temee-lesson/audio";
import type {
  TemeeAudio,
  TemeeAudioRef,
  TemeeCheck,
  TemeePracticeItem,
  TemeeScreen,
  TemeeSection,
} from "@/types/temee-lesson";
import { VoiceCompare, type VoiceTarget } from "@/components/speech/voice-compare";
import { TemeeVisualView } from "./temee-visual";
import "./temee.css";

/**
 * «Өөрөө хэлж үз» (дуугаа бичээд багшийнхтай зэрэгцүүлж сонсох) — «Авианы дасгал» үеийн
 * дуутай дэлгэц бүрд. Энэ дэлгэц дээр дарж сонсож болох зүйл бүр хэлж үзэх зорилт болно.
 */
function voiceTargets(screen: TemeeScreen): { label: string; src: TemeeAudioRef[] }[] {
  const out: { label: string; src: TemeeAudioRef[] }[] = [];
  const v = screen.visual;
  if (v?.kind === "pair") out.push(v.a, v.b);
  else if (v?.kind === "grid") {
    for (const it of v.items) if (it.src?.length) out.push({ label: it.label, src: it.src });
  } else if (v?.kind === "blend") {
    for (const it of v.items) out.push({ label: it.result, src: it.src });
  }
  for (const a of screen.audio ?? []) out.push({ label: a.label, src: a.src });
  const seen = new Set<string>();
  return out
    .map((t) => ({ label: t.label, src: t.src }))
    .filter((t) => {
      const key = t.src.join("|");
      if (t.src.length === 0 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const RIGHT_LINES = ["Болж байна.", "Тийм.", "Зөв.", "Мэдээж."];

/** Объект доторх бүх дууны заалтыг (syl:/word:/file:) цуглуулна — урьдчилан татахад. */
function collectAudioRefs(value: unknown, out: Set<string> = new Set()): Set<string> {
  if (typeof value === "string") {
    if (/^(syl|word|file):/.test(value)) out.add(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectAudioRefs(v, out);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectAudioRefs(v, out);
  }
  return out;
}

/** Одоогийн ба дараагийн хэсгийн дууг урьдчилан татна — дарахад хүлээлгэхгүй. */
function usePreloadAudio(lessonId: string, current: unknown, next: unknown) {
  useEffect(() => {
    const refs = collectAudioRefs([current, next]);
    preloadTemeeAudio([...refs].map((r) => temeeAudioUrl(r, lessonId)));
  }, [lessonId, current, next]);
}

function useTemeePlay(lessonId: string) {
  const [failed, setFailed] = useState(false);
  const play = useCallback(
    (src: TemeeAudioRef[]) => {
      setFailed(false);
      void playTemeeSequence(src.map((r) => temeeAudioUrl(r, lessonId))).then((ok) => {
        if (!ok) setFailed(true);
      });
    },
    [lessonId]
  );
  useEffect(() => () => stopTemeeAudio(), []);
  return { play, failed };
}

function AudioChip({ audio, onPlay }: { audio: TemeeAudio; onPlay: (src: TemeeAudioRef[]) => void }) {
  return (
    <button type="button" className="tm-audio" onClick={() => onPlay(audio.src)}>
      <span aria-hidden>🔊</span>
      <span translate="no">{audio.label}</span>
      {audio.repeat ? <em>дагаж хэл</em> : null}
    </button>
  );
}

/** Нэг жижиг шалгалт: зөв хариултаа олтол дахин оролдоно. */
function CheckBlock({
  check,
  seed,
  counter,
  onPlay,
  onSolved,
}: {
  check: TemeeCheck;
  seed: number;
  /** «2 / 4» — нэг дэлгэцэд хэд хэдэн шалгалт дараалсан бол. */
  counter?: string;
  onPlay: (src: TemeeAudioRef[]) => void;
  onSolved: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const solved = picked === check.answer;

  return (
    <div className="tm-check">
      <p className="tm-check-kicker">
        <span>Шалгая</span>
        {counter ? <span>{counter}</span> : null}
      </p>
      <p className="tm-check-q">{check.q}</p>
      {check.audio ? (
        <button type="button" className="tm-audio tm-audio--big" onClick={() => onPlay(check.audio!.src)}>
          <span aria-hidden>🔊</span>
          <span>{check.audio.label}</span>
        </button>
      ) : null}
      <div className="tm-opts">
        {check.options.map((opt, i) => {
          const state =
            picked === i ? (i === check.answer ? " is-right" : " is-wrong") : solved ? " is-dim" : "";
          return (
            <button
              key={opt}
              type="button"
              className={`tm-opt${state}`}
              disabled={solved}
              onClick={() => {
                setPicked(i);
                if (i === check.answer) onSolved();
              }}
            >
              <span translate="no">{opt}</span>
            </button>
          );
        })}
      </div>
      {picked != null ? (
        <p className={`tm-check-fb ${solved ? "is-right" : "is-wrong"}`} aria-live="polite">
          {solved ? RIGHT_LINES[seed % RIGHT_LINES.length] : (check.wrong ?? "Зүгээр. Дахиад нэг.")}
        </p>
      ) : null}
    </div>
  );
}

type PlayerProps = {
  lessonId: string;
  /** Ахиц хадгалах түлхүүр (үе бүрд өөр). */
  sectionKey: string;
  section: TemeeSection;
  onDone: () => void;
};

/** «Тэмээ багшийн хичээл» / «Авианы дасгал» — нэг дэлгэцэд нэг санаа. */
export function TemeeScreenPlayer({ lessonId, sectionKey, section, onDone }: PlayerProps) {
  const flat = useMemo(
    () =>
      section.parts.flatMap((part) =>
        part.screens.map((screen) => ({ part, screen }))
      ),
    [section]
  );
  const storageKey = `bs:temee:${lessonId}:${sectionKey}`;
  // Хаана зогссоноо санана (энэ төхөөрөмж дээр). Энэ бүрэлдэхүүн зөвхөн клиент дээр,
  // хэрэглэгч үе рүү орсны дараа зурагддаг тул эхний утгыг шууд уншихад hydration зөрөхгүй.
  const [index, setIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const saved = Number(window.localStorage.getItem(storageKey));
      return Number.isInteger(saved) && saved > 0 && saved < flat.length ? saved : 0;
    } catch {
      return 0;
    }
  });
  const [solvedCount, setSolvedCount] = useState(0);
  const [checkIdx, setCheckIdx] = useState(0);
  const [voiceIdx, setVoiceIdx] = useState(0);
  const { play, failed } = useTemeePlay(lessonId);

  const go = useCallback(
    (next: number) => {
      stopTemeeAudio();
      setSolvedCount(0);
      setCheckIdx(0);
      setVoiceIdx(0);
      setIndex(next);
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        /* үл тооно */
      }
      window.scrollTo({ top: 0 });
    },
    [storageKey]
  );

  const entry = flat[index];
  usePreloadAudio(lessonId, entry?.screen, flat[index + 1]?.screen);
  if (!entry) return null;
  const { part, screen } = entry;
  const checks: TemeeCheck[] = screen.checks ?? (screen.check ? [screen.check] : []);
  const canGoNext = solvedCount >= checks.length;
  const safeCheckIdx = Math.min(checkIdx, Math.max(checks.length - 1, 0));
  const isLast = index === flat.length - 1;
  const partIndex = section.parts.findIndex((p) => p.id === part.id);
  const voice = sectionKey === "sounds" ? voiceTargets(screen) : [];
  const voiceList: VoiceTarget[] = voice.map((t) => ({
    label: t.label,
    urls: t.src.map((r) => temeeAudioUrl(r, lessonId)),
  }));
  // Сүүлд сонссон авиа нь «хэлж үзэх» авиа болно.
  const playAndTrack = (src: TemeeAudioRef[]) => {
    const hit = voice.findIndex((t) => t.src.join("|") === src.join("|"));
    if (hit >= 0) setVoiceIdx(hit);
    play(src);
  };

  return (
    <div className="tm-root">
      <div className="tm-progress" aria-hidden>
        <span style={{ width: `${((index + 1) / flat.length) * 100}%` }} />
      </div>
      <p className="tm-kicker">
        {section.parts.length > 1 ? `${partIndex + 1}-р хэсэг · ` : ""}
        {part.title}
        <span>
          {index + 1} / {flat.length}
        </span>
      </p>

      <ScreenBody key={screen.id} screen={screen} onPlay={voice.length ? playAndTrack : play} />

      {voiceList.length > 0 ? (
        <VoiceCompare key={`voice-${screen.id}`} targets={voiceList} active={voiceIdx} onPick={setVoiceIdx} />
      ) : null}

      {failed ? (
        <p className="tm-audio-fail">Дуу гарсангүй. Сүлжээгээ шалгаад дахин дарна уу.</p>
      ) : null}

      {/* Олон шалгалттай бол нэг нэгээр нь: зөв хариулмагц дараагийнх нь гарна. */}
      {checks.length > 0 ? (
        <CheckBlock
          key={`${screen.id}-c${safeCheckIdx}`}
          check={checks[safeCheckIdx]!}
          seed={index + safeCheckIdx}
          counter={checks.length > 1 ? `${safeCheckIdx + 1} / ${checks.length}` : undefined}
          onPlay={play}
          onSolved={() => {
            setSolvedCount((n) => Math.max(n, safeCheckIdx + 1));
            if (safeCheckIdx < checks.length - 1) {
              window.setTimeout(() => setCheckIdx((n) => Math.min(n + 1, checks.length - 1)), 450);
            }
          }}
        />
      ) : null}

      <div className="tm-nav">
        <button type="button" className="tm-nav-back" disabled={index === 0} onClick={() => go(index - 1)}>
          ← Өмнөх
        </button>
        <button
          type="button"
          className="tm-nav-next"
          disabled={!canGoNext}
          onClick={() => {
            if (isLast) {
              try {
                window.localStorage.removeItem(storageKey);
              } catch {
                /* үл тооно */
              }
              stopTemeeAudio();
              onDone();
            } else {
              go(index + 1);
            }
          }}
        >
          {isLast ? "Дуусгах ✓" : "Дараах →"}
        </button>
      </div>
      {!canGoNext ? <p className="tm-nav-hint">Дээрх асуултад хариулаад цааш явна.</p> : null}
    </div>
  );
}

function ScreenBody({ screen, onPlay }: { screen: TemeeScreen; onPlay: (src: TemeeAudioRef[]) => void }) {
  return (
    <>
      <h2 className="tm-title">{screen.title}</h2>
      {screen.image ? (
        <div className="tm-v tm-v-img">
          {/* eslint-disable-next-line @next/next/no-img-element -- repo доторх статик зураг */}
          <img src={screen.image} alt="" loading="lazy" decoding="async" />
        </div>
      ) : null}
      {screen.visual ? <TemeeVisualView visual={screen.visual} onPlay={onPlay} /> : null}
      {screen.audio?.length ? (
        <div className="tm-audio-row">
          {screen.audio.map((a) => (
            <AudioChip key={a.label} audio={a} onPlay={onPlay} />
          ))}
        </div>
      ) : null}
      <div className="tm-say">
        {/* eslint-disable-next-line @next/next/no-img-element -- жижиг статик зураг */}
        <img src={temeePoseSrc(screen.pose ?? "teach", "sm")} alt="" className="tm-say-img" draggable={false} />
        <div className="tm-say-bubble">
          {screen.say.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </>
  );
}

/** Тэмээ багшийн дасгал: асуулт бүр өмнө заасан зүйлээр. */
export function TemeePracticePlayer({
  lessonId,
  items,
  onDone,
}: {
  lessonId: string;
  items: TemeePracticeItem[];
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const { play, failed } = useTemeePlay(lessonId);
  const item = items[index];
  usePreloadAudio(lessonId, item, items[index + 1]);
  if (!item) return null;
  const answered = picked != null;
  const isRight = picked === item.answer;
  const isLast = index === items.length - 1;

  return (
    <div className="tm-root">
      <div className="tm-progress" aria-hidden>
        <span style={{ width: `${((index + (answered ? 1 : 0)) / items.length) * 100}%` }} />
      </div>
      <p className="tm-kicker">
        Дасгал
        <span>
          {index + 1} / {items.length} · ✓ {correct}
        </span>
      </p>

      {item.image ? (
        <div className="tm-v tm-v-img">
          {/* eslint-disable-next-line @next/next/no-img-element -- repo доторх статик зураг */}
          <img src={item.image} alt={item.scene ?? ""} loading="lazy" decoding="async" />
        </div>
      ) : null}
      {item.scene ? <p className="tm-scene">{item.scene}</p> : null}
      <h2 className="tm-title tm-title--q" translate="no">{item.q}</h2>
      {item.audio ? (
        <button type="button" className="tm-audio tm-audio--big" onClick={() => play(item.audio!.src)}>
          <span aria-hidden>🔊</span>
          <span>{item.audio.label}</span>
        </button>
      ) : null}
      {failed ? (
        <p className="tm-audio-fail">Дуу гарсангүй. Сүлжээгээ шалгаад дахин дарна уу.</p>
      ) : null}

      <div className="tm-opts">
        {item.options.map((opt, i) => {
          const state = !answered
            ? ""
            : i === item.answer
              ? " is-right"
              : picked === i
                ? " is-wrong"
                : " is-dim";
          return (
            <button
              key={opt}
              type="button"
              className={`tm-opt${state}`}
              disabled={answered}
              onClick={() => {
                setPicked(i);
                if (i === item.answer) setCorrect((n) => n + 1);
              }}
            >
              <span translate="no">{opt}</span>
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className="tm-say tm-say--fb">
          {/* eslint-disable-next-line @next/next/no-img-element -- жижиг статик зураг */}
          <img src={temeePoseSrc(isRight ? "thumbsup" : "encourage", "sm")} alt="" className="tm-say-img" />
          <div className="tm-say-bubble">
            <p>{isRight ? RIGHT_LINES[index % RIGHT_LINES.length] : "Энийг олон хүн андуурдаг."}</p>
            <p>{item.explain}</p>
          </div>
        </div>
      ) : null}

      <div className="tm-nav">
        <button
          type="button"
          className="tm-nav-next"
          disabled={!answered}
          onClick={() => {
            stopTemeeAudio();
            if (isLast) {
              onDone();
            } else {
              setPicked(null);
              setIndex(index + 1);
              window.scrollTo({ top: 0 });
            }
          }}
        >
          {isLast ? "Дуусгах ✓" : "Дараагийн дасгал →"}
        </button>
      </div>
    </div>
  );
}

/** Тэмээ багшийн дасгал дууссаны дараа: номын дасгалыг нэмж хийх үү, сорил руу явах уу. */
export function TemeeExtraPracticeOffer({
  onExtra,
  onSkip,
}: {
  onExtra: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="tm-root">
      <p className="tm-kicker">Дасгал</p>
      <h2 className="tm-title">Номын дасгалаа хийх үү</h2>
      <div className="tm-say">
        {/* eslint-disable-next-line @next/next/no-img-element -- жижиг статик зураг */}
        <img src={temeePoseSrc("thumbsup", "sm")} alt="" className="tm-say-img" />
        <div className="tm-say-bubble">
          <p>Миний дасгал дууслаа. Болж байна.</p>
          <p>Одоо номын дасгал. Унших, эгнүүлэх, нөхөх гээд төрөл олон.</p>
          <p>Үзсэнээ бататгах хамгийн дөт зам энэ. Одоо завгүй бол дараа хийж болно.</p>
        </div>
      </div>
      <div className="tm-nav">
        <button type="button" className="tm-nav-back" onClick={onSkip}>
          Сорил руу →
        </button>
        <button type="button" className="tm-nav-next" onClick={onExtra}>
          Номын дасгал хийх
        </button>
      </div>
    </div>
  );
}

/** Тэмээ багшийн сорилын дараа: номын сорилыг нэмэлт болгож санал болгоно. */
export function TemeeExtraQuizOffer({
  total,
  onExtra,
  onSkip,
}: {
  total: number;
  onExtra: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="tm-root">
      <p className="tm-kicker">Сорил</p>
      <h2 className="tm-title">Өөр сорил өгөх үү</h2>
      <div className="tm-say">
        {/* eslint-disable-next-line @next/next/no-img-element -- жижиг статик зураг */}
        <img src={temeePoseSrc("thumbsup", "sm")} alt="" className="tm-say-img" />
        <div className="tm-say-bubble">
          <p>Миний сорил дууслаа. Оноо чинь хадгалагдсан.</p>
          <p>Номын сорил бас бий. {total} асуулт, арай хэцүү.</p>
          <p>Энэ нь оноонд нөлөөлөхгүй. Алгасаж ч болно.</p>
        </div>
      </div>
      <div className="tm-nav">
        <button type="button" className="tm-nav-back" onClick={onSkip}>
          Дүгнэлт рүү →
        </button>
        <button type="button" className="tm-nav-next" onClick={onExtra}>
          Номын сорил өгөх
        </button>
      </div>
    </div>
  );
}
