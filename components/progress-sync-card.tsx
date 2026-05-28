"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  clearLocalProgressAfterSync,
  dismissProgressSyncOffer,
  getLocalProgressSummary,
  hasLocalProgressToSync,
  syncLocalProgressToSupabase,
  type LocalProgressSummary,
} from "@/lib/supabase/progress-sync";

type Props = {
  onSynced?: () => void;
};

export function ProgressSyncCard({ onSynced }: Props) {
  const [visible, setVisible] = useState(false);
  const [summary, setSummary] = useState<LocalProgressSummary | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setVisible(false);
      return;
    }

    const { userId } = await getAuthenticatedUserId();
    if (!userId || !hasLocalProgressToSync()) {
      setVisible(false);
      setSummary(null);
      return;
    }

    setSummary(getLocalProgressSummary());
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
      setError(authError ?? "Нэвтрээгүй байна. Дахин нэвтэрнэ үү.");
      setSyncing(false);
      return;
    }

    const result = await syncLocalProgressToSupabase(userId);
    setSyncing(false);

    if (!result.ok) {
      setError(
        result.error ??
          "Аккаунт руу хадгалахад алдаа гарлаа. Дахин оролдоно уу."
      );
      return;
    }

    clearLocalProgressAfterSync();
    setSuccess(true);
    onSynced?.();
  }

  function handleDismiss() {
    dismissProgressSyncOffer();
    setVisible(false);
  }

  if (success) {
    return (
      <section className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 sm:p-6">
        <p className="text-sm font-semibold text-emerald-800">Амжилттай хадгаллаа</p>
        <p className="mt-1 text-sm text-emerald-700">
          Энэ төхөөрөмж дээрх ахиц таны аккаунт руу холбогдлоо.
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
        Энэ төхөөрөмж дээрх ахицаа аккаунттай холбох уу?
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Guest үед сурсан ахицаа account дээрээ хадгалж болно.
      </p>

      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        <li>
          Дууссан хичээл:{" "}
          <span className="font-semibold text-emerald-700">
            {summary.completedLessons}
          </span>
        </li>
        <li>
          Эхэлсэн хичээл:{" "}
          <span className="font-semibold text-emerald-700">
            {summary.startedLessons}
          </span>
        </li>
        <li>
          Сурсан үг:{" "}
          <span className="font-semibold text-emerald-700">
            {summary.learnedWords}
          </span>
        </li>
        <li>
          Quiz үр дүн:{" "}
          <span className="font-semibold text-emerald-700">
            {summary.quizResults}
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
          className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
        >
          {syncing ? "Хадгалж байна..." : "Account руу хадгалах"}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={syncing}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
        >
          Дараа
        </button>
      </div>
    </section>
  );
}
