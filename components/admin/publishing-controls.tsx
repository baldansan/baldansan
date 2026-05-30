"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { calculateReleaseReadiness } from "@/lib/admin/release-readiness";
import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import {
  getLessonCompleteness,
  updateLessonStatus,
  type LessonCompleteness,
} from "@/lib/supabase/admin-content";
import {
  syncReleaseOnPublish,
  syncReleaseOnUnpublish,
} from "@/lib/supabase/admin-release";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  initialCompleteness: LessonCompleteness;
};

export function PublishingControls({ lesson, initialCompleteness }: Props) {
  const router = useRouter();
  const publishStatus = getAdminPublishStatus(lesson);
  const prelesson = isPrelessonPackage(lesson);
  const [completeness, setCompleteness] =
    useState<LessonCompleteness>(initialCompleteness);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readiness = useMemo(
    () => calculateReleaseReadiness(lesson),
    [lesson]
  );

  const refreshCompleteness = useCallback(async () => {
    const result = await getLessonCompleteness(lesson.id);
    if (result.data) {
      setCompleteness(result.data);
    }
  }, [lesson.id]);

  async function handleStatus(
    status: "draft" | "available" | "archived",
    label: string
  ) {
    setBusy(label);
    setError(null);
    const result = await updateLessonStatus(lesson.id, status);
    if (result.error) {
      setBusy(null);
      setError(result.error);
      return;
    }

    if (status === "available") {
      const sync = await syncReleaseOnPublish(lesson.id);
      if (sync.error) {
        console.warn("[publish] release_status sync failed", sync.error);
      }
    } else if (status === "draft") {
      const sync = await syncReleaseOnUnpublish(lesson.id);
      if (sync.error) {
        console.warn("[publish] release unpublish sync failed", sync.error);
      }
    }

    setBusy(null);
    await refreshCompleteness();
    router.refresh();
  }

  const canPublish = readiness.readyToPublish;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Publishing controls</h2>
      <p className="mt-1 text-sm text-slate-600">
        Нийтлэх, ноорог руу буцаах, архивлах.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">Current status:</span>
        <LessonStatusBadge status={publishStatus} />
      </div>

      {!canPublish ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {prelesson
            ? "Release checklist бүрэн болоогүй. PreLesson-д title, target title, ≥5 vocabulary, ≥3 quiz, approval эсвэл QA passed шаардлагатай. Video/audio/subtitles заавал биш."
            : "Release checklist бүрэн болоогүй байна. Metadata, subtitles, ≥5 vocabulary, ≥3 quiz, QA passed, approval шаардлагатай."}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={!canPublish || busy !== null || publishStatus === "available"}
          onClick={() => handleStatus("available", "publish")}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {busy === "publish" ? "Publishing…" : "Publish lesson"}
        </button>
        <button
          type="button"
          disabled={busy !== null || publishStatus === "draft"}
          onClick={() => handleStatus("draft", "draft")}
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "draft" ? "Saving…" : "Move to draft"}
        </button>
        <button
          type="button"
          disabled={busy !== null || publishStatus === "archived"}
          onClick={() => handleStatus("archived", "archive")}
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-amber-200 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "archive" ? "Archiving…" : "Archive lesson"}
        </button>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
        <li
          className={`rounded-full px-2.5 py-1 ring-1 ${
            completeness.hasMetadata
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-slate-50 ring-slate-200"
          }`}
        >
          Metadata {completeness.hasMetadata ? "✓" : "—"}
        </li>
        <li
          className={`rounded-full px-2.5 py-1 ring-1 ${
            completeness.subtitleCount > 0 || prelesson
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-slate-50 ring-slate-200"
          }`}
        >
          Subtitles: {completeness.subtitleCount}
          {prelesson && completeness.subtitleCount === 0 ? " (optional)" : ""}
        </li>
        <li
          className={`rounded-full px-2.5 py-1 ring-1 ${
            completeness.vocabularyCount >= 5
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-slate-50 ring-slate-200"
          }`}
        >
          Vocabulary: {completeness.vocabularyCount}
        </li>
        <li
          className={`rounded-full px-2.5 py-1 ring-1 ${
            completeness.quizCount >= 3
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-slate-50 ring-slate-200"
          }`}
        >
          Quiz: {completeness.quizCount}
        </li>
        <li
          className={`rounded-full px-2.5 py-1 ring-1 ${
            readiness.approvalReady
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-amber-50 text-amber-800 ring-amber-200"
          }`}
        >
          Approval {readiness.approvalReady ? "✓" : "pending"}
        </li>
      </ul>
    </section>
  );
}
