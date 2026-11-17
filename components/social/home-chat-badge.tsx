"use client";

import { useEffect, useState } from "react";
import { listMyRooms } from "@/lib/social/rooms";
import { fetchUnreadTotal, formatUnread } from "@/lib/social/unread";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";

/** Нүүр хуудасны чатын мөрөн дээрх «уншаагүй N» улаан тэмдэг. */
export function HomeChatBadge() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const { userId } = await getAuthenticatedUserId();
      if (!userId) return;
      const total = await fetchUnreadTotal(userId, async () => {
        const res = await listMyRooms();
        return (res.data ?? []).map((r) => r.id);
      });
      if (alive) setN(total);
    })();
    return () => {
      alive = false;
    };
  }, []);
  if (n <= 0) return null;
  return (
    <span className="bs-unread" aria-label={`${n} уншаагүй мессеж`}>
      {formatUnread(n)}
    </span>
  );
}
