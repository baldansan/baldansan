"use client";

import { useEffect, useState } from "react";
import { isKidEmail } from "@/lib/kids/types";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";

export type ChatUserState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "kid" }
  | { status: "ready"; userId: string; email: string | null };

/** Нэвтэрсэн, хүүхэд биш хэрэглэгчийг тодорхойлно (чат зөвхөн тэдэнд). */
export function useChatUser(): ChatUserState {
  const [state, setState] = useState<ChatUserState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!hasSupabaseConfig) {
        if (alive) setState({ status: "guest" });
        return;
      }
      const { data } = await getCurrentUser();
      if (!alive) return;
      if (!data) setState({ status: "guest" });
      else if (isKidEmail(data.email)) setState({ status: "kid" });
      else setState({ status: "ready", userId: data.id, email: data.email ?? null });
    }
    void run();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
