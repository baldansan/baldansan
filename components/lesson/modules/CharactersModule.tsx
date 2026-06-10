"use client";

import { useEffect, useMemo, useState } from "react";
import { CharacterDecompositionHint } from "@/components/hanzi/CharacterDecompositionHint";
import { CharacterWriter } from "@/components/hanzi/CharacterWriter";
import { markBsModuleCompleted } from "@/lib/lesson/bs-step-progress";
import { HANZI_WRITING_LABELS } from "@/lib/hanzi/writing-practice";
import type {
  HskCharacter,
  HskLessonPackage as Lesson,
} from "@/types/hsk-lesson-package";

export default function CharactersModule({
  lessonId,
  lesson,
  onDone,
}: {
  lessonId: string;
  lesson: Lesson;
  onDone: () => void;
}) {
  const characters = useMemo(
    () => lesson.characters?.characters ?? [],
    [lesson.characters?.characters]
  );
  const [index, setIndex] = useState(0);

  const current: HskCharacter | undefined = characters[index];
  const total = characters.length;

  function handleCharacterComplete() {
    if (index < total - 1) {
      setIndex((prev) => prev + 1);
      return;
    }
    markBsModuleCompleted(lessonId, "characters");
    onDone();
  }

  useEffect(() => {
    if (characters.length === 0) onDone();
  }, [characters.length, onDone]);

  if (!current) return null;

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
          <span className="bs-char-meaning">{current.meaningMn}</span>
        ) : null}
      </div>

      <CharacterDecompositionHint char={current.hanzi} />

      <CharacterWriter
        key={`${current.hanzi}-${index}`}
        character={current}
        mode={mode}
        onComplete={handleCharacterComplete}
      />
    </div>
  );
}
