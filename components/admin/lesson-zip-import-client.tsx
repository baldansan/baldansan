"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  AdminAlert,
  AdminCollapsibleSection,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import {
  ZipImportSummary,
  getZipImportSummaryStatus,
} from "@/components/admin/zip-import-summary";
import { ZipImportValidationErrors } from "@/components/admin/zip-import-validation-errors";
import {
  buildImportDraftApiBody,
  type ImportDraftApiBody,
} from "@/lib/admin/build-import-draft-request";
import type { LessonPackageImportResult } from "@/lib/admin/import-lesson-package";
import { finalizePackageMediaImport } from "@/lib/admin/package-media-import";
import { parseChineseLessonZip } from "@/lib/import/chinese-lesson-zip-import";
import { parseKoreanLessonZip } from "@/lib/import/korean-lesson-zip-import";
import { KOREAN_COURSE_SETUP_SQL } from "@/lib/import/korean-lesson-normalize";
import {
  parseLessonZip,
  type LessonZipValidation,
} from "@/lib/import/lesson-zip-import";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { collectValidationErrorMessages } from "@/lib/import/format-validation-error";

const LESSON_DRAFTS_STORAGE_KEY = "lesson_drafts";

import type { LessonImportTrack } from "@/lib/import/import-track";

type Props = {
  track: LessonImportTrack;
  title: string;
  description: string;
  backHref?: string;
  templateHint?: string;
  formatDocHint?: string;
  showCourseSetupHint?: boolean;
};

const btnPrimary =
  "inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
const btnSecondary =
  "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700";

export function LessonZipImportClient({
  track,
  title,
  description,
  backHref = "/admin/import",
  templateHint = "content/templates/lesson-zip-package/",
  formatDocHint = "LESSON_ZIP_IMPORT_FORMAT.md",
  showCourseSetupHint = false,
}: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<LessonZipValidation | null>(null);
  const [importResult, setImportResult] = useState<LessonPackageImportResult | null>(
    null
  );
  const [busy, setBusy] = useState<"parse" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseZip = useMemo(() => {
    if (track === "chinese") return parseChineseLessonZip;
    if (track === "korean") return parseKoreanLessonZip;
    return parseLessonZip;
  }, [track]);

  const clearAll = useCallback(() => {
    setFile(null);
    setValidation(null);
    setImportResult(null);
    setError(null);
    setBusy(null);
  }, []);

  async function handleParse() {
    if (!file) {
      setError("ZIP файл сонгоно уу.");
      return;
    }

    setBusy("parse");
    setError(null);
    setImportResult(null);

    try {
      const result = await parseZip(file);
      setValidation(result);

      const errorMessages = result.wrongImporter
        ? []
        : collectValidationErrorMessages(result);

      console.log("[lesson-zip-import] parse / validate result", {
        track,
        ok: result.ok,
        wrongImporter: result.wrongImporter ?? null,
        errorCount: errorMessages.length,
        errors: errorMessages,
        warnings: result.warnings,
        preview: result.preview,
        importPayload: result.importPayload
          ? {
              subtitles: result.importPayload.subtitles.length,
              vocabulary: result.importPayload.vocabulary.length,
              quizQuestions: result.importPayload.quizQuestions.length,
            }
          : null,
        contentValidation: result.contentValidation,
      });

      if (result.wrongImporter) {
        setError(null);
        return;
      }
      if (!result.ok || errorMessages.length > 0) {
        setError("Validation алдаатай — доорх алдааг засна уу.");
      }
    } catch {
      setError("ZIP parse хийхэд алдаа гарлаа.");
      setValidation(null);
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    setBusy("import");
    setError(null);

    try {
      let packageToImport = validation;

      if (
        !packageToImport?.ok ||
        !packageToImport.importPayload ||
        !packageToImport.preview ||
        !packageToImport.lesson
      ) {
        if (!file) {
          setError("ZIP parse data missing. Please validate again.");
          return;
        }
        packageToImport = await parseZip(file);
        setValidation(packageToImport);
        if (!packageToImport.ok) {
          setError("Validation алдаатай — import хийх боломжгүй.");
          return;
        }
      }

      const payload = buildImportDraftApiBody(packageToImport, {
        importTrack: track === "legacy" ? "legacy" : track,
        allowAutoCreateCourse: track !== "korean",
      });
      if (!payload) {
        setError("ZIP parse data missing. Please validate again.");
        return;
      }

      const response = await fetch("/api/admin/import/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let result: LessonPackageImportResult;
      try {
        result = JSON.parse(responseText) as LessonPackageImportResult;
      } catch {
        setError(
          `Import failed (${response.status}): ${responseText.slice(0, 200) || "Invalid response"}`
        );
        return;
      }

      if (!response.ok || !result.ok) {
        const detailLines =
          result.validationDetails?.map((detail) => {
            const parts = [
              detail.section ? `[${detail.section}]` : null,
              detail.field ? `${detail.field}:` : null,
              detail.reason,
              detail.lessonId ? `(lessonId: ${detail.lessonId})` : null,
            ].filter(Boolean);
            return parts.join(" ");
          }) ?? [];
        const message =
          detailLines.length > 0
            ? `Import failed\n${detailLines.join("\n")}`
            : result.errors?.join(" ") ||
              `Import failed with status ${response.status}.`;
        setError(message);
        setImportResult(result);
        return;
      }

      if (packageToImport.mediaFiles.length > 0) {
        const mediaResult = await finalizePackageMediaImport({
          validation: packageToImport,
          courseId: payload.courseId,
          lessonId: result.lessonId,
        });
        result = {
          ...result,
          mediaUploaded: mediaResult.mediaUploaded,
          uploadedImageCount: mediaResult.uploadedImageCount,
          mediaImageCount: mediaResult.mediaImageCount,
          heroImageFound: mediaResult.heroImageFound,
          imageStorageStatus: mediaResult.imageStorageStatus,
          mediaFailures: mediaResult.mediaFailures,
          warnings: [...(result.warnings ?? []), ...mediaResult.warnings],
          audioUrl: mediaResult.audioUrl ?? result.audioUrl,
          thumbnailUrl: mediaResult.thumbnailUrl ?? result.thumbnailUrl,
        };
      }

      setImportResult(result);

      try {
        const existingRaw = localStorage.getItem(LESSON_DRAFTS_STORAGE_KEY);
        const existing = existingRaw
          ? (JSON.parse(existingRaw) as ImportDraftApiBody[])
          : [];
        const next = [
          payload,
          ...existing.filter((item) => item.lessonId !== payload.lessonId),
        ].slice(0, 20);
        localStorage.setItem(LESSON_DRAFTS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage debug fallback is optional
      }

      router.refresh();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Import хийхэд алдаа гарлаа."
      );
    } finally {
      setBusy(null);
    }
  }

  const lessonId = importResult?.lessonId ?? validation?.preview?.lessonId;
  const wrongImporter = validation?.wrongImporter;
  const canImport =
    !wrongImporter &&
    validation?.ok &&
    (validation.errors.length ?? 0) === 0 &&
    Boolean(validation.importPayload);
  const importComplete = Boolean(importResult?.ok && lessonId);
  const showKoreanCourseSql =
    showCourseSetupHint &&
    error?.includes("course байхгүй байна");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={backHref}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← Import hub
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
          {track === "chinese" ? (
            <p className="mt-2 text-xs text-slate-500">
              Зөвхөн Хятад/HSK ZIP энд upload хийнэ. Солонгос package бол{" "}
              <Link href="/admin/import/korean" className="font-medium text-emerald-700">
                Korean importer
              </Link>{" "}
              ашиглана.
            </p>
          ) : track === "korean" ? (
            <p className="mt-2 text-xs text-slate-500">
              Зөвхөн Солонгос номын ZIP энд upload хийнэ. HSK package бол{" "}
              <Link href="/admin/import/chinese" className="font-medium text-emerald-700">
                Chinese importer
              </Link>{" "}
              ашиглана.
            </p>
          ) : null}
        </div>
      </div>

      {wrongImporter ? (
        <section className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200 sm:p-6">
          <h2 className="text-base font-semibold text-red-900">
            Буруу importer сонгогдлоо
          </h2>
          <p className="mt-2 text-sm text-red-800">{wrongImporter.message}</p>
          <p className="mt-2 text-xs text-red-700">
            Илрүүлсэн төрөл: {wrongImporter.detectedTrack} ({wrongImporter.reason})
          </p>
          <Link href={wrongImporter.redirectHref} className={`${btnPrimary} mt-4`}>
            {wrongImporter.redirectHref} руу очих
          </Link>
        </section>
      ) : null}

      <AdminEditorSection
        title="ZIP package"
        description="ZIP файл сонгоод Parse / Validate дарна."
      >
        <input
          type="file"
          accept=".zip,application/zip"
          className={adminInputClass}
          onChange={(event) => {
            const next = event.target.files?.[0] ?? null;
            setFile(next);
            setValidation(null);
            setImportResult(null);
            setError(null);
          }}
        />
        {file ? (
          <p className="mt-2 text-sm text-slate-600">
            Сонгосон файл: <strong>{file.name}</strong> (
            {Math.round(file.size / 1024)} KB)
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            disabled={!file || busy !== null}
            onClick={() => {
              void handleParse();
            }}
          >
            {busy === "parse" ? "Parsing…" : "Parse / Validate"}
          </button>
        </div>
      </AdminEditorSection>

      {error ? <AdminAlert error={error} /> : null}

      {validation && !wrongImporter && (!validation.ok || validation.errors.length > 0) ? (
        <ZipImportValidationErrors validation={validation} />
      ) : null}

      {showKoreanCourseSql ? (
        <AdminCollapsibleSection
          title="korean-1 course setup SQL"
          description="Run in Supabase SQL editor before importing Korean lessons."
        >
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
            {KOREAN_COURSE_SETUP_SQL}
          </pre>
        </AdminCollapsibleSection>
      ) : null}

      {validation?.preview && !wrongImporter ? (
        <ZipImportSummary
          preview={validation.preview}
          validation={validation}
          track={track}
        />
      ) : null}

      {!importComplete && validation?.preview && !wrongImporter ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            disabled={!canImport || busy !== null}
            onClick={() => {
              void handleImport();
            }}
          >
            {busy === "import" ? "Importing…" : "Import as draft"}
          </button>
          <button type="button" className={btnGhost} onClick={clearAll}>
            Clear
          </button>
          <Link href="/admin/lessons" className={btnSecondary}>
            Go to lessons
          </Link>
        </div>
      ) : null}

      {importResult && !importResult.ok ? (
        <section className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200 sm:p-6">
          <h2 className="text-base font-semibold text-red-900">Import failed</h2>
          <p className="mt-1 text-sm text-red-800">
            Lesson ID: <strong>{importResult.lessonId || validation?.preview?.lessonId}</strong>
          </p>
          {importResult.validationDetails?.length ? (
            <ul className="mt-3 space-y-2 text-sm text-red-900">
              {importResult.validationDetails.map((detail, index) => (
                <li
                  key={`${detail.field}-${index}`}
                  className="rounded-lg bg-white/70 px-3 py-2 ring-1 ring-red-100"
                >
                  {detail.section ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                      {detail.section}
                    </p>
                  ) : null}
                  {detail.field ? (
                    <p className="text-xs font-medium text-red-800">{detail.field}</p>
                  ) : null}
                  <p className="mt-1">{detail.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-900">
              {(importResult.errors ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {importComplete && lessonId ? (
        <section className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 sm:p-6">
          <h2 className="text-base font-semibold text-emerald-900">
            Import complete
          </h2>
          <p className="mt-1 text-sm text-emerald-800">
            {importResult?.message ??
              (importResult?.created
                ? "Шинэ draft lesson үүсгээд import амжилттай хийлээ."
                : "Одоо байгаа draft lesson дээр import хийлээ.")}
          </p>
          <p className="mt-2 text-sm text-emerald-800">
            Lesson ID: <strong>{lessonId}</strong>
            {importResult?.packageLessonId &&
            importResult.packageLessonId !== lessonId ? (
              <>
                {" "}
                (package: <strong>{importResult.packageLessonId}</strong>)
              </>
            ) : null}
            . Vocabulary: {importResult?.vocabularyInserted}, quiz:{" "}
            {importResult?.quizInserted}
            {importResult?.oldQuizCountDeleted != null ? (
              <>
                {" "}
                (deleted {importResult.oldQuizCountDeleted}, inserted{" "}
                {importResult.newQuizCountInserted ?? importResult.quizInserted})
              </>
            ) : null}
            , subtitles: {importResult?.subtitlesInserted}.
            {importResult?.mediaUploaded != null ? (
              <>
                {" "}
                Media uploaded: {importResult.mediaUploaded}
                {importResult.uploadedImageCount != null ? (
                  <> ({importResult.uploadedImageCount} images)</>
                ) : null}
                .
              </>
            ) : null}
            {importResult?.imageStorageStatus ? (
              <>
                {" "}
                Image storage: {importResult.imageStorageStatus}.
              </>
            ) : null}
          </p>
          {importResult?.warnings.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
              {importResult.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/admin/lessons/${encodeURIComponent(lessonId)}/edit`}
              className={btnPrimary}
            >
              Edit lesson
            </Link>
            <Link
              href={lessonPreviewPath(lessonId, { adminPreview: true })}
              className={btnSecondary}
            >
              Preview lesson
            </Link>
            <Link
              href={`/lessons/${encodeURIComponent(lessonId)}/vocabulary?preview=admin`}
              className={btnSecondary}
            >
              Vocabulary
            </Link>
            <Link
              href={`/lessons/${encodeURIComponent(lessonId)}/quiz?preview=admin`}
              className={btnSecondary}
            >
              Quiz
            </Link>
            <Link href="/admin/lessons" className={btnSecondary}>
              Go to lessons
            </Link>
          </div>
        </section>
      ) : null}

      <AdminCollapsibleSection
        title="Format reference"
        description="Package structure and example files."
      >
        <p className="text-sm text-slate-600">
          Template:{" "}
          <code className="rounded bg-slate-100 px-1">{templateHint}</code>, doc:{" "}
          <code className="rounded bg-slate-100 px-1">{formatDocHint}</code>
        </p>
        {track === "chinese" ? (
          <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Expected validator schema (read-only)
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-600">
              {`No Zod — manual validators in lib/import/* and lib/supabase/admin-import.ts

ZIP layer (chinese-hsk):
  manifest.json  → packageVersion, courseType: chinese-hsk, courseId, lessonId,
                   hskLevel, lessonProfile (+ profile-specific sections)
  lesson.json    → courseId, titles (required for preview)
  vocabulary.json → array, each row: chinese + mongolian (required)
  quiz.json      → required for most HSK profiles
  Profile rules  → lib/import/chinese-hsk-validate.ts + chinese-hsk-profiles.ts

Bulk import layer (validateLessonImportPayload):
  vocabulary[]   → chinese|target + mongolian (required per row)
  quizQuestions[] → question|prompt + correctAnswer|answer;
                   multiple_choice needs options.length >= 2
  subtitles[]    → chinese|target + mongolian + start|startTime + end|endTime

Full package doc: docs/BUUNDUU_CHINESE_HSK_PACKAGE_V1.md`}
            </pre>
          </details>
        ) : null}
        {validation ? (
          <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Raw validation debug
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto text-xs text-slate-600">
              {JSON.stringify(
                {
                  track,
                  ok: validation.ok,
                  errors: validation.errors,
                  warnings: validation.warnings,
                  preview: validation.preview,
                },
                null,
                2
              )}
            </pre>
          </details>
        ) : null}
      </AdminCollapsibleSection>
    </div>
  );
}
