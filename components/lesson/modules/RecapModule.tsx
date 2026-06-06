"use client";
// components/lesson/modules/RecapModule.tsx
// "recap" модуль — хичээлийн төгсгөлийн дүгнэлт.
// Багшийн төгсгөлийн үг (teacher_mn) + "өнөөдөр юу сурав" (тоог хичээлийн
// өгөгдлөөс автоматаар бодно) + "Хичээлээ дуусгах" товч.
// recap нь ихэвчлэн СҮҮЛИЙН модуль тул onDone() дарахад player-ээс гарна.
// types/lesson.ts-г өөрчлөх ШААРДЛАГАГҮЙ. Гэрээ: { lesson, onDone }.

import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import "./recap-module.css";

interface RecapData {
  teacher_mn?: string;
}

export default function RecapModule({
  lesson,
  onDone,
}: {
  lesson: HskLessonPackage;
  onDone: () => void;
}) {
  const data = lesson.recap as RecapData | undefined;
  const teacher = data?.teacher_mn;

  // "Өнөөдөр юу сурав" — тоог өгөгдлөөс шууд бодно
  const vocabN = lesson.vocabulary?.length ?? 0;
  const dialogN = lesson.dialogues?.length ?? 0;
  const textN = lesson.texts?.length ?? 0;
  const grammarN = lesson.grammar?.length ?? 0;
  const pronN =
    (lesson.pronunciation as { items?: unknown[] } | undefined)?.items?.length ??
    0;

  return (
    <>
      <div className="bs-card bs-rc">
        {/* Баяр хүргэх толгой */}
        <div className="bs-rc-hero">
          <div className="bs-rc-ic" aria-hidden>
            🎉
          </div>
          <div className="bs-rc-title">Хичээл дууслаа!</div>
          <div className="bs-rc-sub">Сайн байна — нэг хичээлээ бүрэн дуусгалаа.</div>
        </div>

        {/* Багшийн төгсгөлийн үг */}
        {teacher && <div className="bs-rc-teacher">{teacher}</div>}

        {/* Өнөөдөр юу сурав */}
        <div className="bs-rc-learned">
          <div className="bs-label">
            <span className="bs-dot" />
            Өнөөдөр юу сурав
          </div>
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
            {pronN > 0 && (
              <span className="bs-chip">
                <span className="bs-n">{pronN}</span> дуудлага
              </span>
            )}
          </div>
        </div>
      </div>

      <button className="bs-cta" onClick={onDone}>
        Хичээлээ дуусгах ✓
      </button>
    </>
  );
}
