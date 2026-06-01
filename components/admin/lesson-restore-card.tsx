"use client";

import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import type { BulkImportMode } from "@/lib/supabase/admin-import";
import {
  parseLessonBackupPreview,
  restoreLessonFromBackup,
  type LessonBackupPreview,
} from "@/lib/supabase/admin-restore";

type Props = {
  lessonId: string;
  orderIndex: number;
  onRestoreSuccess?: () => void;
};

export function LessonRestoreCard({
  lessonId,
  orderIndex,
  onRestoreSuccess,
}: Props) {
  const router = useRouter();
  const [rawJson, setRawJson] = useState("");
  const [mode, setMode] = useState<BulkImportMode>("replace");
  const [restoreMetadata, setRestoreMetadata] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [preview, setPreview] = useState<LessonBackupPreview | null>(null);
  const [busy, setBusy] = useState<"preview" | "restore" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const needsConfirm = mode === "replace";

  const handlePreview = useCallback(() => {
    setError(null);
    setSuccess(null);
    setBusy("preview");
    const result = parseLessonBackupPreview(rawJson);
    setBusy(null);
    setPreview(result);
    if (!result.validation.valid) {
      setError(result.validation.errors.join(" "));
      return;
    }
    setSuccess("Backup JSON зөв. Restore хийж болно.");
  }, [rawJson]);

  const handleRestore = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (needsConfirm && !confirmed) {
      setError("Replace үйлдлийг баталгаажуулна уу.");
      return;
    }

    setBusy("restore");
    const result = await restoreLessonFromBackup(lessonId, rawJson, {
      mode,
      restoreMetadata,
      currentOrderIndex: orderIndex,
    });
    setBusy(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(
      result.data
        ? `Backup restore амжилттай (${result.data.mode}${result.data.restoreMetadata ? ", metadata" : ", content only"}).`
        : "Backup restore амжилттай."
    );
    onRestoreSuccess?.();
    router.refresh();
  }, [
    lessonId,
    rawJson,
    mode,
    restoreMetadata,
    orderIndex,
    needsConfirm,
    confirmed,
    onRestoreSuccess,
    router,
  ]);

  return (
    <AdminEditorSection
      title="Restore from backup JSON"
      description="Export backup JSON-оо энд paste хийж одоогийн хичээлд сэргээнэ. Lesson ID өөрчлөгдөхгүй; user progress хөндөгдөхгүй."
    >
      <label className="block text-sm font-medium text-slate-700">
        Backup JSON
        <textarea
          value={rawJson}
          onChange={(e) => {
            setRawJson(e.target.value);
            setPreview(null);
            setConfirmed(false);
          }}
          rows={12}
          placeholder='Export backup эсвэл { "lesson", "subtitles", "vocabulary", "quizQuestions" }'
          className={`${adminInputClass} font-mono text-xs`}
          spellCheck={false}
        />
      </label>

      <div className="mt-4 flex flex-col gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name={`restore-mode-${lessonId}`}
            checked={mode === "append"}
            onChange={() => {
              setMode("append");
              setConfirmed(false);
            }}
            className="text-emerald-600 focus:ring-emerald-500"
          />
          Append to existing content
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name={`restore-mode-${lessonId}`}
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
            className="text-emerald-600 focus:ring-emerald-500"
          />
          Replace current content
        </label>
      </div>

      {mode === "replace" ? (
        <div className="mt-3 space-y-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p>
            Replace нь одоогийн subtitle/vocabulary/quiz-г устгаад backup-аас
            дахин оруулна.
          </p>
          <p>
            Энэ үйлдэл буцаах боломжгүй байж магадгүй. Export backup хийсэн
            эсэхээ шалгана уу.
          </p>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Би энэ үйлдлийг ойлгож байна.</span>
          </label>
        </div>
      ) : null}

      <fieldset className="mt-4 flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700">
          Restore scope
        </legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name={`restore-scope-${lessonId}`}
            checked={!restoreMetadata}
            onChange={() => setRestoreMetadata(false)}
            className="text-emerald-600 focus:ring-emerald-500"
          />
          Restore content only (ignore lesson metadata)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name={`restore-scope-${lessonId}`}
            checked={restoreMetadata}
            onChange={() => setRestoreMetadata(true)}
            className="text-emerald-600 focus:ring-emerald-500"
          />
          Restore metadata + content (status → draft if backup was available)
        </label>
      </fieldset>

      {preview?.validation.valid ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
          <p className="font-semibold text-slate-900">Backup summary</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {preview.summary.sourceLessonId ? (
              <li>Source lesson: {preview.summary.sourceLessonId}</li>
            ) : null}
            {preview.summary.title ? (
              <li>Title: {preview.summary.title}</li>
            ) : null}
            <li>Subtitles: {preview.summary.subtitleCount}</li>
            <li>Vocabulary: {preview.summary.vocabularyCount}</li>
            <li>Quiz: {preview.summary.quizCount}</li>
            {preview.summary.exportedAt ? (
              <li>Exported: {formatMongoliaDateTimeWithLabel(preview.summary.exportedAt)}</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="mt-4">
        <AdminAlert error={error} success={success} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null || !rawJson.trim()}
          onClick={handlePreview}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy === "preview" ? "Parsing…" : "Parse backup"}
        </button>
        <button
          type="button"
          disabled={
            busy !== null ||
            !rawJson.trim() ||
            (needsConfirm && !confirmed)
          }
          onClick={handleRestore}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {busy === "restore" ? "Restoring…" : "Restore backup"}
        </button>
      </div>
    </AdminEditorSection>
  );
}
