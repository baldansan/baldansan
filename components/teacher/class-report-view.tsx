"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReportActions } from "@/components/reports/report-actions";
import { ReportPrintStyles } from "@/components/reports/report-print-styles";
import { ClassReportSheet } from "@/components/teacher/class-report-sheet";
import {
  buildClassReport,
  buildClassReportMarkdown,
} from "@/lib/reports/class-report";
import {
  loadClassReportSource,
  type ClassReportSource,
} from "@/lib/reports/class-report-data";

type Props = {
  classroomId: string;
};

type State =
  | { phase: "loading" }
  | { phase: "failed"; error: string }
  | { phase: "ready"; source: ClassReportSource };

export function ClassReportView({ classroomId }: Props) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    loadClassReportSource(classroomId)
      .then((result) => {
        if (cancelled) return;
        setState(
          result.source
            ? { phase: "ready", source: result.source }
            : { phase: "failed", error: result.error ?? "Анги олдсонгүй." }
        );
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setState({
          phase: "failed",
          error:
            cause instanceof Error
              ? cause.message
              : "Тайлан ачаалахад алдаа гарлаа.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  const report = useMemo(() => {
    if (state.phase !== "ready") return null;
    return buildClassReport(
      state.source.analytics,
      state.source.students,
      state.source.meta
    );
  }, [state]);

  const markdown = useMemo(
    () => (report ? buildClassReportMarkdown(report) : ""),
    [report]
  );

  if (state.phase === "loading") {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 py-10">
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </div>
    );
  }

  if (state.phase === "failed" || !report) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 py-10">
        <p className="text-sm text-slate-600">
          {state.phase === "failed" ? state.error : "Анги олдсонгүй."}
        </p>
        <Link
          href={`/teacher/classes/${classroomId}`}
          className="mt-2 inline-block text-sm text-emerald-700"
        >
          ← Ангийн хуудас
        </Link>
      </div>
    );
  }

  const { warnings, error } = state.source;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <ReportPrintStyles orientation="portrait" />

      <div
        data-print-hide
        className="mx-auto mb-4 flex w-full max-w-[900px] flex-wrap items-center justify-between gap-3"
      >
        <Link
          href={`/teacher/classes/${classroomId}`}
          className="text-sm font-medium text-slate-600 hover:text-emerald-700"
        >
          ← {report.classroomName}
        </Link>
        <ReportActions
          markdown={markdown}
          filename={`angiin-tailan-${classroomId.slice(0, 8)}.md`}
        />
      </div>

      {error ? (
        <div
          data-print-hide
          className="mx-auto mb-4 w-full max-w-[900px] rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div
          data-print-hide
          className="mx-auto mb-4 w-full max-w-[900px] rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900"
        >
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <ClassReportSheet report={report} />

      <p
        data-print-hide
        className="mx-auto mt-4 w-full max-w-[900px] text-xs text-slate-500"
      >
        Хэвлэхэд хажуугийн цэс, товчнууд хасагдаж, A4 цаасанд хар цагаанаар
        буулгана. Хөтчийн хэвлэх цонхонд «Headers and footers» сонголтыг
        унтраавал илүү цэвэр гарна.
      </p>
    </div>
  );
}
