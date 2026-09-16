"use client";

import { useState } from "react";

import type { AssignmentAttachment } from "@/lib/classroom/types";
import {
  formatAttachmentSize,
  getAssignmentAttachmentUrl,
} from "@/lib/supabase/classrooms";

type Props = {
  attachment: AssignmentAttachment | null;
  className?: string;
};

/**
 * Хавсралт татах товч.
 *
 * Bucket нь private тул ил URL байхгүй. Дарахад хугацаатай холбоос үүсгэж,
 * шинэ цонхонд нээнэ. Эрхгүй бол Supabase алдаа буцаана — бид түүнийг
 * монголоор харуулна, хуурамч холбоос харуулахгүй.
 */
export function AssignmentAttachmentLink({ attachment, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!attachment) return null;

  async function handleOpen() {
    if (!attachment) return;
    setLoading(true);
    setError(null);
    const { data, error: urlError } = await getAssignmentAttachmentUrl(
      attachment.path
    );
    setLoading(false);
    if (urlError || !data) {
      setError(urlError ?? "Татах холбоос үүсгэж чадсангүй.");
      return;
    }
    window.open(data, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleOpen()}
        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
      >
        <span aria-hidden="true">📎</span>
        {loading ? "Бэлтгэж байна…" : `Хавсралт татаж авах: ${attachment.name}`}
      </button>
      <p className="mt-1 text-xs text-slate-500">
        {formatAttachmentSize(attachment.sizeBytes)} · холбоос 10 минут хүчинтэй
      </p>
      {error ? (
        <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
