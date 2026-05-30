"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LessonDeleteConfirmDialog } from "@/components/admin/lesson-delete-confirm-dialog";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import {
  deleteAdminLesson,
  updateLessonStatus,
} from "@/lib/supabase/admin-content";
import {
  syncReleaseOnPublish,
  syncReleaseOnUnpublish,
} from "@/lib/supabase/admin-release";
import type { AdminContentStatus } from "@/lib/admin/lesson-status";

type Props = {
  lessonId: string;
  lessonTitle: string;
  publishStatus: AdminContentStatus;
  onMessage?: (message: string | null) => void;
};

const actionLinkClass =
  "text-left font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function LessonListActions({
  lessonId,
  lessonTitle,
  publishStatus,
  onMessage,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"publish" | "unpublish" | "delete" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const published = publishStatus === "available";

  function clearFeedback() {
    setError(null);
    onMessage?.(null);
  }

  async function handlePublish(nextStatus: "available" | "draft") {
    clearFeedback();
    setBusy(nextStatus === "available" ? "publish" : "unpublish");

    const result = await updateLessonStatus(lessonId, nextStatus);
    if (result.error) {
      setBusy(null);
      setError(result.error);
      return;
    }

    if (nextStatus === "available") {
      const sync = await syncReleaseOnPublish(lessonId);
      if (sync.error) {
        console.warn("[publish] release_status sync failed", sync.error);
      }
      onMessage?.("Хичээл нийтлэгдлээ.");
    } else {
      const sync = await syncReleaseOnUnpublish(lessonId);
      if (sync.error) {
        console.warn("[publish] unpublish sync failed", sync.error);
      }
      onMessage?.("Хичээл ноорог боллоо.");
    }

    setBusy(null);
    router.refresh();
  }

  function openDeleteDialog() {
    clearFeedback();
    setDeleteConfirmed(false);
    setDeleteOpen(true);
  }

  function closeDeleteDialog() {
    if (busy === "delete") return;
    setDeleteOpen(false);
    setDeleteConfirmed(false);
  }

  async function handleDelete() {
    if (published && !deleteConfirmed) return;

    clearFeedback();
    setBusy("delete");

    const result = await deleteAdminLesson(lessonId);
    if (result.error) {
      setBusy(null);
      setError(result.error);
      return;
    }

    setDeleteOpen(false);
    setDeleteConfirmed(false);
    setBusy(null);
    onMessage?.("Хичээл устгагдлаа.");
    router.refresh();
  }

  return (
    <>
      <div className="flex min-w-[6.5rem] flex-col gap-1 text-xs">
        <Link
          href={`/admin/lessons/${lessonId}/edit`}
          className={`${actionLinkClass} text-emerald-700 hover:text-emerald-800`}
        >
          Засах
        </Link>
        <Link
          href={lessonPreviewPath(lessonId, {
            adminPreview: !published,
          })}
          className={`${actionLinkClass} text-slate-600 hover:text-emerald-700`}
        >
          Урьдчилж харах
        </Link>

        {published ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void handlePublish("draft")}
            className={`${actionLinkClass} text-amber-800 hover:text-amber-900`}
          >
            {busy === "unpublish" ? "Буцааж байна…" : "Буцаах"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void handlePublish("available")}
            className={`${actionLinkClass} text-emerald-700 hover:text-emerald-800`}
          >
            {busy === "publish" ? "Нийтлэж байна…" : "Нийтлэх"}
          </button>
        )}

        <button
          type="button"
          disabled={busy !== null}
          onClick={openDeleteDialog}
          className={`${actionLinkClass} text-red-700 hover:text-red-800`}
        >
          Устгах
        </button>

        {error ? (
          <span className="text-[10px] leading-snug text-red-700" title={error}>
            {error}
          </span>
        ) : null}
      </div>

      <LessonDeleteConfirmDialog
        open={deleteOpen}
        lessonTitle={lessonTitle}
        published={published}
        busy={busy === "delete"}
        confirmed={deleteConfirmed}
        onConfirmedChange={setDeleteConfirmed}
        onCancel={closeDeleteDialog}
        onDelete={() => void handleDelete()}
      />
    </>
  );
}
