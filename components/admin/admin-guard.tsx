"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AdminDevImportWarning } from "@/components/admin/admin-dev-import-warning";
import { AuthLoadErrorCard } from "@/components/auth/auth-load-error-card";
import { EmptyState } from "@/components/empty-state";
import {
  buildFallbackAuthCheckResult,
  isAdminImportDevPreviewRoute,
} from "@/lib/auth/auth-check-utils";
import {
  runClientAuthCheck,
  type ClientAuthCheckResult,
} from "@/lib/auth/client-auth-check";
import { authDevLog } from "@/lib/auth/auth-dev-log";
import { useLoadingWatchdog } from "@/lib/hooks/use-loading-watchdog";

type GuardState = "loading" | "error" | "login" | "denied" | "admin" | "dev-preview";

type Props = {
  children: ReactNode;
};

export function AdminGuard({ children }: Props) {
  const [state, setState] = useState<GuardState>("loading");
  const [checkResult, setCheckResult] = useState<ClientAuthCheckResult | null>(
    null
  );
  const [attempt, setAttempt] = useState(0);
  const [route, setRoute] = useState("/admin");

  const finishWithError = useCallback(
    (message: string, result?: ClientAuthCheckResult | null) => {
      const pathname =
        typeof window !== "undefined" ? window.location.pathname : route;

      if (isAdminImportDevPreviewRoute(pathname)) {
        authDevLog("admin guard dev-preview fallback", { pathname, message });
        setCheckResult(
          result ?? buildFallbackAuthCheckResult(pathname, message)
        );
        setState("dev-preview");
        return;
      }

      setCheckResult(
        result ?? buildFallbackAuthCheckResult(pathname, message)
      );
      setState("error");
    },
    [route]
  );

  const runCheck = useCallback(async () => {
    setState("loading");
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "/admin";
    setRoute(pathname);

    authDevLog("admin guard check started", { pathname });

    try {
      const result = await runClientAuthCheck({
        includeAdmin: true,
        route: pathname,
      });
      setCheckResult(result);

      if (!result.supabaseConfigured) {
        finishWithError(result.error ?? "Supabase тохиргоо дутуу байна", result);
        return;
      }

      if (result.timedOut || (result.error && !result.user)) {
        finishWithError(result.error ?? "Auth шалгалт хэт удаж байна", result);
        return;
      }

      if (!result.sessionPresent || !result.user) {
        setState("login");
        return;
      }

      setState(result.isAdmin ? "admin" : "denied");
      authDevLog("admin guard check finished", {
        pathname,
        isAdmin: result.isAdmin,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Admin auth check failed";
      authDevLog("admin guard check error", message);
      finishWithError(message);
    }
  }, [finishWithError]);

  useEffect(() => {
    void runCheck();
  }, [runCheck, attempt]);

  useLoadingWatchdog({
    active: state === "loading",
    onTimeout: useCallback(() => {
      authDevLog("admin guard watchdog timeout");
      finishWithError("Auth шалгалт хэт удаж байна");
    }, [finishWithError]),
  });

  if (state === "loading") {
    return (
      <div
        className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-slate-700">Admin шалгаж байна...</p>
        <p className="mt-1 text-xs text-slate-500">
          Нэвтрэлт болон эрхийг баталгаажуулж байна.
        </p>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (state === "dev-preview") {
    return (
      <>
        <AdminDevImportWarning
          message={checkResult?.error ?? "Auth шалгалт хэт удаж байна"}
        />
        {children}
      </>
    );
  }

  if (state === "error") {
    return (
      <AuthLoadErrorCard
        title="Admin auth шалгалт амжилтгүй"
        description="Admin эрх шалгах үед алдаа гарлаа. Supabase холболт эсвэл нэвтрэлтийг шалгана уу."
        result={
          checkResult ?? buildFallbackAuthCheckResult(route, "Admin auth check failed")
        }
        route={route}
        onRetry={() => setAttempt((value) => value + 1)}
      />
    );
  }

  if (state === "login") {
    return (
      <EmptyState
        title="Admin хэсэгт нэвтрэх шаардлагатай"
        description={
          checkResult?.supabaseConfigured
            ? "Контент удирдах хэсэгт хандахын тулд эхлээд нэвтэрнэ үү."
            : "Supabase тохиргоо олдсонгүй. .env.local файлд NEXT_PUBLIC_SUPABASE_URL болон NEXT_PUBLIC_SUPABASE_ANON_KEY нэмнэ үү."
        }
        action={
          <Link
            href="/login"
            className="inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Нэвтрэх →
          </Link>
        }
      />
    );
  }

  if (state === "denied") {
    return (
      <EmptyState
        title="Admin эрх шаардлагатай"
        description="Энэ хэсэг зөвхөн контент удирдах эрхтэй хэрэглэгчдэд зориулагдсан."
        action={
          <Link
            href="/"
            className="inline-flex rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            Нүүр хуудас руу →
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
