"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { getUserWordSrsCounts } from "@/lib/supabase/user-word-srs";

/**
 * Үг хадгалсны дараа гарах тайлбар: ХААНА орсон, хэдэн үг цээжлэхээр хүлээж байгаа.
 * `message` = үндсэн toast («Давталтад нэмлээ ✓»); ард нь «Давтах → Миний үгс (N)» холбоос.
 */
export function SavedWordsHint({ message, refreshKey }: { message: string; refreshKey?: string | number }) {
  const [counts, setCounts] = useState<{ total: number; due: number } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hasSupabaseConfig) return;
      const { userId } = await getAuthenticatedUserId();
      if (!userId) return;
      const c = await getUserWordSrsCounts(userId);
      if (alive) setCounts(c);
    })();
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  return (
    <p className="mt-2 text-xs font-semibold text-emerald-700" role="status">
      {message}{" "}
      <Link href="/review/words" className="underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900">
        Давтах → Миний үгс{counts ? ` (${counts.total} үг${counts.due > 0 ? `, ${counts.due} өнөөдөр` : ""})` : ""}
      </Link>
    </p>
  );
}
