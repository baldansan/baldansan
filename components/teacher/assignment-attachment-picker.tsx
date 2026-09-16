"use client";

import { useId, useState } from "react";

import {
  assignmentAttachmentAcceptAttribute,
  assignmentAttachmentHint,
  formatAttachmentSize,
  validateAssignmentAttachment,
} from "@/lib/supabase/classrooms";

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  label?: string;
};

/**
 * Даалгаварт файл хавсаргах сонголт.
 *
 * Хэмжээ, өргөтгөлийг ЭНД шалгана — сүлжээ рүү буруу файл явуулахгүй. Мөн
 * серверийн талд uploadAssignmentAttachment дотор дахин шалгагддаг.
 */
export function AssignmentAttachmentPicker({
  value,
  onChange,
  disabled,
  label = "Файл хавсаргах (заавал биш)",
}: Props) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);

  function handleSelect(file: File | null) {
    if (!file) {
      setError(null);
      onChange(null);
      return;
    }
    const invalid = validateAssignmentAttachment(file);
    if (invalid) {
      setError(invalid);
      onChange(null);
      return;
    }
    setError(null);
    onChange(file);
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={inputId} className="font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        type="file"
        disabled={disabled}
        accept={assignmentAttachmentAcceptAttribute()}
        onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-800 disabled:opacity-60"
      />
      <p className="text-xs text-slate-500">{assignmentAttachmentHint()}</p>

      {value ? (
        <p className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
          <span className="font-medium">{value.name}</span>
          <span className="text-slate-500">
            {formatAttachmentSize(value.size)}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(null)}
            className="rounded-full border border-slate-200 px-2 py-0.5 font-semibold text-slate-600 hover:text-red-700 disabled:opacity-60"
          >
            Хасах
          </button>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
