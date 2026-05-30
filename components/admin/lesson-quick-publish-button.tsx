"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateLessonStatus } from "@/lib/supabase/admin-content";
import { syncReleaseOnPublish } from "@/lib/supabase/admin-release";

type Props = {
  lessonId: string;
  disabled?: boolean;
  variant?: "link" | "button";
};

export function LessonQuickPublishButton({
  lessonId,
  disabled,
  variant = "link",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    setBusy(true);
    setError(null);

    const result = await updateLessonStatus(lessonId, "available");
    if (result.error) {
      setBusy(false);
      setError(result.error);
      return;
    }

    const sync = await syncReleaseOnPublish(lessonId);
    if (sync.error) {
      console.warn("[publish] release_status sync failed", sync.error);
    }

    setBusy(false);
    router.refresh();
  }

  const buttonClass =
    variant === "button"
      ? "inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      : "text-left text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400";

  return (
    <span className="inline-flex flex-col gap-0.5">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={handlePublish}
        className={buttonClass}
      >
        {busy ? "Publishing…" : "Publish"}
      </button>
      {error ? (
        <span className="text-[10px] text-red-700" title={error}>
          Failed
        </span>
      ) : null}
    </span>
  );
}
