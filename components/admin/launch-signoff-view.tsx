"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PRODUCTION_URL,
  defaultSignoffDecision,
  defaultSignoffMeta,
  productionUrl,
  type LaunchSignoffState,
  type SignoffCardState,
  type SignoffCheckItem,
  type SignoffCheckStatus,
  type SignoffDecisionState,
  type SignoffDecisionValue,
  type SignoffMetaState,
} from "@/lib/admin/launch-signoff-data";
import {
  initLaunchSignoffData,
  persistLaunchSignoffData,
  resetLaunchSignoffStorage,
} from "@/lib/admin/launch-signoff-storage";
import { summarizeLaunchSignoff } from "@/lib/admin/launch-signoff-report";
import {
  SignoffBlockersList,
  SignoffChecklist,
} from "@/components/admin/signoff-checklist";
import { SignoffDecisionCard } from "@/components/admin/signoff-decision-card";
import { SignoffReportExportCard } from "@/components/admin/signoff-report-export-card";
import { SignoffSummaryCards } from "@/components/admin/signoff-summary-cards";

export function LaunchSignoffView() {
  const [items, setItems] = useState<SignoffCheckItem[]>([]);
  const [cards, setCards] = useState<SignoffCardState[]>([]);
  const [decision, setDecision] = useState<SignoffDecisionState>(
    defaultSignoffDecision()
  );
  const [meta, setMeta] = useState<SignoffMetaState>(defaultSignoffMeta());
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const data = initLaunchSignoffData();
    setItems(data.items);
    setCards(data.cards);
    setDecision(data.decision);
    setMeta(data.meta);
    setSavedAt(data.savedAt);
    setHydrated(true);
  }, []);

  const state: LaunchSignoffState = { items, cards, decision, meta };

  const handleItemUpdate = useCallback(
    (id: string, patch: Partial<Pick<SignoffCheckItem, "status" | "notes">>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...patch, updatedAt: new Date().toISOString() }
            : item
        )
      );
    },
    []
  );

  const handleCardUpdate = useCallback((id: string, status: SignoffCheckStatus) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? { ...card, status, updatedAt: new Date().toISOString() }
          : card
      )
    );
  }, []);

  function handleSave() {
    const stored = persistLaunchSignoffData(items, cards, decision, meta);
    setSavedAt(stored.savedAt ?? null);
  }

  function handleReset() {
    resetLaunchSignoffStorage();
    const fresh = initLaunchSignoffData();
    setItems(fresh.items);
    setCards(fresh.cards);
    setDecision(fresh.decision);
    setMeta(fresh.meta);
    setSavedAt(null);
  }

  function handleSetDecision(value: SignoffDecisionValue) {
    const next = { value, updatedAt: new Date().toISOString() };
    setDecision(next);
    persistLaunchSignoffData(items, cards, next, meta);
    setSavedAt(new Date().toISOString());
  }

  function handleResetDecision() {
    const next = defaultSignoffDecision();
    setDecision(next);
    persistLaunchSignoffData(items, cards, next, meta);
  }

  function handleMetaChange(patch: Partial<SignoffMetaState>) {
    setMeta((prev) => ({ ...prev, ...patch }));
  }

  if (!hydrated) {
    return (
      <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
        Launch sign-off ачааллаж байна…
      </p>
    );
  }

  const summary = summarizeLaunchSignoff(state);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Production information
        </h2>
        <p className="mt-2 font-mono text-sm text-emerald-800">{PRODUCTION_URL}</p>
        <p className="mt-2 text-sm text-slate-600">
          {summary.pass} pass · {summary.warning} warn · {summary.fail} fail ·{" "}
          {summary.not_checked} not checked
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={productionUrl("/deployment-check")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Deployment check
          </a>
          <Link
            href="/admin/system-check"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            System check
          </Link>
          <Link
            href="/admin/production-qa"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Production QA
          </Link>
          <Link
            href="/admin/security-audit"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Security audit
          </Link>
          <Link
            href="/admin/launch-candidate"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Launch candidate
          </Link>
          <Link
            href="/admin/final-audit"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
          >
            Final audit
          </Link>
        </div>
      </section>

      <SignoffSummaryCards cards={cards} onUpdate={handleCardUpdate} />
      <SignoffChecklist items={items} onUpdate={handleItemUpdate} />
      <SignoffBlockersList items={items} decision={decision.value} />
      <SignoffDecisionCard
        decision={decision}
        meta={meta}
        onSetDecision={handleSetDecision}
        onMetaChange={handleMetaChange}
        onResetDecision={handleResetDecision}
      />
      <SignoffReportExportCard
        state={state}
        onSave={handleSave}
        onReset={handleReset}
        savedAt={savedAt}
      />

      <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Sign-off docs</h2>
        <p className="mt-2 text-sm text-slate-600">
          LAUNCH_SIGNOFF.md · GO_LIVE_NOTES.md · ROLLBACK_PLAN.md ·
          POST_LAUNCH_MONITORING.md
        </p>
        <p className="mt-3 text-sm text-emerald-800">{summary.recommendedNextAction}</p>
      </section>
    </div>
  );
}
