"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import { AdminCard } from "@/components/admin/admin-card";
import { importLessonPackage } from "@/lib/admin/import-lesson-package";
import {
  parseLessonZip,
  type LessonImportPreview,
  type LessonZipValidation,
} from "@/lib/import/lesson-zip-import";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import type { LessonPackageImportResult } from "@/lib/admin/import-lesson-package";

const btnPrimary =
  "inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
const btnSecondary =
  "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700";

function PreviewCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function LessonZipImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<LessonZipValidation | null>(null);
  const [preview, setPreview] = useState<LessonImportPreview | null>(null);
  const [importResult, setImportResult] = useState<LessonPackageImportResult | null>(
    null
  );
  const [busy, setBusy] = useState<"parse" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearAll = useCallback(() => {
    setFile(null);
    setValidation(null);
    setPreview(null);
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
      const result = await parseLessonZip(file);
      setValidation(result);
      setPreview(result.preview);
      if (!result.ok) {
        setError("Validation алдаатай — доорх errors-ийг засна уу.");
      }
    } catch {
      setError("ZIP parse хийхэд алдаа гарлаа.");
      setValidation(null);
      setPreview(null);
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    if (!validation?.ok) {
      setError("Эхлээд validation амжилттай болго.");
      return;
    }

    setBusy("import");
    setError(null);

    try {
      const result = await importLessonPackage(validation);
      setImportResult(result);
      if (!result.ok) {
        setError(result.errors.join(" ") || "Import амжилтгүй.");
      }
    } catch {
      setError("Import хийхэд алдаа гарлаа.");
    } finally {
      setBusy(null);
    }
  }

  const lessonId = importResult?.lessonId ?? preview?.lessonId;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lesson ZIP Import</h1>
          <p className="mt-1 text-sm text-slate-600">
            Солонгос/Хятад хичээлийн ZIP package upload хийж lesson, vocabulary,
            quiz, audio, image импортолно.
          </p>
        </div>
        <Link href="/admin/lessons" className={btnSecondary}>
          ← Lessons
        </Link>
      </div>

      <AdminEditorSection
        title="ZIP package upload"
        description="manifest.json, lesson.json, vocabulary.json, quiz.json заавал. subtitles.json, audio/, images/ нэмэлт."
      >
        <input
          type="file"
          accept=".zip,application/zip"
          className={adminInputClass}
          onChange={(event) => {
            const next = event.target.files?.[0] ?? null;
            setFile(next);
            setValidation(null);
            setPreview(null);
            setImportResult(null);
            setError(null);
          }}
        />
        {file ? (
          <p className="mt-2 text-sm text-slate-600">
            Сонгосон файл: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
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
          <button
            type="button"
            className={btnSecondary}
            disabled={!validation?.ok || busy !== null}
            onClick={() => {
              void handleImport();
            }}
          >
            {busy === "import" ? "Importing…" : "Import as draft"}
          </button>
          <button type="button" className={btnGhost} onClick={clearAll}>
            Clear
          </button>
        </div>
      </AdminEditorSection>

      {error ? <AdminAlert error={error} /> : null}

      {preview ? (
        <AdminCard title="Import preview" description="Parsed package summary.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PreviewCard label="Course ID" value={preview.courseId} />
            <PreviewCard label="Language" value={preview.language} />
            <PreviewCard label="Lesson ID" value={preview.lessonId} />
            <PreviewCard label="Title" value={preview.title} />
            <PreviewCard label="Vocabulary count" value={preview.vocabularyCount} />
            <PreviewCard label="Quiz count" value={preview.quizCount} />
            <PreviewCard label="Subtitles" value={preview.subtitleCount} />
            <PreviewCard label="Audio files" value={preview.audioFileCount} />
            <PreviewCard label="Image files" value={preview.imageFileCount} />
          </div>
          {preview.mongolianTitle ? (
            <p className="mt-3 text-sm text-slate-600">
              Mongolian title: {preview.mongolianTitle}
            </p>
          ) : null}
          {preview.source ? (
            <p className="mt-1 text-sm text-slate-600">Source: {preview.source}</p>
          ) : null}
        </AdminCard>
      ) : null}

      {validation?.errors.length ? (
        <AdminCard title="Validation errors" description="Import blocked until fixed.">
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
            {validation.errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      {validation?.warnings.length ? (
        <AdminCard title="Warnings" description="Import allowed; review before publish.">
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
            {validation.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      {importResult?.ok && lessonId ? (
        <AdminCard title="Import complete" description="Draft lesson ready for QA.">
          <p className="text-sm text-emerald-800">
            Lesson <strong>{lessonId}</strong> imported as draft. Vocabulary:{" "}
            {importResult.vocabularyInserted}, quiz: {importResult.quizInserted},
            subtitles: {importResult.subtitlesInserted}, media uploaded:{" "}
            {importResult.mediaUploaded}.
          </p>
          {importResult.warnings.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-800">
              {importResult.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/admin/lessons/${lessonId}/edit`} className={btnPrimary}>
              View admin lesson
            </Link>
            <Link
              href={lessonPreviewPath(lessonId, { adminPreview: true })}
              className={btnSecondary}
            >
              Preview lesson
            </Link>
            <Link
              href={lessonPreviewPath(lessonId, {
                adminPreview: true,
                subpath: "vocabulary",
              })}
              className={btnSecondary}
            >
              Vocabulary
            </Link>
            <Link
              href={lessonPreviewPath(lessonId, {
                adminPreview: true,
                subpath: "quiz",
              })}
              className={btnSecondary}
            >
              Quiz
            </Link>
          </div>
        </AdminCard>
      ) : null}

      <AdminCard title="Format reference" description="Package structure and examples.">
        <p className="text-sm text-slate-600">
          ZIP бүтэц, жишээ файлууд:{" "}
          <code className="rounded bg-slate-100 px-1">content/templates/lesson-zip-package/</code>,{" "}
          <code className="rounded bg-slate-100 px-1">content/templates/korean-hangul-zip-example/</code>,{" "}
          repo root <code className="rounded bg-slate-100 px-1">LESSON_ZIP_IMPORT_FORMAT.md</code>.
        </p>
      </AdminCard>
    </div>
  );
}
