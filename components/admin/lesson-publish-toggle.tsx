"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateLessonStatus } from "@/lib/supabase/admin-content";
import {
  syncReleaseOnPublish,
  syncReleaseOnUnpublish,
} from "@/lib/supabase/admin-release";

type Props = {
  lessonId: string;
  published: boolean;
  canPublish?: boolean;
  variant?: "link" | "button";
};

export function LessonPublishToggle({
  lessonId,
  published,
  canPublish = true,
  variant = "link",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);

    const nextStatus = published ? "draft" : "available";
    const result = await updateLessonStatus(lessonId, nextStatus);

    if (result.error) {
      setBusy(false);
      setError(result.error);
      return;
    }

    if (nextStatus === "available") {
      const sync = await syncReleaseOnPublish(lessonId);
      if (sync.error) {
        console.warn("[publish] release_status sync failed", sync.error);
      }
    } else {
      const sync = await syncReleaseOnUnpublish(lessonId);
      if (sync.error) {
        console.warn("[publish] unpublish sync failed", sync.error);
      }
    }

    setBusy(false);
    router.refresh();
  }

  const linkClass =
    "text-left disabled:cursor-not-allowed disabled:text-slate-400";
  const buttonClass =
    "inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500";

  const label = published
    ? busy
      ? "Unpublishing…"
      : "Unpublish"
    : busy
      ? "Publishing…"
      : "Publish";

  return (
    <span className="inline-flex flex-col gap-0.5">
      <button
        type="button"
        disabled={busy || (!published && !canPublish)}
        onClick={() => void handleClick()}
        className={`${variant === "button" ? buttonClass : linkClass} ${
          published
            ? variant === "link"
              ? "text-amber-800 hover:text-amber-900"
              : "bg-amber-500 hover:bg-amber-600 text-white"
            : variant === "link"
              ? "text-emerald-700 hover:text-emerald-800"
              : ""
        }`}
      >
        {label}
      </button>
      {error ? (
        <span className="text-[10px] text-red-700" title={error}>
          Failed
        </span>
      ) : null}
    </span>
  );
}
