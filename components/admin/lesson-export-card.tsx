"use client";

import { useCallback, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import {
  getLessonExportPayload,
  type LessonExportPayload,
} from "@/lib/supabase/admin-export";

type Props = {
  lessonId: string;
};

export function LessonExportCard({ lessonId }: Props) {
  const [jsonText, setJsonText] = useState("");
  const [stats, setStats] = useState<{
    subtitles: number;
    vocabulary: number;
    quizQuestions: number;
    status: string;
    exportedAt: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const applyPayload = useCallback((payload: LessonExportPayload, json: string) => {
    setJsonText(json);
    setStats({
      subtitles: payload.subtitles.length,
      vocabulary: payload.vocabulary.length,
      quizQuestions: payload.quizQuestions.length,
      status: payload.lesson.status,
      exportedAt: payload.exportedAt,
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);

    const payloadResult = await getLessonExportPayload(lessonId);
    if (payloadResult.error || !payloadResult.data) {
      setBusy(false);
      setError(payloadResult.error ?? "Export амжилтгүй.");
      return;
    }

    setBusy(false);

    applyPayload(
      payloadResult.data,
      JSON.stringify(payloadResult.data, null, 2)
    );
    setSuccess("Export JSON бэлэн боллоо.");
  }, [lessonId, applyPayload]);

  const handleCopy = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!jsonText.trim()) {
      setError("Эхлээд Generate export JSON дарна уу.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonText);
        setSuccess("JSON clipboard руу хууллаа.");
        return;
      }
    } catch {
      // fallback below
    }

    const textarea = document.getElementById(
      `lesson-export-json-${lessonId}`
    ) as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
        setSuccess("JSON clipboard руу хууллаа.");
        return;
      } catch {
        setError("Clipboard ашиглах боломжгүй. Textarea-аас гараар хуулна уу.");
      }
    }
  }, [jsonText, lessonId]);

  const handleDownload = useCallback(() => {
    setError(null);
    setSuccess(null);

    if (!jsonText.trim()) {
      setError("Эхлээд Generate export JSON дарна уу.");
      return;
    }

    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lesson-${lessonId}-backup.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSuccess(`Файл татагдлаа: lesson-${lessonId}-backup.json`);
  }, [jsonText, lessonId]);

  const handleClear = useCallback(() => {
    setJsonText("");
    setStats(null);
    setError(null);
    setSuccess(null);
  }, []);

  return (
    <AdminEditorSection
      title="Export lesson backup"
      description="Энэ хичээлийн metadata, subtitle, vocabulary, quiz-г JSON backup болгон хуулна. Bulk import-д content array-уудыг paste хийж болно (`lesson` блокийг import үл тооно)."
    >
      {stats ? (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
            Subtitles: {stats.subtitles}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
            Vocabulary: {stats.vocabulary}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
            Quiz: {stats.quizQuestions}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-emerald-200">
            Status: {stats.status}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
            Exported: {new Date(stats.exportedAt).toLocaleString()}
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy}
          onClick={handleGenerate}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {busy ? "Generating…" : "Generate export JSON"}
        </button>
        <button
          type="button"
          disabled={!jsonText.trim()}
          onClick={handleCopy}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"
        >
          Copy JSON
        </button>
        <button
          type="button"
          disabled={!jsonText.trim()}
          onClick={handleDownload}
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
        >
          Clear
        </button>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Export JSON
        <textarea
          id={`lesson-export-json-${lessonId}`}
          className={`${adminInputClass} mt-1 min-h-[220px] font-mono text-xs`}
          value={jsonText}
          readOnly
          placeholder="Generate export JSON дарсны дараа энд харагдана."
          rows={12}
        />
      </label>

      <div className="mt-4">
        <AdminAlert error={error} success={success} />
      </div>
    </AdminEditorSection>
  );
}
