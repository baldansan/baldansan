"use client";
// components/lesson/modules/LessonOverview.tsx
// "hook" модуль = Хичээлийн нүүр.
// Тэмээ багшийн оршил + "энэ хичээлээр юу сурах" + модулийн жагсаалт.
// Бүх тоо/жагсаалт нь lesson өгөгдлөөс автоматаар гарна (data-driven).

import { useCallback, useEffect, useState } from "react";
import {
  exercisesStepSummary,
  getStudiedWordsCount,
  moduleStepSummary,
  vocabularyStepSummary,
  type StepProgressStatus,
} from "@/lib/lesson/bs-step-progress";
import type {
  HskLessonPackage as Lesson,
  HskPackageModuleKey as ModuleKey,
} from "@/types/hsk-lesson-package";

const MODULE_META: Partial<Record<ModuleKey, { label: string; icon: string; sub?: string }>> = {
  vocabulary: { label: "Шинэ үг сурах", icon: "🗂" },
  characters: { label: "Ханз бичих", icon: "✍️" },
  dialogues: { label: "Яриа сонсох", icon: "💬" },
  texts: { label: "Богино эх унших", icon: "📄" },
  grammar: { label: "Дүрэм", icon: "📐" },
  pronunciation: { label: "Дуудлага", icon: "🎧" },
  exercises_workbook: { label: "Сонсголын дасгал", icon: "🎧" },
  exercises_textbook: { label: "Шалгалтын дасгал", icon: "✎" },
  recap: { label: "Дүгнэлт", icon: "✅" },
};

function count<T>(arr: T[] | undefined): number {
  return Array.isArray(arr) ? arr.length : 0;
}

function stepStatusBadge(detail: string, status: StepProgressStatus): string {
  if (status === "completed") return "Дууссан ✓";
  if (status === "in_progress" && detail) return detail;
  return "Эхлээгүй";
}

export default function LessonOverview({
  lessonId,
  lesson,
  onStart,
  onJump,
}: {
  lessonId: string;
  lesson: Lesson;
  onStart: () => void;
  onJump?: (key: ModuleKey) => void;
}) {
  const vocabN = count(lesson.vocabulary);
  const charN = lesson.characters?.count ?? count(lesson.characters?.characters);
  const dialogN = count(lesson.dialogues);
  const textN = count(lesson.texts);
  const grammarN = count(lesson.grammar);

  const [studiedWords, setStudiedWords] = useState(0);
  const [stepDetails, setStepDetails] = useState<Record<string, string>>({});

  const refreshProgress = useCallback(() => {
    setStudiedWords(getStudiedWordsCount(lessonId));
    const next: Record<string, string> = {};
    if (vocabN > 0) {
      next.vocabulary = vocabularyStepSummary(lessonId, vocabN).detail;
    }
    if (lesson.modules_enabled.includes("exercises_workbook")) {
      next.exercises_workbook = exercisesStepSummary(
        lessonId,
        "workbook",
        0
      ).detail;
    }
    if (lesson.modules_enabled.includes("exercises_textbook")) {
      next.exercises_textbook = exercisesStepSummary(
        lessonId,
        "textbook",
        0
      ).detail;
    }
    for (const key of lesson.modules_enabled) {
      if (
        key === "hook" ||
        key === "vocabulary" ||
        key === "exercises_workbook" ||
        key === "exercises_textbook"
      ) {
        continue;
      }
      const status = moduleStepSummary(lessonId, key);
      next[key] = status === "completed" ? "Дууссан ✓" : "Эхлээгүй";
    }
    setStepDetails(next);
  }, [lessonId, lesson.modules_enabled, vocabN]);

  useEffect(() => {
    refreshProgress();
    window.addEventListener("focus", refreshProgress);
    return () => window.removeEventListener("focus", refreshProgress);
  }, [refreshProgress]);

  const toc = lesson.modules_enabled
    .filter((m) => m !== "hook" && MODULE_META[m])
    .map((m) => {
      const meta = MODULE_META[m]!;
      let status: StepProgressStatus = "not_started";
      let detail = stepDetails[m] ?? "Эхлээгүй";
      if (m === "vocabulary" && vocabN > 0) {
        const s = vocabularyStepSummary(lessonId, vocabN);
        status = s.status;
        detail = s.detail;
      } else if (m === "exercises_workbook") {
        const s = exercisesStepSummary(lessonId, "workbook", 0);
        status = s.status;
        detail = s.detail;
      } else if (m === "exercises_textbook") {
        const s = exercisesStepSummary(lessonId, "textbook", 0);
        status = s.status;
        detail = s.detail;
      } else {
        status = moduleStepSummary(lessonId, m);
        detail = status === "completed" ? "Дууссан ✓" : "Эхлээгүй";
      }
      return { key: m, ...meta, status, detail };
    });

  return (
    <>
      <div className="bs-card bs-hero">
        <h2>
          {lesson.level} · Сэдэв: {lesson.theme.mn}
        </h2>
        <div className="bs-zh-title">{lesson.title.zh}</div>
        <div className="bs-mn-title">{lesson.title.mn}</div>
        {lesson.title.pinyin && <div className="bs-py">{lesson.title.pinyin}</div>}

        <div className="bs-teacher">
          <div className="bs-mascot">🐫</div>
          <div>
            <div className="bs-who">Тэмээ багш</div>
            <p>{lesson.hook.teacher_mn}</p>
          </div>
        </div>

        <div className="bs-learn-title">Энэ хичээлээр юу сурах вэ?</div>
        <div className="bs-chips">
          {vocabN > 0 && (
            <span className="bs-chip">
              <span className="bs-n">{vocabN}</span> шинэ үг
            </span>
          )}
          {charN > 0 && (
            <span className="bs-chip">
              <span className="bs-n">{charN}</span> ханз
            </span>
          )}
          {studiedWords > 0 && (
            <span className="bs-chip">
              <span className="bs-n">{studiedWords}</span> үг сурсан
            </span>
          )}
          {dialogN > 0 && (
            <span className="bs-chip">
              <span className="bs-n">{dialogN}</span> яриа
            </span>
          )}
          {textN > 0 && (
            <span className="bs-chip">
              <span className="bs-n">{textN}</span> богино эх
            </span>
          )}
          {grammarN > 0 && (
            <span className="bs-chip">
              <span className="bs-n">{grammarN}</span> дүрэм
            </span>
          )}
        </div>
      </div>

      {toc.length > 0 && (
        <div className="bs-card">
          <div className="bs-label">
            <span className="bs-dot" />
            Хичээлийн алхам
          </div>
          <div className="bs-steps">
            {toc.map((s) => (
              <button
                type="button"
                className="bs-step bs-step-btn"
                key={s.key}
                onClick={() => onJump?.(s.key)}
              >
                <div className="bs-s-ic">{s.icon}</div>
                <div className="bs-s-tx">
                  <b>{s.label}</b>
                  <span className="bs-s-status">{stepStatusBadge(s.detail, s.status)}</span>
                </div>
                <div className="bs-s-go">›</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="bs-cta" onClick={onStart}>
        Хичээлээ эхлэх →
      </button>
    </>
  );
}
