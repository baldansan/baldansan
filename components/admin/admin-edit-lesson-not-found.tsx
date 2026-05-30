"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";

const LESSON_DRAFTS_STORAGE_KEY = "lesson_drafts";

type Props = {
  lessonId: string;
};

/** Client retry when server render could not load an imported alphanumeric lesson id. */
export function AdminEditLessonNotFound({ lessonId }: Props) {
  const [retrying, setRetrying] = useState(true);
  const [localDraftIds, setLocalDraftIds] = useState<string[]>([]);

  useEffect(() => {
    console.log("edit route param", lessonId);

    try {
      const raw = localStorage.getItem(LESSON_DRAFTS_STORAGE_KEY);
      if (raw) {
        const drafts = JSON.parse(raw) as Array<{ lessonId?: string; id?: string }>;
        const ids = drafts
          .map((item) => item.lessonId ?? item.id)
          .filter((id): id is string => Boolean(id));
        setLocalDraftIds(ids);
        console.log("local fallback lessons", drafts);
      }
    } catch {
      // ignore
    }

    let cancelled = false;

    async function retryFetch() {
      try {
        const response = await fetch(
          `/api/admin/lessons/${encodeURIComponent(lessonId)}`
        );
        const text = await response.text();
        console.log("found by lessonId", response.status, text.slice(0, 200));

        if (!cancelled && response.ok) {
          window.location.reload();
          return;
        }
      } catch (error) {
        console.error("edit page lesson retry failed", error);
      } finally {
        if (!cancelled) {
          setRetrying(false);
        }
      }
    }

    void retryFetch();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  if (retrying) {
    return (
      <EmptyState
        title="Хичээл ачаалж байна…"
        description={`"${lessonId}" — импортолсон draft хичээлийг ачаалж байна.`}
      />
    );
  }

  return (
    <EmptyState
      title="Хичээл олдсонгүй"
      description={`"${lessonId}" ID-тай хичээл байхгүй. Supabase эсвэл local fallback шалгана уу.${
        localDraftIds.length
          ? ` Local draft ids: ${localDraftIds.join(", ")}`
          : ""
      }`}
      action={
        <Link
          href="/admin/lessons"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← Хичээл удирдах
        </Link>
      }
    />
  );
}
