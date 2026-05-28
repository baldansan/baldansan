"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getCurrentUser,
  onAuthStateChange,
  signOut,
} from "@/lib/supabase/auth";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import type { AuthUser } from "@/types/auth";

export function AuthStatus() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function refreshAdminFlag() {
      const admin = await isCurrentUserAdmin();
      if (mounted) setIsAdmin(admin);
    }

    async function loadUser() {
      const { data } = await getCurrentUser();
      if (mounted) {
        setUser(data);
        setLoading(false);
      }
      if (data) {
        await refreshAdminFlag();
      } else if (mounted) {
        setIsAdmin(false);
      }
    }

    loadUser();

    const unsubscribe = onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? undefined,
            }
          : null
      );
      setLoading(false);
      if (session?.user) {
        refreshAdminFlag();
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setUser(null);
    setSigningOut(false);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <span className="text-xs text-slate-400" aria-hidden>
        …
      </span>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
        {isAdmin ? (
          <Link
            href="/admin"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Admin
          </Link>
        ) : null}
        <span
          className="max-w-[8rem] truncate text-xs text-slate-600 sm:max-w-[10rem]"
          title={user.email}
        >
          {user.email ?? "Нэвтэрсэн"}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50"
        >
          {signingOut ? "…" : "Гарах"}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
    >
      Нэвтрэх
    </Link>
  );
}
