"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LocalDebugPanel } from "@/components/dev/local-debug-panel";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import { formatEnvPresence, getSupabaseEnvPresence } from "@/lib/dev/local-debug";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

type HealthState = {
  appLoaded: true;
  url: string;
  online: boolean;
  serviceWorkerRegistered: boolean;
  supabaseUrlPresent: boolean;
  supabaseAnonKeyPresent: boolean;
  canQueryLessons: "pending" | "yes" | "no";
  lessonsQueryError?: string;
  timestamp: string;
};

export function LocalHealthClient() {
  const [state, setState] = useState<HealthState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runChecks() {
      const env = getSupabaseEnvPresence();
      const formattedEnv = formatEnvPresence(env);

      let serviceWorkerRegistered = false;
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        serviceWorkerRegistered = registrations.length > 0;
      }

      let canQueryLessons: HealthState["canQueryLessons"] = "pending";
      let lessonsQueryError: string | undefined;

      if (!hasSupabaseConfig || !supabase) {
        canQueryLessons = "no";
        lessonsQueryError = "Supabase client not configured";
      } else {
        const { error } = await supabase.from("lessons").select("id").limit(1);
        if (error) {
          canQueryLessons = "no";
          lessonsQueryError = error.message;
        } else {
          canQueryLessons = "yes";
        }
      }

      if (cancelled) return;

      setState({
        appLoaded: true,
        url: window.location.href,
        online: navigator.onLine,
        serviceWorkerRegistered,
        supabaseUrlPresent: formattedEnv.url === "yes",
        supabaseAnonKeyPresent: formattedEnv.anonKey === "yes",
        canQueryLessons,
        lessonsQueryError,
        timestamp: new Date().toISOString(),
      });
    }

    void runChecks();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Local health</h1>
        <p className="mt-2 text-sm text-slate-600">
          Dev-only diagnostics for localhost and LAN testing.
        </p>

        {!state ? (
          <p className="mt-4 text-sm text-slate-500">Running checks...</p>
        ) : (
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="font-medium text-slate-700">app loaded</dt>
              <dd>{state.appLoaded ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">current URL</dt>
              <dd className="break-all">{state.url}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">navigator.onLine</dt>
              <dd>{state.online ? "true" : "false"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">service worker registered</dt>
              <dd>{state.serviceWorkerRegistered ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">NEXT_PUBLIC_SUPABASE_URL</dt>
              <dd>{state.supabaseUrlPresent ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">NEXT_PUBLIC_SUPABASE_ANON_KEY</dt>
              <dd>{state.supabaseAnonKeyPresent ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">can query Supabase lessons</dt>
              <dd>{state.canQueryLessons}</dd>
            </div>
            {state.lessonsQueryError ? (
              <div>
                <dt className="font-medium text-slate-700">lessons query error</dt>
                <dd className="break-all text-red-700">{state.lessonsQueryError}</dd>
              </div>
            ) : null}
            <div>
              <dt className="font-medium text-slate-700">timestamp (UTC)</dt>
              <dd>{formatMongoliaDateTimeWithLabel(state.timestamp)}</dd>
            </div>
          </dl>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            /admin
          </Link>
          <Link
            href="/admin/import/chinese"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            /admin/import/chinese
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            Reload
          </button>
        </div>

        <LocalDebugPanel route="/debug/local-health" />
      </section>
    </main>
  );
}
