"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EXERCISE_PRIMARY } from "@/components/lesson-exercises/exercise-theme";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { getDueReviewCount } from "@/lib/supabase/reviews";

export function ReviewDueBadge({ className = "" }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!hasSupabaseConfig) {
        setCount(null);
        return;
      }
      const { userId } = await getAuthenticatedUserId();
      if (!userId) {
        setCount(null);
        return;
      }
      const { data } = await getDueReviewCount(userId);
      setCount(data ?? 0);
    }
    void load();
  }, []);

  if (count == null || count <= 0) {
    return null;
  }

  return (
    <Link
      href="/review/today"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white ${className}`}
      style={{ backgroundColor: EXERCISE_PRIMARY }}
    >
      📋 {count} давталт
    </Link>
  );
}
