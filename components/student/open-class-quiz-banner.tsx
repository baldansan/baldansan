"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyOpenClassQuizzes, type OpenClassQuiz } from "@/lib/supabase/class-quizzes";
import { isClassStudent } from "@/lib/student/records";

/** «Миний дүн» холбоос — зөвхөн ангид бүртгэлтэй сурагчид харагдана. */
export function MyRecordsLink() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let off = false;
    void isClassStudent()
      .then((v) => {
        if (!off) setShow(v);
      })
      .catch(() => {
        /* чимээгүй */
      });
    return () => {
      off = true;
    };
  }, []);
  if (!show) return null;
  return (
    <Link
      href="/study/records"
      className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
    >
      📊 Миний дүн →
    </Link>
  );
}

/**
 * Ангийн нээлттэй хурдан сорил байвал богино баннер. Ангид бүртгэлгүй
 * хэрэглэгчид юу ч харагдахгүй (RPC хоосон буцаана).
 */
export function OpenClassQuizBanner() {
  const [quizzes, setQuizzes] = useState<OpenClassQuiz[]>([]);

  useEffect(() => {
    let off = false;
    void getMyOpenClassQuizzes()
      .then((list) => {
        if (!off) setQuizzes(list.filter((q) => !q.submitted));
      })
      .catch(() => {
        /* чимээгүй */
      });
    return () => {
      off = true;
    };
  }, []);

  if (quizzes.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" role="status">
      {quizzes.map((q) => (
        <Link
          key={q.quizId}
          href={`/study/class-quiz/${q.quizId}`}
          className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-white shadow-sm hover:bg-emerald-700"
        >
          <span className="min-w-0">
            <span className="block text-xs font-semibold opacity-90">Хурдан сорил нээгдсэн</span>
            <span className="block truncate text-sm font-bold" translate="no">
              {q.title}
            </span>
            <span className="text-xs opacity-90">
              {q.questionCount} асуулт · {q.durationMinutes} мин
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-emerald-700">Эхлэх</span>
        </Link>
      ))}
    </div>
  );
}
