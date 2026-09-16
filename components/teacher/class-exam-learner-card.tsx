"use client";

/**
 * Суралцагчид харагдах хэсэг: багшийн ангид товлосон HSK загвар шалгалт.
 *
 * Файлын нэр components/teacher/class-exam-* загварыг дагасан ч энэ нь
 * СУРАЛЦАГЧИЙН талын бүрэлдэхүүн — /review/tests хуудсанд байрлана.
 * Товлосон шалгалт байхгүй бол юу ч үзүүлэхгүй (нэмэлт, саад болохгүй).
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  examDisplayTitle,
  type LearnerExamStatusLabel,
} from "@/lib/classroom/exam-types";
import {
  getLearnerClassExams,
  type LearnerClassExam,
} from "@/lib/supabase/class-mock-exams";

function statusText(exam: LearnerClassExam): LearnerExamStatusLabel {
  if (!exam.sat) return "Өгөөгүй";
  if (exam.passed === true) return "Тэнцсэн";
  if (exam.passed === false) return "Тэнцээгүй";
  return "Дүн хүлээгдэж байна";
}

export function ClassExamLearnerCard() {
  const [exams, setExams] = useState<LearnerClassExam[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await getLearnerClassExams();
      if (cancelled) return;
      setExams(data ?? []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (exams.length === 0) return null;

  return (
    <section className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-emerald-200">
      <h2 className="text-base font-semibold text-slate-900">
        Багшийн товлосон шалгалт
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Ангид чинь товлогдсон HSK загвар шалгалт.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {exams.map((exam) => (
          <li
            key={exam.id}
            className="rounded-xl bg-slate-50 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-slate-900">
                {examDisplayTitle(exam)}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  exam.passed === true
                    ? "bg-emerald-100 text-emerald-800"
                    : exam.sat
                      ? "bg-slate-200 text-slate-700"
                      : "bg-amber-100 text-amber-900"
                }`}
              >
                {statusText(exam)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {exam.classroomName ? `${exam.classroomName} · ` : ""}
              {exam.scheduledFor
                ? `Шалгалтын өдөр ${exam.scheduledFor}`
                : "Өдөр товлоогүй"}
              {exam.dueDate ? ` · Дуусах ${exam.dueDate}` : ""}
            </p>
            {exam.sat && exam.score != null ? (
              <p className="mt-0.5 text-xs text-slate-600">
                Оноо {exam.score}
                {exam.maxScore != null ? `/${exam.maxScore}` : ""}
                {exam.percentage != null ? ` · ${exam.percentage}%` : ""}
              </p>
            ) : (
              <Link
                href={`/test/${exam.testId}`}
                className="mt-2 inline-flex rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Шалгалт өгөх
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
