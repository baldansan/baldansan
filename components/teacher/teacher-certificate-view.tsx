"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ReportPrintStyles } from "@/components/reports/report-print-styles";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import {
  curriculumCourseLabel,
  type Classroom,
  type CurriculumProgressRow,
} from "@/lib/classroom/types";
import { getClassroomById } from "@/lib/supabase/classrooms";
import { getClassroomCurriculumProgress } from "@/lib/supabase/curriculum";

function todayText(): string {
  const d = new Date();
  return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()}`;
}

/**
 * Багш ангийнхаа «заавал хөтөлбөр»-ийг 100% дүүргэсэн сурагчид хэвлэж өгөх бичиг.
 * Зориуд энгийн: тамга, дугааргүй — аппын бүртгэлд үндэслэсэн курс дүүргэлтийн
 * тэмдэглэл. Хөтөлбөрөө дуусгаагүй сурагчид гарахгүй.
 */
export function TeacherCertificateView() {
  const params = useSearchParams();
  const classroomId = params.get("class") ?? "";
  const studentId = params.get("student") ?? "";
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [row, setRow] = useState<CurriculumProgressRow | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [issuedAt, setIssuedAt] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [c, p] = await Promise.all([
        getClassroomById(classroomId),
        getClassroomCurriculumProgress(classroomId),
      ]);
      if (!alive) return;
      setClassroom(c.data);
      setRow((p.data ?? []).find((r) => r.studentUserId === studentId) ?? null);
      setIssuedAt(todayText());
      setState(c.data ? "ready" : "error");
    })();
    return () => {
      alive = false;
    };
  }, [classroomId, studentId]);

  const eligible = Boolean(row && row.total > 0 && row.completed >= row.total);

  return (
    <TeacherShell active="help" showBottomNav={false}>
      <ReportPrintStyles orientation="landscape" />
      <div className="flex flex-wrap items-center justify-between gap-3" data-print-hide>
        <Link href="/teacher/reports" className="text-sm font-medium text-slate-600 hover:text-emerald-600">
          ← Тайлан
        </Link>
        {eligible ? (
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            🖨 Хэвлэх / PDF болгох
          </button>
        ) : null}
      </div>

      {state === "loading" ? (
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      ) : state === "error" || !classroom ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">Анги олдсонгүй.</p>
      ) : !eligible ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h1 className="text-lg font-bold text-slate-900">Гэрчилгээ олгох боломжгүй</h1>
          <p className="mt-2 text-sm text-slate-700">
            {row
              ? `Энэ сурагч ангийн заавал хөтөлбөрийн ${row.total} хичээлээс ${row.completed}-ийг дуусгасан байна. Бүгдийг дуусгасны дараа гэрчилгээ гарна.`
              : "Энэ ангид заавал хөтөлбөр тохируулаагүй эсвэл сурагч олдсонгүй. Ангийн хуудасны «Бүртгэл» хэсгээс хөтөлбөрөө тохируулна уу."}
          </p>
        </section>
      ) : (
        <article className="print-sheet mx-auto w-full max-w-[1000px] rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-6">
          <div className="print-box flex flex-col gap-6 border-2 border-slate-900 px-8 py-10 text-center sm:px-14 sm:py-14">
            <header>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                Бөөндөө Сурцгаая
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Курс дүүргэлтийн бичиг
              </h1>
            </header>
            <div>
              <p className="text-sm text-slate-700">Энэхүү бичгийг</p>
              <p
                className="mx-auto mt-2 max-w-xl border-b border-slate-400 pb-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                translate="no"
              >
                {row?.displayName}
              </p>
              <p className="mt-4 text-sm text-slate-700">
                нь «<span translate="no">{classroom.name}</span>» ангийн заавал хөтөлбөрийг бүрэн
                дүүргэсэн тул олгов:
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {curriculumCourseLabel(classroom.curriculumCourseId) || classroom.level || "Хятад хэл"}{" "}
                · {row?.total} хичээл
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-10 text-sm text-slate-700">
              <div>
                <p className="border-t border-slate-400 pt-2">Огноо: {issuedAt}</p>
              </div>
              <div>
                <p className="border-t border-slate-400 pt-2">Багш (гарын үсэг)</p>
              </div>
            </div>
            <p className="text-[11px] leading-5 text-slate-500">
              Аппын сургалтын бүртгэлд үндэслэсэн курс дүүргэлтийн тэмдэглэл. Албан ёсны
              HSK/YCT шалгалтын гэрчилгээ биш.
            </p>
          </div>
        </article>
      )}
    </TeacherShell>
  );
}
