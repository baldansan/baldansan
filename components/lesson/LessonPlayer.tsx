"use client";
// components/lesson/LessonPlayer.tsx
// Schema-driven хичээлийн player.
// lesson.modules_enabled-ийг ДАРААЛЛААР нь уншиж, модуль бүрийн компонентыг үзүүлнэ.
// HSK1-ийн ямар ч таамаг бүтэц байхгүй — бүгд өгөгдлөөс.

import { useState } from "react";
import type {
  HskLessonPackage as Lesson,
  HskPackageModuleKey as ModuleKey,
} from "@/types/hsk-lesson-package";
import "./lesson-player.css";

import LessonOverview from "./modules/LessonOverview";
import VocabularyCard from "./modules/VocabularyCard";
import DialoguesModule from "./modules/DialoguesModule";
import TextsModule from "./modules/TextsModule";
import GrammarModule from "./modules/GrammarModule";
import PronunciationModule from "./modules/PronunciationModule";
import RecapModule from "./modules/RecapModule";
import ExercisesModule from "./modules/ExercisesModule";
import ComingSoon from "./modules/ComingSoon";

// Модулийн харагдах нэр (ComingSoon болон гарчигт ашиглана)
const MODULE_LABEL: Record<ModuleKey, string> = {
  hook: "Танилцуулга",
  vocabulary: "Шинэ үг",
  dialogues: "Яриа",
  texts: "Богино эх",
  pronunciation: "Дуудлага",
  grammar: "Дүрэм",
  exercises_textbook: "Шалгалтын дасгал",
  exercises_workbook: "Сонсголын дасгал",
  recap: "Дүгнэлт",
};

export default function LessonPlayer({
  lesson,
  onExit,
}: {
  lesson: Lesson;
  onExit?: () => void;
}) {
  const modules = lesson.modules_enabled ?? [];
  const [idx, setIdx] = useState(0);

  const current = modules[idx];
  const isLast = idx >= modules.length - 1;
  const progress = modules.length ? ((idx + 1) / modules.length) * 100 : 0;

  function next() {
    if (idx < modules.length - 1) setIdx(idx + 1);
    else onExit?.(); // сүүлийн модуль дуусвал гарах
  }
  function prevModule() {
    if (idx > 0) setIdx(idx - 1);
    else onExit?.();
  }

  function renderModule() {
    switch (current) {
      case "hook":
        return <LessonOverview lesson={lesson} onStart={next} />;
      case "vocabulary":
        return <VocabularyCard lesson={lesson} onDone={next} />;
      case "dialogues":
        return <DialoguesModule lesson={lesson} onDone={next} />;
      case "texts":
        return <TextsModule lesson={lesson} onDone={next} />;
      case "pronunciation":
        return <PronunciationModule lesson={lesson} onDone={next} />;
      case "grammar":
        return <GrammarModule lesson={lesson} onDone={next} />;
      case "exercises_textbook":
        return <ExercisesModule lesson={lesson} source="textbook" onDone={next} />;
      case "exercises_workbook":
        return <ExercisesModule lesson={lesson} source="workbook" onDone={next} />;
      case "recap":
        return <RecapModule lesson={lesson} onDone={next} />;
      default:
        return <ComingSoon label={MODULE_LABEL[current] ?? current} onNext={next} />;
    }
  }

  return (
    <div className="bs-root">
      <div className="bs-topbar">
        <button className="bs-iconbtn" onClick={prevModule} aria-label="Буцах">
          ←
        </button>
        <div className="bs-ttl">
          <h1>
            {lesson.level} · {lesson.lesson_number}-р хичээл — {lesson.title.mn}
          </h1>
          <p>{lesson.title.zh}</p>
        </div>
      </div>

      {/* зөвхөн хичээлийн нүүрнээс хойш прогресс харуулна */}
      {idx > 0 && (
        <div className="bs-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      {renderModule()}
    </div>
  );
}
