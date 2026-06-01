"use client";

import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import type { HskImportPreview } from "@/lib/import/chinese-hsk-types";
import type { LessonImportTrack } from "@/lib/import/import-track";
import type {
  LessonImportPreview,
  LessonZipValidation,
} from "@/lib/import/lesson-zip-import";

export type ZipImportSummaryStatus = "ready" | "warning" | "failed";

function statusLabel(status: ZipImportSummaryStatus): string {
  if (status === "ready") return "Ready";
  if (status === "warning") return "Warning";
  return "Failed";
}

function statusTone(status: ZipImportSummaryStatus): string {
  if (status === "ready") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (status === "warning") {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }
  return "bg-red-50 text-red-800 ring-red-200";
}

export function getZipImportSummaryStatus(
  validation: LessonZipValidation | null
): ZipImportSummaryStatus {
  if (!validation || validation.wrongImporter) {
    return "failed";
  }
  if (!validation.ok || validation.errors.length > 0) {
    return "failed";
  }
  if (validation.warnings.length > 0) {
    return "warning";
  }
  return "ready";
}

function isHskPreview(
  preview: LessonImportPreview
): preview is HskImportPreview {
  return (
    typeof (preview as HskImportPreview).hskLevel === "number" ||
    Boolean((preview as HskImportPreview).lessonProfile)
  );
}

function buildExtraInfo(
  preview: LessonImportPreview,
  validation: LessonZipValidation,
  track: LessonImportTrack
): string[] {
  if (track === "korean" || validation.wrongImporter) {
    return [];
  }

  const prelesson = isPrelessonPackage({
    id: preview.lessonId,
    courseId: preview.courseId,
    sourceNote: preview.source,
  });

  const info: string[] = [];
  if (preview.audioFileCount === 0) {
    info.push(
      prelesson ? "Audio байхгүй — PreLesson тул OK" : "Audio missing (optional)"
    );
  }
  if (preview.imageFileCount === 0) {
    info.push(prelesson ? "Images байхгүй — OK" : "Images missing (optional)");
  }
  if (preview.subtitleCount === 0) {
    info.push(
      prelesson ? "Subtitles байхгүй — OK" : "Subtitles missing (optional)"
    );
  }
  return info;
}

function SummaryField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function MessageList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "red" | "amber" | "slate";
}) {
  if (items.length === 0) return null;

  const toneClass =
    tone === "red"
      ? "bg-red-50 text-red-900 ring-red-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <div className={`rounded-xl p-4 ring-1 ${toneClass}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  preview: LessonImportPreview;
  validation: LessonZipValidation;
  track?: LessonImportTrack;
};

export function ZipImportSummary({ preview, validation, track = "legacy" }: Props) {
  const status = getZipImportSummaryStatus(validation);
  const infoItems = [
    ...(validation.info ?? []),
    ...buildExtraInfo(preview, validation, track),
  ];
  const hskPreview = isHskPreview(preview) ? preview : null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Import summary</h2>
        <div className="flex flex-wrap items-center gap-2">
          {hskPreview?.profileBadgeLabel ? (
            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
              {hskPreview.profileBadgeLabel}
            </span>
          ) : null}
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusTone(status)}`}
          >
            {statusLabel(status)}
          </span>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {hskPreview?.hskLevel != null ? (
          <SummaryField label="HSK Level" value={`HSK${hskPreview.hskLevel}`} />
        ) : null}
        {hskPreview?.lessonProfile ? (
          <SummaryField label="Lesson profile" value={hskPreview.lessonProfile} />
        ) : null}
        {hskPreview?.lessonNumber != null ? (
          <SummaryField label="Lesson number" value={hskPreview.lessonNumber} />
        ) : null}
        {hskPreview?.bookPart ? (
          <SummaryField label="Book part" value={hskPreview.bookPart} />
        ) : null}
        <SummaryField label="Course ID" value={preview.courseId} />
        <SummaryField label="Lesson ID" value={preview.lessonId} />
        <SummaryField label="Language" value={preview.language} />
        <SummaryField label="Title" value={preview.title} />
        <SummaryField label="Vocabulary count" value={preview.vocabularyCount} />
        {hskPreview?.textCount != null ? (
          <SummaryField label="Text count" value={hskPreview.textCount} />
        ) : null}
        {hskPreview?.workbookListeningCount != null ? (
          <SummaryField
            label="Workbook listening"
            value={hskPreview.workbookListeningCount}
          />
        ) : null}
        {hskPreview?.workbookReadingCount != null ? (
          <SummaryField
            label="Workbook reading"
            value={hskPreview.workbookReadingCount}
          />
        ) : null}
        {hskPreview?.workbookWritingCount != null ? (
          <SummaryField
            label="Workbook writing"
            value={hskPreview.workbookWritingCount}
          />
        ) : null}
        {hskPreview?.studySectionCount != null ? (
          <SummaryField
            label="Study sections"
            value={hskPreview.studySectionCount}
          />
        ) : null}
        {hskPreview ? (
          <SummaryField
            label="Pronunciation content"
            value={hskPreview.hasPronunciationContent ? "yes" : "no"}
          />
        ) : null}
        {hskPreview ? (
          <SummaryField
            label="Tone content"
            value={hskPreview.hasToneContent ? "yes" : "no"}
          />
        ) : null}
        {hskPreview ? (
          <SummaryField
            label="Teacher notes"
            value={hskPreview.hasTeacherNotes ? "yes" : "no"}
          />
        ) : null}
        <SummaryField label="Quiz count" value={preview.quizCount} />
        <SummaryField label="Audio count" value={preview.audioFileCount} />
        <SummaryField label="Image count" value={preview.imageFileCount} />
        {hskPreview?.answerStatus ? (
          <SummaryField label="Answer status" value={hskPreview.answerStatus} />
        ) : null}
        {hskPreview?.textStatus ? (
          <SummaryField label="Text status" value={hskPreview.textStatus} />
        ) : null}
      </dl>

      <div className="mt-5 flex flex-col gap-3">
        <MessageList
          title="Critical errors — import blocked"
          items={validation.errors}
          tone="red"
        />
        <MessageList
          title="Warnings — import allowed"
          items={validation.warnings}
          tone="amber"
        />
        <MessageList title="Info" items={infoItems} tone="slate" />
      </div>

      {validation.errors.length === 0 &&
      validation.warnings.length === 0 &&
      infoItems.length === 0 ? (
        <p className="mt-5 text-sm text-emerald-800">Бүх шаардлагатай өгөгдөл бэлэн.</p>
      ) : null}
    </section>
  );
}
