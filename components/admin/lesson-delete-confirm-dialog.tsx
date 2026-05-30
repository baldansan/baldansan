"use client";

type Props = {
  open: boolean;
  lessonTitle: string;
  published: boolean;
  busy: boolean;
  confirmed: boolean;
  onConfirmedChange: (value: boolean) => void;
  onCancel: () => void;
  onDelete: () => void;
};

export function LessonDeleteConfirmDialog({
  open,
  lessonTitle,
  published,
  busy,
  confirmed,
  onConfirmedChange,
  onCancel,
  onDelete,
}: Props) {
  if (!open) return null;

  const canDelete = !published || confirmed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-delete-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <h2
          id="lesson-delete-title"
          className="text-lg font-bold text-slate-900"
        >
          Хичээл устгах
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Энэ хичээлийг устгах уу? Үгийн сан, quiz, subtitle зэрэг холбоотой
          content мөн устаж магадгүй.
        </p>
        {lessonTitle ? (
          <p className="mt-2 break-words text-sm font-medium text-slate-800">
            {lessonTitle}
          </p>
        ) : null}
        {published ? (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
            <p className="text-sm font-semibold text-amber-900">
              Энэ хичээл нийтлэгдсэн байна. Устгахдаа итгэлтэй байна уу?
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-amber-950">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => onConfirmedChange(e.target.checked)}
                className="mt-0.5 rounded border-amber-300"
              />
              <span>Би нийтлэгдсэн хичээлийг устгахаар итгэлтэй байна</span>
            </label>
          </div>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy || !canDelete}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? "Устгаж байна…" : "Delete lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}
