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
  if (status === "ready") return "Бэлэн";
  if (status === "warning") return "Анхааруулга";
  return "Амжилтгүй";
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
      prelesson ? "Аудио алга — PreLesson тул зүгээр" : "Аудио алга (заавал биш)"
    );
  }
  if (preview.imageFileCount === 0) {
    info.push(prelesson ? "Зураг алга — зүгээр" : "Зураг алга (заавал биш)");
  }
  if (preview.subtitleCount === 0) {
    info.push(
      prelesson ? "Хадмал алга — зүгээр" : "Хадмал алга (заавал биш)"
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
  const hskPreview = isHskPreview(preview) ? preview : null;
  const infoItems = [
    ...(validation.info ?? []),
    ...buildExtraInfo(preview, validation, track),
    ...(hskPreview && !hskPreview.storesJsonSourceNote
      ? [
          "Тайлбар: source_note хуучин текст хэлбэртэй байна (hskStudyContent JSON алга). Оруулж болно — үгсийн сан, дасгал нь ZIP-ээс ачаална.",
        ]
      : []),
  ];

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Багцын тойм</h2>
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
          <SummaryField label="HSK түвшин" value={`HSK${hskPreview.hskLevel}`} />
        ) : null}
        {hskPreview?.lessonProfile ? (
          <SummaryField label="Хичээлийн төрөл" value={hskPreview.lessonProfile} />
        ) : null}
        {hskPreview?.lessonNumber != null ? (
          <SummaryField label="Хичээлийн дугаар" value={hskPreview.lessonNumber} />
        ) : null}
        {hskPreview?.bookPart ? (
          <SummaryField label="Номын хэсэг" value={hskPreview.bookPart} />
        ) : null}
        <SummaryField label="Курсын ID" value={preview.courseId} />
        <SummaryField label="Хичээлийн ID" value={preview.lessonId} />
        <SummaryField label="Хэл" value={preview.language} />
        <SummaryField label="Гарчиг" value={preview.title} />
        <SummaryField label="Үгийн тоо" value={preview.vocabularyCount} />
        {hskPreview?.textCount != null ? (
          <SummaryField label="Эх бичвэрийн тоо" value={hskPreview.textCount} />
        ) : null}
        {hskPreview?.workbookListeningCount != null ? (
          <SummaryField
            label="Дасгалын ном — сонсгол"
            value={hskPreview.workbookListeningCount}
          />
        ) : null}
        {hskPreview?.workbookReadingCount != null ? (
          <SummaryField
            label="Дасгалын ном — унших"
            value={hskPreview.workbookReadingCount}
          />
        ) : null}
        {hskPreview?.workbookWritingCount != null ? (
          <SummaryField
            label="Дасгалын ном — бичих"
            value={hskPreview.workbookWritingCount}
          />
        ) : null}
        {hskPreview?.guidedStepCount != null ? (
          <SummaryField label="Заавартай алхмын тоо" value={hskPreview.guidedStepCount} />
        ) : null}
        {hskPreview?.studySectionCount != null ? (
          <SummaryField
            label="Судлах хэсгийн тоо"
            value={hskPreview.studySectionCount}
          />
        ) : null}
        {hskPreview ? (
          <SummaryField
            label="Пиньинь агуулга"
            value={hskPreview.hasPinyinContent ? "Тийм" : "Үгүй"}
          />
        ) : null}
        {hskPreview ? (
          <SummaryField
            label="Аялгууны агуулга"
            value={hskPreview.hasToneContent ? "Тийм" : "Үгүй"}
          />
        ) : null}
        {hskPreview ? (
          <SummaryField
            label="Багшийн тэмдэглэл"
            value={hskPreview.hasTeacherNotes ? "Тийм" : "Үгүй"}
          />
        ) : null}
        {hskPreview ? (
          <SummaryField
            label="source_note-ийн хэлбэр"
            value={
              hskPreview.storesJsonSourceNote
                ? "JSON (hskStudyContent)"
                : "хуучин текст — оруулах боломжгүй"
            }
          />
        ) : null}
        {hskPreview?.mediaImageCount != null ? (
          <SummaryField label="Медиа зураг" value={hskPreview.mediaImageCount} />
        ) : null}
        {hskPreview?.uploadedImageCount != null ? (
          <SummaryField
            label="Байршуулсан зураг"
            value={hskPreview.uploadedImageCount}
          />
        ) : null}
        {hskPreview ? (
          <SummaryField
            label="Нүүр зураг олдсон эсэх"
            value={hskPreview.heroImageFound ? "Тийм" : "Үгүй"}
          />
        ) : null}
        {hskPreview?.imageStorageStatus ? (
          <SummaryField
            label="Зургийн сангийн төлөв"
            value={hskPreview.imageStorageStatus}
          />
        ) : null}
        {hskPreview ? (
          <SummaryField
            label="Бичлэг заавал эсэх"
            value={hskPreview.videoRequired ? "Тийм" : "Үгүй"}
          />
        ) : null}
        <SummaryField label="Дасгалын тоо" value={preview.quizCount} />
        <SummaryField label="Аудио файлын тоо" value={preview.audioFileCount} />
        <SummaryField label="Зургийн тоо" value={preview.imageFileCount} />
        {hskPreview?.answerStatus ? (
          <SummaryField label="Хариултын төлөв" value={hskPreview.answerStatus} />
        ) : null}
        {hskPreview?.textStatus ? (
          <SummaryField label="Эх бичвэрийн төлөв" value={hskPreview.textStatus} />
        ) : null}
      </dl>

      <div className="mt-5 flex flex-col gap-3">
        <MessageList
          title="Ноцтой алдаа — оруулах боломжгүй"
          items={validation.errors}
          tone="red"
        />
        <MessageList
          title="Анхааруулга — оруулж болно"
          items={validation.warnings}
          tone="amber"
        />
        <MessageList title="Мэдээлэл" items={infoItems} tone="slate" />
      </div>

      {validation.errors.length === 0 &&
      validation.warnings.length === 0 &&
      infoItems.length === 0 ? (
        <p className="mt-5 text-sm text-emerald-800">Бүх шаардлагатай өгөгдөл бэлэн.</p>
      ) : null}
    </section>
  );
}
