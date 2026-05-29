"use client";

import Link from "next/link";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";

type Props = {
  lessonId: string;
};

/** Subtle teacher CTA on lesson detail — logged-in users only */
export function TeacherAssignmentCta({ lessonId }: Props) {
  const { loggedIn } = useTeacherAuth();

  if (loggedIn !== true) return null;

  return (
    <section className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 ring-1 ring-emerald-100 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        Багш нарт
      </p>
      <p className="mt-1 text-sm text-slate-700">
        Багшийн assignment-д ашиглах — Lesson {lessonId}
      </p>
      <Link
        href={`/teacher/assignments/new?lesson=${lessonId}`}
        className="mt-3 inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        Assignment үүсгэх (preview) →
      </Link>
    </section>
  );
}
