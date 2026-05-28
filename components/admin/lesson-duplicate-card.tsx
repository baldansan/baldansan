"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import {
  duplicateLesson,
  getSuggestedDuplicateLessonId,
  getSuggestedDuplicateOrderIndex,
} from "@/lib/supabase/admin-duplicate";

type Props = {
  sourceLessonId: string;
  courseId: string;
  sourceTitle: string;
  sourceChineseTitle: string;
};

export function LessonDuplicateCard({
  sourceLessonId,
  courseId,
  sourceTitle,
  sourceChineseTitle,
}: Props) {
  const [newId, setNewId] = useState("");
  const [title, setTitle] = useState(`${sourceTitle} Copy`);
  const [chineseTitle, setChineseTitle] = useState(sourceChineseTitle);
  const [orderIndex, setOrderIndex] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      const [idResult, orderResult] = await Promise.all([
        getSuggestedDuplicateLessonId(sourceLessonId),
        getSuggestedDuplicateOrderIndex(courseId),
      ]);

      if (cancelled) return;

      if (idResult.data) {
        setNewId(idResult.data);
      }
      if (orderResult.data != null) {
        setOrderIndex(String(orderResult.data));
      }
    }

    void loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, [sourceLessonId, courseId]);

  const handleDuplicate = useCallback(async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    setCreatedId(null);

    const order = Number(orderIndex);
    if (!newId.trim()) {
      setBusy(false);
      setError("New lesson ID заавал.");
      return;
    }
    if (newId.trim() === sourceLessonId) {
      setBusy(false);
      setError("Шинэ ID одоогийн хичээлээс өөр байх ёстой.");
      return;
    }
    if (!title.trim()) {
      setBusy(false);
      setError("New title заавал.");
      return;
    }
    if (!Number.isFinite(order) || order < 1) {
      setBusy(false);
      setError("Order index 1-ээс эхлэх тоо байх ёстой.");
      return;
    }

    const result = await duplicateLesson(sourceLessonId, {
      id: newId.trim(),
      title: title.trim(),
      chineseTitle: chineseTitle.trim(),
      orderIndex: order,
    });

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      setCreatedId(result.data.id);
      setSuccess("Lesson амжилттай хууллаа.");
    }
  }, [sourceLessonId, newId, title, chineseTitle, orderIndex]);

  return (
    <AdminEditorSection
      title="Duplicate lesson"
      description="Энэ хичээлийг шинэ draft lesson болгон хуулна. Эх хичээл, user progress, admin profile өөрчлөгдөхгүй."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          New lesson ID
          <input
            className={adminInputClass}
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="6"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Order index
          <input
            className={adminInputClass}
            type="number"
            min={1}
            value={orderIndex}
            onChange={(e) => setOrderIndex(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          New title
          <input
            className={adminInputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          New Chinese title
          <input
            className={adminInputClass}
            value={chineseTitle}
            onChange={(e) => setChineseTitle(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4">
        <AdminAlert error={error} success={success} />
      </div>

      {createdId ? (
        <p className="mt-3 text-sm">
          <Link
            href={`/admin/lessons/${createdId}/edit`}
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            → /admin/lessons/{createdId}/edit
          </Link>
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={handleDuplicate}
        className="mt-4 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        {busy ? "Duplicating…" : "Duplicate as draft"}
      </button>
    </AdminEditorSection>
  );
}
