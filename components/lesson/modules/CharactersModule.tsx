"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { CharacterDecompositionHint } from "@/components/hanzi/CharacterDecompositionHint";

/** hanzi-writer + самбар — зөвхөн «Ханз бичих» модульд хүрэхэд татна (WordWriterPanel-тэй адил). */
const CharacterWriter = dynamic(
  () => import("@/components/hanzi/CharacterWriter").then((m) => m.CharacterWriter),
  { ssr: false, loading: () => <p className="bs-srs-stroke-loading">Ачааллаж байна…</p> }
);
import { markBsModuleCompleted } from "@/lib/lesson/bs-step-progress";
import { HANZI_WRITING_LABELS } from "@/lib/hanzi/writing-practice";
import { DeepHanziPanel } from "@/components/lesson/deep/deep-teaching-blocks";
import {
  findDeepHanzi,
  type LessonDeepTeaching,
} from "@/types/lesson-deep-teaching";
import type {
  HskCharacter,
  HskCharacterConfusable,
  HskCharacterWordGameItem,
  HskCharactersIntro,
  HskLessonPackage as Lesson,
} from "@/types/hsk-lesson-package";
import "./characters-module.css";

function CharactersIntroCard({
  intro,
  characters,
  onStart,
}: {
  intro: HskCharactersIntro;
  characters: HskCharacter[];
  onStart: () => void;
}) {
  const rows = characters.filter(
    (c) => (c.etymology_mn ?? c.etymologyMn)?.trim() || c.exampleWords?.length
  );
  return (
    <div className="bs-card">
      <div className="bs-label">
        <span className="bs-dot" />
        {HANZI_WRITING_LABELS.practiceTitle}
      </div>
      {intro.title_zh ? <p className="bs-chx-title-zh hanzi">{intro.title_zh}</p> : null}
      {intro.title_mn ? (
        <p className="bs-chx-title-mn" translate="no">
          {intro.title_mn}
        </p>
      ) : null}
      {intro.teacher_mn ? <p className="bs-chx-teacher">{intro.teacher_mn}</p> : null}
      {rows.length > 0 ? (
        <table className="bs-chx-table">
          <tbody>
            {rows.map((c) => (
              <tr key={c.hanzi}>
                <th scope="row" className="hanzi">
                  {c.hanzi}
                </th>
                <td>
                  {c.etymology_mn ?? c.etymologyMn}
                  {c.exampleWords?.length ? (
                    <span className="bs-chx-table-ex" translate="no">
                      {c.exampleWords.join(" · ")}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <button type="button" className="bs-cta" onClick={onStart}>
        Эхэлье →
      </button>
    </div>
  );
}

function WordGameCard({ item }: { item: HskCharacterWordGameItem }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="bs-chx-game">
      <p className="bs-chx-game-parts hanzi" translate="no">
        {item.parts.join(" + ")}
      </p>
      {item.hint_mn ? <p className="bs-chx-hint">{item.hint_mn}</p> : null}
      {shown ? (
        <div className="bs-chx-game-result">
          <span className="bs-chx-game-zh hanzi">{item.result}</span>
          {item.pinyin ? <span className="bs-chx-game-py">{item.pinyin}</span> : null}
          {item.mn ? <span className="bs-chx-game-mn">{item.mn}</span> : null}
        </div>
      ) : (
        <button type="button" className="bs-navbtn" onClick={() => setShown(true)}>
          Үг болго
        </button>
      )}
    </div>
  );
}

function blankWord(word: string, ch: string): string {
  return word.includes(ch) ? word.replace(ch, "＿") : `${word}＿`;
}

function ConfusableCard({ item }: { item: HskCharacterConfusable }) {
  const [picked, setPicked] = useState<{ a?: string; b?: string }>({});
  const blanks: { key: "a" | "b"; word: string; answer: string }[] = [
    { key: "a", word: item.word_a, answer: item.a },
    { key: "b", word: item.word_b, answer: item.b },
  ];
  const allAnswered = picked.a != null && picked.b != null;
  return (
    <div className="bs-chx-game">
      <div className="bs-chx-conf-row">
        {blanks.map((blank) => {
          const choice = picked[blank.key];
          return (
            <div key={blank.key} className="bs-chx-conf-blank">
              <p className="bs-chx-game-parts hanzi" translate="no">
                {blankWord(blank.word, blank.answer)}
              </p>
              <div className="bs-chx-conf-btns">
                {[item.a, item.b].map((ch) => {
                  let cls = "bs-navbtn hanzi";
                  if (choice != null) {
                    if (ch === blank.answer) cls += " bs-chx-ok";
                    else if (ch === choice) cls += " bs-chx-no";
                  }
                  return (
                    <button
                      key={ch}
                      type="button"
                      className={cls}
                      disabled={choice != null}
                      onClick={() => setPicked((prev) => ({ ...prev, [blank.key]: ch }))}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
              {choice != null ? (
                <p className="bs-chx-fb">
                  {choice === blank.answer ? "✅ Зөв!" : `❌ Буруу — зөв нь ${blank.answer}`}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      {allAnswered ? (
        <div className="bs-chx-tip">
          {item.mn ? <p>{item.mn}</p> : null}
          {item.tip_mn ? <p>💡 {item.tip_mn}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function CharactersExtras({
  wordGame,
  confusables,
  onDone,
}: {
  wordGame: HskCharacterWordGameItem[];
  confusables: HskCharacterConfusable[];
  onDone: () => void;
}) {
  return (
    <div className="bs-card">
      {wordGame.length > 0 ? (
        <>
          <div className="bs-label">
            <span className="bs-dot" />
            🧩 Үг болгоё
          </div>
          {wordGame.map((item, i) => (
            <WordGameCard key={`${item.result}-${i}`} item={item} />
          ))}
        </>
      ) : null}
      {confusables.length > 0 ? (
        <>
          <div className="bs-label" style={{ marginTop: 16 }}>
            <span className="bs-dot" />
            🔍 Андуурагдах ханзууд
          </div>
          {confusables.map((item, i) => (
            <ConfusableCard key={`${item.a}${item.b}-${i}`} item={item} />
          ))}
        </>
      ) : null}
      <button type="button" className="bs-cta" onClick={onDone} style={{ marginTop: 16 }}>
        Үргэлжлүүлэх →
      </button>
    </div>
  );
}

export default function CharactersModule({
  lessonId,
  lesson,
  deep = null,
  onDone,
}: {
  lessonId: string;
  lesson: Lesson;
  /** Нэмэлт, гүнзгий тайлбар — байхгүй бол юу ч өөрчлөгдөхгүй. */
  deep?: LessonDeepTeaching | null;
  onDone: () => void;
}) {
  const characters = useMemo(
    () => lesson.characters?.characters ?? [],
    [lesson.characters?.characters]
  );
  const intro = lesson.characters?.intro;
  const wordGame = useMemo(
    () => lesson.characters?.wordGame ?? [],
    [lesson.characters?.wordGame]
  );
  const confusables = useMemo(
    () => lesson.characters?.confusables ?? [],
    [lesson.characters?.confusables]
  );
  const hasExtras = wordGame.length > 0 || confusables.length > 0;
  const [stage, setStage] = useState<"intro" | "chars" | "extras">(
    intro ? "intro" : "chars"
  );
  const [index, setIndex] = useState(0);

  const current: HskCharacter | undefined = characters[index];
  const total = characters.length;

  function handleCharacterComplete() {
    if (index < total - 1) {
      setIndex((prev) => prev + 1);
      return;
    }
    if (hasExtras) {
      setStage("extras");
      return;
    }
    finishModule();
  }

  function finishModule() {
    markBsModuleCompleted(lessonId, "characters");
    onDone();
  }

  useEffect(() => {
    if (characters.length === 0) onDone();
  }, [characters.length, onDone]);

  if (!current) return null;

  if (stage === "intro" && intro) {
    return (
      <CharactersIntroCard
        intro={intro}
        characters={characters}
        onStart={() => setStage("chars")}
      />
    );
  }

  if (stage === "extras") {
    return (
      <CharactersExtras
        wordGame={wordGame}
        confusables={confusables}
        onDone={finishModule}
      />
    );
  }

  const mode = current.practice === "write" ? "write" : "recognize";
  const pinyin = current.pinyin.join(" · ");

  return (
    <div className="bs-card">
      <div className="bs-label">
        <span className="bs-dot" />
        {HANZI_WRITING_LABELS.practiceTitle}
      </div>

      <p className="bs-char-step">
        {index + 1} / {total}
        {mode === "write" ? " · бичих" : " · таних"}
      </p>

      <div className="bs-char-head">
        <span className="bs-char-glyph">{current.hanzi}</span>
        {pinyin ? <span className="bs-char-pinyin">{pinyin}</span> : null}
        {current.meaningMn ? (
          <span translate="no" className="bs-char-meaning">{current.meaningMn}</span>
        ) : null}
      </div>

      {current.exampleWords && current.exampleWords.length > 0 ? (
        <p className="bs-char-examples" translate="no">
          {current.exampleWords.join(" · ")}
        </p>
      ) : null}

      <CharacterDecompositionHint char={current.hanzi} />

      {(() => {
        const deepHanzi = findDeepHanzi(deep, current.hanzi);
        return deepHanzi ? (
          <DeepHanziPanel key={current.hanzi} hanzi={deepHanzi} />
        ) : null;
      })()}

      <CharacterWriter
        key={`${current.hanzi}-${index}`}
        character={current}
        mode={mode}
        onComplete={handleCharacterComplete}
      />
    </div>
  );
}
