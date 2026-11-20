"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { dedupeItems } from "@/lib/writing/local-store";
import { createList, getList } from "@/lib/writing/store";
import {
  REPS_MEMORY_DEFAULT,
  REPS_TRACE_DEFAULT,
  type WritingItem,
} from "@/lib/writing/types";

/** Хичээл бүрд нэг дэвтэр: lessonId → дэвтрийн id (энэ төхөөрөмж дээр). */
const LESSON_LIST_KEY = "bs:writingLessonLists";

function readMap(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(LESSON_LIST_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>) {
  try {
    window.localStorage.setItem(LESSON_LIST_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function WritingLessonStartClient({ lessonId }: { lessonId: string }) {
  const locale = useUiLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      // 1) Энэ хичээлийн дэвтэр өмнө үүссэн бол түүгээр үргэлжлүүлнэ.
      const map = readMap();
      const existingId = map[lessonId];
      if (existingId) {
        const existing = await getList(existingId);
        if (existing.data) {
          router.replace(`/writing/${existingId}/practice`);
          return;
        }
      }
      // 2) Үгүй бол хичээлийн үгсийн ханзаар шинэ дэвтэр үүсгэнэ.
      try {
        const res = await fetch(`/api/writing/lesson-words?lessonId=${encodeURIComponent(lessonId)}`);
        const json = (await res.json()) as { title?: string; items?: WritingItem[] };
        const items = dedupeItems(json.items ?? []);
        if (items.length === 0) {
          setError(tr(locale, "Энэ хичээлд бичих ханз олдсонгүй."));
          return;
        }
        const created = await createList({
          title: `📖 ${json.title?.trim() || tr(locale, "Хичээлийн ханз")}`,
          kind: "lesson",
          items,
          repsTrace: REPS_TRACE_DEFAULT,
          repsMemory: REPS_MEMORY_DEFAULT,
        });
        if (!created.data) {
          setError(created.error ?? tr(locale, "Дэвтэр үүсгэж чадсангүй."));
          return;
        }
        writeMap({ ...map, [lessonId]: created.data.id });
        router.replace(`/writing/${created.data.id}/practice`);
      } catch {
        setError(tr(locale, "Сүлжээний алдаа. Дахин оролдоно уу."));
      }
    })();
  }, [lessonId, locale, router]);

  return (
    <MobileAppShell activeTab="study">
      <div className="py-16 text-center">
        {error ? (
          <>
            <p className="text-sm font-semibold text-[var(--app-text)]">{error}</p>
            <Link href="/writing" className="app-btn-primary mt-4 inline-flex">
              {tr(locale, "Ханзны дэвтэр рүү")}
            </Link>
          </>
        ) : (
          <>
            <p className="text-4xl" aria-hidden>
              ✍️
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--app-muted)]">
              {tr(locale, "Хичээлийн ханзаар дэвтэр бэлдэж байна…")}
            </p>
          </>
        )}
      </div>
    </MobileAppShell>
  );
}
