"use client";

import Link from "next/link";
import { lessonPath } from "@/lib/content";
import { analyzeLessonQa } from "@/lib/admin/lesson-qa";
import { LessonQaBadge } from "@/components/admin/lesson-qa-badge";
import {
  lessonToFormValues,
  LessonFormFields,
} from "@/components/admin/lesson-form-fields";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
};

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function LessonEditForm({ lesson }: Props) {
  const values = lessonToFormValues(lesson);
  const qa = analyzeLessonQa(lesson);

  const previewSubtitles = lesson.timedSubtitles.slice(0, 3);
  const previewVocabulary = lesson.vocabulary.slice(0, 5);
  const previewQuiz = lesson.quizQuestions.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Хичээл засах · {lesson.id}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Унших горим — контент preview. Хадгалах идэвхгүй.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <LessonQaBadge status={qa.qaStatus} />
          {qa.warnings.length > 0 ? (
            <span className="text-xs text-amber-800">
              {qa.warnings.join(" · ")}
            </span>
          ) : null}
        </div>
      </div>

      <PreviewSection title="Metadata preview">
        <LessonFormFields values={values} readOnly />
      </PreviewSection>

      <PreviewSection
        title={`Subtitle lines (${qa.subtitleCount} total)`}
      >
        {previewSubtitles.length === 0 ? (
          <p className="text-sm text-amber-800">No subtitles</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {previewSubtitles.map((line, i) => (
              <li
                key={`${line.start}-${i}`}
                className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100"
              >
                <span className="font-mono text-xs text-slate-500">
                  {line.start} – {line.end}
                </span>
                <p className="mt-1">{line.chinese}</p>
                <p className="text-xs text-slate-500">{line.mongolian}</p>
              </li>
            ))}
          </ul>
        )}
        {qa.subtitleCount > 3 ? (
          <p className="mt-2 text-xs text-slate-500">
            + {qa.subtitleCount - 3} more lines
          </p>
        ) : null}
      </PreviewSection>

      <PreviewSection
        title={`Vocabulary (${qa.vocabularyActual} / meta ${lesson.vocabularyCount})`}
      >
        {previewVocabulary.length === 0 ? (
          <p className="text-sm text-amber-800">No vocabulary</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-700">
            {previewVocabulary.map((word, i) => (
              <li key={`${word.chinese}-${i}`}>
                <span className="font-medium">{word.chinese}</span>
                {word.pinyin ? (
                  <span className="text-slate-500"> · {word.pinyin}</span>
                ) : null}
                {word.hskLevel ? (
                  <span className="ml-1 text-xs text-emerald-700">
                    {word.hskLevel}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {qa.vocabularyActual > 5 ? (
          <p className="mt-2 text-xs text-slate-500">
            + {qa.vocabularyActual - 5} more words
          </p>
        ) : null}
      </PreviewSection>

      <PreviewSection
        title={`Quiz (${qa.quizActual} / meta ${lesson.quizCount})`}
      >
        {previewQuiz.length === 0 ? (
          <p className="text-sm text-amber-800">No quiz questions</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {previewQuiz.map((q, i) => (
              <li key={`quiz-${i}`}>
                <p>{q.question}</p>
                <p className="text-xs text-slate-500">{q.type}</p>
              </li>
            ))}
          </ol>
        )}
        {qa.quizActual > 3 ? (
          <p className="mt-2 text-xs text-slate-500">
            + {qa.quizActual - 3} more questions
          </p>
        ) : null}
      </PreviewSection>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500"
          >
            Update lesson — coming soon
          </button>
          <Link
            href={lessonPath(lesson.id)}
            className="inline-flex justify-center rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Preview public lesson →
          </Link>
          <Link
            href="/admin/lessons"
            className="inline-flex justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            ← Content QA
          </Link>
        </div>
      </section>
    </div>
  );
}
