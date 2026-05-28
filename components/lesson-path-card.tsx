import Link from "next/link";
import {
  lessonQuizPath,
  lessonVocabularyPath,
  lessonWatchPath,
} from "@/lib/content";

type Props = {
  lessonId: string;
};

const steps = [
  { step: 1, label: "Watch", path: lessonWatchPath },
  { step: 2, label: "Vocabulary", path: lessonVocabularyPath },
  { step: 3, label: "Quiz", path: lessonQuizPath },
] as const;

export function LessonPathCard({ lessonId }: Props) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-200 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900">Lesson path</h2>
      <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-3">
        {steps.map(({ step, label, path }) => (
          <li key={label} className="flex-1">
            <Link
              href={path(lessonId)}
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                {step}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
