"use client";

import { useEffect, useState } from "react";
import { clearKidMode, getKidModeProfile, type KidModeProfile } from "@/lib/kids/client";
import { supabase } from "@/lib/supabase/client";

/**
 * Хүүхдийн горим идэвхтэй эсэх (localStorage["buunduu-kid-mode-v1"]).
 * Session-ийн хэрэглэгч тэр хүүхэд биш болсон бол (эцэг эх дахин нэвтэрсэн г.м.)
 * тэмдэглэгээг автоматаар цэвэрлэнэ.
 */
export function useKidMode(): { kid: KidModeProfile | null; checked: boolean } {
  const [kid, setKid] = useState<KidModeProfile | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;

    async function verify() {
      const stored = getKidModeProfile();
      if (!stored || !supabase) {
        if (alive) {
          setKid(null);
          setChecked(true);
        }
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      const user = data.session?.user;
      if (!user || user.id !== stored.childUserId) {
        clearKidMode();
        setKid(null);
      } else {
        const meta = (user.user_metadata ?? {}) as { display_name?: string; avatar?: string };
        setKid({
          childUserId: stored.childUserId,
          displayName: meta.display_name || stored.displayName,
          avatar: meta.avatar || stored.avatar,
        });
      }
      setChecked(true);
    }

    void verify();
    const sub = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void verify();
      }
    });
    return () => {
      alive = false;
      sub?.data.subscription.unsubscribe();
    };
  }, []);

  return { kid, checked };
}
