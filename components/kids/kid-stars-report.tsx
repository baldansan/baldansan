"use client";

import { useEffect, useState } from "react";
import { fetchGuardianKidStars, stickerForLesson, type GuardianKidStarRow } from "@/lib/kids/stars";

let cache: Promise<GuardianKidStarRow[] | null> | null = null;

/** Нэг хуудсанд хэдэн хүүхэд байсан ч сервер рүү нэг л удаа асууна. */
function loadRows(): Promise<GuardianKidStarRow[] | null> {
  if (!cache) cache = fetchGuardianKidStars();
  return cache;
}

function bookLabel(lessonId: string): string | null {
  const m = /^yct-(\d)-/.exec(lessonId);
  return m ? `YCT ${m[1]}` : null;
}

/**
 * /family: хүүхдийн од, дуусгасан хичээл, наалт (089 `guardian_kid_stars`).
 * Хүснэгт үүсээгүй, эсвэл хүүхэд хараахан од аваагүй бол юу ч харуулахгүй.
 */
export function KidStarsReport({ childUserId }: { childUserId: string }) {
  const [rows, setRows] = useState<GuardianKidStarRow[] | null>(null);
  const [weekAgo, setWeekAgo] = useState(0);

  useEffect(() => {
    let alive = true;
    void loadRows().then((all) => {
      if (!alive) return;
      setWeekAgo(Date.now() - 7 * 24 * 3600 * 1000);
      setRows(all ? all.filter((r) => r.childUserId === childUserId) : null);
    });
    return () => {
      alive = false;
    };
  }, [childUserId]);

  if (!rows || rows.length === 0) return null;

  const stars = rows.reduce((n, r) => n + r.stars, 0);
  const done = rows.filter((r) => r.completedAt && !r.lessonId.endsWith("-review"));
  const thisWeek = done.filter((r) => r.completedAt && Date.parse(r.completedAt) >= weekAgo).length;
  const byBook = new Map<string, number>();
  for (const r of done) {
    const b = bookLabel(r.lessonId);
    if (b) byBook.set(b, (byBook.get(b) ?? 0) + 1);
  }
  const recent = [...done].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")).slice(0, 8);

  return (
    <div className="mt-2 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100">
      <p className="text-xs font-bold text-amber-900">
        ⭐ {stars} од · 🎒 {done.length} хичээл дуусгасан{thisWeek ? ` · энэ 7 хоногт ${thisWeek}` : ""}
      </p>
      {byBook.size ? (
        <p className="mt-1 text-xs text-amber-800">
          {[...byBook.entries()]
            .sort()
            .map(([b, n]) => `${b}: ${n}`)
            .join(" · ")}
        </p>
      ) : null}
      {recent.length ? (
        <p className="mt-1 text-lg leading-none" title="Сүүлд авсан наалтууд">
          {recent.map((r) => (
            <span key={r.lessonId}>{stickerForLesson(r.lessonId)}</span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
