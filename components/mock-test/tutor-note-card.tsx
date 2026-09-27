"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { replayPracticeAudio } from "@/lib/mock-test/practice-audio-store";
import { isTutorKeyLine, type TutorNote } from "@/lib/mock-test/tutor-note";
import type { MockTestQuestionRow } from "@/lib/mock-test/types";

/**
 * «🎓 Багшийн тайлбар» (私教讲解) — асуулт бүрийн бүтэцтэй тайлбар.
 *
 * Агуулга бүхэлдээ `question.tutor_note`-оос ирнэ; энд юу ч зохиохгүй.
 * Хэсэг байхгүй бол тэр хэсэг харагдахгүй. Дасгал (сурах горим) ба
 * шалгалтын дүнгийн үзлэг хоёулаа энэ нэг компонентыг хэрэглэнэ.
 */
export type TutorNoteCardProps = {
  question: MockTestQuestionRow;
  note: TutorNote;
  /** true / false, эсвэл null — компьютер дүгнэж чадахгүй. */
  isCorrect: boolean | null;
  /** Суралцагчийн сонгосон түлхүүр (A/B/C… эсвэл √/×), эсвэл null. */
  yourKey: string | null;
  /** Суралцагчийн хариултын харагдах текст. */
  yourText: string | null;
  /** Зөв хариултын харагдах текст. */
  correctText: string;
  /** Компьютер дүгнэхгүй (бичих) даалгавар — «Жишиг хариу» гэж бичнэ. */
  selfGraded?: boolean;
  /** Өөрөө үнэлэх товчнууд гэх мэт — картын доод хэсэгт нэмэлт. */
  footer?: ReactNode;
};

type Locale = ReturnType<typeof useUiLocale>;

function Collapsible({
  title,
  defaultOpen = true,
  icon,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  icon?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`bs-tn-sec${open ? " bs-tn-sec--open" : ""}`}>
      <button
        type="button"
        className="bs-tn-sec-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="bs-tn-sec-title">
          {icon ? <span aria-hidden>{icon} </span> : null}
          {title}
        </span>
        <span className="bs-tn-sec-chev" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? <div className="bs-tn-sec-body">{children}</div> : null}
    </section>
  );
}

function TranscriptSection({
  question,
  note,
  locale,
}: {
  question: MockTestQuestionRow;
  note: TutorNote;
  locale: Locale;
}) {
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMn, setShowMn] = useState(true);
  const lines = note.transcript ?? [];
  const canReplay = Boolean(question.audio_url);
  const hasPinyin = lines.some((line) => line.pinyin);
  const hasMn = lines.some((line) => line.mn);

  return (
    <section className="bs-tn-sec bs-tn-sec--open bs-tn-sec--static">
      <p className="bs-tn-sec-title bs-tn-sec-title--static">
        <span aria-hidden>🎧 </span>
        {tr(locale, "Юу гэж хэлсэн бэ")}
      </p>
      <div className="bs-tn-toolbar">
        {canReplay ? (
          <button
            type="button"
            className="bs-tn-replay"
            onClick={() =>
              replayPracticeAudio(
                question.audio_url as string,
                question.audio_start_sec,
                question.audio_end_sec
              )
            }
          >
            🔊 {tr(locale, "Дахин сонс")}
          </button>
        ) : null}
        {hasPinyin ? (
          <button
            type="button"
            className={`bs-tn-toggle${showPinyin ? " bs-tn-toggle--on" : ""}`}
            aria-pressed={showPinyin}
            onClick={() => setShowPinyin((value) => !value)}
          >
            {tr(locale, "Пиньинь")}
          </button>
        ) : null}
        {hasMn ? (
          <button
            type="button"
            className={`bs-tn-toggle${showMn ? " bs-tn-toggle--on" : ""}`}
            aria-pressed={showMn}
            onClick={() => setShowMn((value) => !value)}
          >
            {tr(locale, "Утга")}
          </button>
        ) : null}
      </div>

      <ol className="bs-tn-lines">
        {lines.map((line, index) => {
          const isKey = isTutorKeyLine(line, note.key);
          return (
            <li
              key={`${index}-${line.zh}`}
              className={`bs-tn-line${isKey ? " bs-tn-line--key" : ""}`}
            >
              <p className="bs-tn-line-zh hanzi" translate="no">
                {isKey ? (
                  <span className="bs-tn-key-mark" aria-label="Түлхүүр">
                    🔑
                  </span>
                ) : null}
                {line.zh}
              </p>
              {showPinyin && line.pinyin ? (
                <p className="bs-tn-line-py" translate="no">
                  {line.pinyin}
                </p>
              ) : null}
              {showMn && line.mn ? (
                <p className="bs-tn-line-mn" translate="no">
                  {line.mn}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function KeyLine({ note, locale }: { note: TutorNote; locale: Locale }) {
  if (!note.key) return null;
  return (
    <div className="bs-tn-keyline">
      <p className="bs-tn-keyline-label">🔑 {tr(locale, "Түлхүүр өгүүлбэр")}</p>
      <p className="bs-tn-keyline-zh hanzi" translate="no">
        {note.key}
      </p>
      {note.keyMn ? (
        <p className="bs-tn-keyline-mn" translate="no">
          {note.keyMn}
        </p>
      ) : null}
    </div>
  );
}

function WhySection({
  note,
  locale,
  isCorrect,
  yourKey,
}: {
  note: TutorNote;
  locale: Locale;
  isCorrect: boolean | null;
  yourKey: string | null;
}) {
  const wrong = note.wrong ?? {};
  const yourWrong =
    isCorrect === false && yourKey && wrong[yourKey] ? wrong[yourKey] : null;
  const others = Object.entries(wrong).filter(
    ([key]) => !(yourWrong && key === yourKey)
  );
  const [showOthers, setShowOthers] = useState(false);

  return (
    <Collapsible title={tr(locale, "Яагаад зөв бэ")} icon="✅">
      <p className="bs-tn-why" translate="no">
        {note.why}
      </p>

      {yourWrong ? (
        <div className="bs-tn-yourwrong">
          <p className="bs-tn-yourwrong-title">
            ⚠️ {tr(locale, "Яагаад чи буруу сонгов")}
          </p>
          <p className="bs-tn-yourwrong-text" translate="no">
            <b>
              {tr(locale, "Чи сонгосон")} {yourKey}:
            </b>{" "}
            {yourWrong}
          </p>
        </div>
      ) : null}

      {others.length > 0 ? (
        <div className="bs-tn-others">
          <button
            type="button"
            className="bs-tn-others-toggle"
            aria-expanded={showOthers}
            onClick={() => setShowOthers((value) => !value)}
          >
            {tr(locale, "Бусад сонголт яагаад буруу вэ")} {showOthers ? "▴" : "▾"}
          </button>
          {showOthers ? (
            <ul className="bs-tn-others-list">
              {others.map(([key, text]) => (
                <li key={key} className="bs-tn-others-item" translate="no">
                  <b className="bs-tn-others-key">{key}</b>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="bs-tn-others-compact" aria-hidden>
              {others.map(([key]) => key).join(" · ")}
            </p>
          )}
        </div>
      ) : null}
    </Collapsible>
  );
}

function TrapTip({ note, locale }: { note: TutorNote; locale: Locale }) {
  if (!note.trap && !note.tip) return null;
  const title = [note.trap ? tr(locale, "Урхи") : null, note.tip ? tr(locale, "Зөвлөгөө") : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <Collapsible title={title} icon="🧭">
      <div className="bs-tn-chips">
      {note.trap ? (
        <p className="bs-tn-chip bs-tn-chip--trap" translate="no">
          <b>🪤 {tr(locale, "Урхи")}:</b> {note.trap}
        </p>
      ) : null}
      {note.tip ? (
        <p className="bs-tn-chip bs-tn-chip--tip" translate="no">
          <b>💡 {tr(locale, "Зөвлөгөө")}:</b> {note.tip}
        </p>
      ) : null}
      </div>
    </Collapsible>
  );
}

function WordsSection({ note, locale }: { note: TutorNote; locale: Locale }) {
  const words = note.words ?? [];
  if (words.length === 0) return null;
  return (
    <Collapsible title={tr(locale, "Түлхүүр үгс")} icon="📚">
      <div className="bs-tn-words">
        {words.map((word) => (
          <Link
            key={`${word.zh}-${word.pinyin}`}
            href={`/dictionary?q=${encodeURIComponent(word.zh)}`}
            className="bs-tn-word"
            title={tr(locale, "Толь бичигт харах")}
            translate="no"
          >
            <span className="bs-tn-word-zh hanzi">{word.zh}</span>
            {word.pinyin ? <span className="bs-tn-word-py">{word.pinyin}</span> : null}
            {word.mn ? <span className="bs-tn-word-mn">{word.mn}</span> : null}
          </Link>
        ))}
      </div>
    </Collapsible>
  );
}

export function TutorNoteCard({
  question,
  note,
  isCorrect,
  yourKey,
  yourText,
  correctText,
  selfGraded = false,
  footer,
}: TutorNoteCardProps) {
  const locale = useUiLocale();
  const tone = isCorrect === true ? "ok" : isCorrect === false ? "bad" : "pending";
  const headline =
    isCorrect === true
      ? tr(locale, "Зөв! 🎉")
      : isCorrect === false
        ? tr(locale, "Буруу байна")
        : tr(locale, "Өөрөө үнэлнэ үү");
  const showTranscript =
    question.skill === "listening" && (note.transcript?.length ?? 0) > 0;
  const keyShownInTranscript =
    showTranscript &&
    (note.transcript ?? []).some((line) => isTutorKeyLine(line, note.key));

  return (
    <div className={`bs-tn bs-tn--${tone}`}>
      <p className="bs-tn-head">
        {tr(locale, "🎓 Багшийн тайлбар")}
        {locale !== "zh" ? (
          <span className="bs-tn-head-zh hanzi" translate="no">
            私教讲解
          </span>
        ) : null}
      </p>

      <div className="bs-tn-verdict">
        <p className="bs-tn-verdict-title">{headline}</p>
        {isCorrect === false && yourText ? (
          <p className="bs-tn-verdict-row">
            <span>{tr(locale, "Таны хариулт")}</span>
            <b className="hanzi" translate="no">
              {yourText}
            </b>
          </p>
        ) : null}
        <p className="bs-tn-verdict-row">
          <span>{selfGraded ? tr(locale, "Жишиг хариу") : tr(locale, "Зөв хариулт")}</span>
          <b className="hanzi" translate="no">
            {correctText}
          </b>
        </p>
      </div>

      {showTranscript ? (
        <TranscriptSection question={question} note={note} locale={locale} />
      ) : null}

      {!keyShownInTranscript ? <KeyLine note={note} locale={locale} /> : null}

      <WhySection note={note} locale={locale} isCorrect={isCorrect} yourKey={yourKey} />

      <TrapTip note={note} locale={locale} />

      <WordsSection note={note} locale={locale} />

      {footer}
    </div>
  );
}
