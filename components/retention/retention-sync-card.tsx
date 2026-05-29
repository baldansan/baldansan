"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  dismissRetentionSyncOffer,
  getLocalRetentionSyncSummary,
  hasLocalRetentionToSync,
  syncRetentionAfterLogin,
} from "@/lib/retention/retention-service";

type Props = {
  onSynced?: () => void;
};

export function RetentionSyncCard({ onSynced }: Props) {
  const [visible, setVisible] = useState(false);
  const [summary, setSummary] = useState<ReturnType<
    typeof getLocalRetentionSyncSummary
  > | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setVisible(false);
      return;
    }

    const { userId } = await getAuthenticatedUserId();
    if (!userId || !hasLocalRetentionToSync()) {
      setVisible(false);
      setSummary(null);
      return;
    }

    setSummary(getLocalRetentionSyncSummary());
    setVisible(true);
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  async function handleSync() {
    setSyncing(true);
    setError(null);

    const { userId, error: authError } = await getAuthenticatedUserId();
    if (!userId) {
      setError(authError ?? "Нэвтрээгүй байна.");
      setSyncing(false);
      return;
    }

    const result = await syncRetentionAfterLogin(userId);
    setSyncing(false);

    if (!result.ok) {
      setError(
        result.error ??
          "Daily goal/streak activity-г account руу хадгалахад алдаа гарлаа."
      );
      return;
    }

    setSuccess(true);
    onSynced?.();
  }

  function handleDismiss() {
    dismissRetentionSyncOffer();
    setVisible(false);
  }

  if (success) {
    return (
      <section className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 sm:p-6">
        <p className="text-sm font-semibold text-emerald-800">
          Retention activity хадгалагдлаа
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          Streak болон өдрийн activity таны account руу холбогдлоо.
        </p>
      </section>
    );
  }

  if (!visible || !summary) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Энэ төхөөрөмж дээрх daily goal/streak activity-г account руу хадгалах уу?
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Guest үед бүртгэгдсэн streak болон өдрийн activity-г account дээрээ
        хадгалж, бусад төхөөрөмж дээр үргэлжлүүлэх боломжтой.
      </p>

      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        <li>
          Идэвхтэй өдөр:{" "}
          <span className="font-semibold text-emerald-700">
            {summary.activeDays}
          </span>
        </li>
        <li>
          Local streak:{" "}
          <span className="font-semibold text-emerald-700">
            {summary.currentStreak} өдөр
          </span>
        </li>
        <li>
          Activity event:{" "}
          <span className="font-semibold text-emerald-700">
            {summary.activityEvents}
          </span>
        </li>
      </ul>

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            void handleSync();
          }}
          disabled={syncing}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {syncing ? "Хадгалж байна..." : "Retention sync хийх"}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={syncing}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
        >
          Дараа
        </button>
      </div>
    </section>
  );
}
