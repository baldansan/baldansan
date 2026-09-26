"use client";

import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { CurriculumProgressRow } from "@/lib/classroom/types";
import { getClassroomCurriculumProgress } from "@/lib/supabase/curriculum";

type Props = {
  childUserId: string;
  classroomId: string;
};

/**
 * /family: «Заавал хичээл: x/y (z%)» — ангийн заавал хөтөлбөрийн ахиц.
 * RPC нь асран хамгаалагчид зөвхөн өөрийн хүүхдийн мөрийг буцаана (066).
 * Хөтөлбөр алга, эсвэл алдаа гарвал юу ч харуулахгүй.
 */
export function KidCurriculumProgress({ childUserId, classroomId }: Props) {
  const locale = useUiLocale();
  const [row, setRow] = useState<CurriculumProgressRow | null>(null);

  useEffect(() => {
    let alive = true;
    getClassroomCurriculumProgress(classroomId)
      .then((res) => {
        if (!alive) return;
        const mine = res.data?.find((r) => r.studentUserId === childUserId) ?? null;
        setRow(mine && mine.total > 0 ? mine : null);
      })
      .catch(() => {
        if (alive) setRow(null);
      });
    return () => {
      alive = false;
    };
  }, [childUserId, classroomId]);

  if (!row) return null;

  return (
    <div className="mt-1">
      <p className="text-xs font-semibold text-[var(--app-text)]">
        📌 {tr(locale, "Заавал хичээл")}: {row.completed}/{row.total} ({row.percent}%)
      </p>
      <div className="mt-1 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${row.percent}%` }}
        />
      </div>
    </div>
  );
}
