"use client";

import { useEffect } from "react";
import { getSession, onAuthStateChange } from "@/lib/supabase/auth";
import {
  getPendingClassCode,
  joinClassroomByCode,
  setPendingClassCode,
} from "@/lib/supabase/classrooms";

/**
 * Бүртгүүлэхдээ ангийн код оруулсан ч имэйл баталгаажуулалт хүлээсэн хэрэглэгч
 * нэвтэрмэгц автоматаар ангидаа нэгдэнэ.
 */
export function PendingClassJoin() {
  useEffect(() => {
    let cancelled = false;
    async function tryJoin() {
      const code = getPendingClassCode();
      if (!code) return;
      const { data: session } = await getSession();
      if (!session || cancelled) return;
      const { data, error } = await joinClassroomByCode(code);
      if (data || (error && !error.includes("нэвтэрнэ"))) setPendingClassCode(null);
    }
    void tryJoin();
    const off = onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void tryJoin();
    });
    return () => {
      cancelled = true;
      off();
    };
  }, []);
  return null;
}
