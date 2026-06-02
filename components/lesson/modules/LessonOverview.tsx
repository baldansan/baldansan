"use client";
// components/lesson/modules/LessonOverview.tsx
// "hook" модуль = Хичээлийн нүүр.
// Тэмээ багшийн оршил + "энэ хичээлээр юу сурах" + модулийн жагсаалт.
// Бүх тоо/жагсаалт нь lesson өгөгдлөөс автоматаар гарна (data-driven).

import type {
  HskLessonPackage as Lesson,
  HskPackageModuleKey as ModuleKey,
} from "@/types/hsk-lesson-package";

// Модуль бүрийн харагдах нэр + дүрс (зөвхөн агуулгатай модулийг жагсаана)
const MODULE_META: Partial<Record<ModuleKey, { label: string; icon: string; sub?: string }>> = {
  vocabulary: { label: "Шинэ үг сурах", icon: "🗂" },
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

export default function LessonOverview({
  lesson,
  onStart,
}: {
  lesson: Lesson;
  onStart: () => void;
}) {
  const vocabN = count(lesson.vocabulary);
  const dialogN = count(lesson.dialogues);
  const textN = count(lesson.texts);
  const grammarN = count(lesson.grammar);

  const toc = lesson.modules_enabled
    .filter((m) => m !== "hook" && MODULE_META[m])
    .map((m) => ({ key: m, ...MODULE_META[m]! }));

  return (
    <>
      <div className="bs-card bs-hero">
        <h2>
          {lesson.level} · Сэдэв: {lesson.theme.mn}
        </h2>
        <div className="bs-zh-title">{lesson.title.zh}</div>
        <div className="bs-mn-title">{lesson.title.mn}</div>
        {lesson.title.pinyin && <div className="bs-py">{lesson.title.pinyin}</div>}

        {/* Тэмээ багшийн оршил (JSON-оос) */}
        <div className="bs-teacher">
          <div className="bs-mascot">🐫</div>
          <div>
            <div className="bs-who">Тэмээ багш</div>
            <p>{lesson.hook.teacher_mn}</p>
          </div>
        </div>

        {/* Энэ хичээлээр юу сурах вэ? — тоо нь өгөгдлөөс */}
        <div className="bs-learn-title">Энэ хичээлээр юу сурах вэ?</div>
        <div className="bs-chips">
          {vocabN > 0 && (
            <span className="bs-chip">
              <span className="bs-n">{vocabN}</span> шинэ үг
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

      {/* Хичээлийн алхам (модулиудаас) */}
      {toc.length > 0 && (
        <div className="bs-card">
          <div className="bs-label">
            <span className="bs-dot" />
            Хичээлийн алхам
          </div>
          <div className="bs-steps">
            {toc.map((s) => (
              <div className="bs-step" key={s.key}>
                <div className="bs-s-ic">{s.icon}</div>
                <div className="bs-s-tx">
                  <b>{s.label}</b>
                </div>
                <div className="bs-s-go">›</div>
              </div>
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
