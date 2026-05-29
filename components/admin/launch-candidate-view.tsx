"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  LAUNCH_SECTION_LABELS,
  PRODUCTION_URL,
  productionUrl,
  type LaunchCardState,
  type LaunchCheckItem,
  type LaunchCheckStatus,
  type LaunchDecisionState,
  type LaunchDecisionValue,
  type LaunchSectionId,
  defaultDecision,
} from "@/lib/admin/launch-candidate-data";
import {
  initLaunchCandidateData,
  persistLaunchCandidateData,
  resetLaunchCandidateStorage,
} from "@/lib/admin/launch-candidate-storage";
import { summarizeLaunchCandidate } from "@/lib/admin/launch-candidate-report";
import { LaunchBlockersList, LaunchChecklist } from "@/components/admin/launch-checklist";
import { LaunchDecisionCard } from "@/components/admin/launch-decision-card";
import { LaunchReportExportCard } from "@/components/admin/launch-report-export-card";
import { LaunchStatusCard } from "@/components/admin/launch-status-card";

const SECTION_ORDER: LaunchSectionId[] = [
  "public",
  "admin",
  "auth_progress",
  "supabase_media",
];

export function LaunchCandidateView() {
  const [items, setItems] = useState<LaunchCheckItem[]>([]);
  const [cards, setCards] = useState<LaunchCardState[]>([]);
  const [decision, setDecision] = useState<LaunchDecisionState>(defaultDecision());
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const data = initLaunchCandidateData();
    setItems(data.items);
    setCards(data.cards);
    setDecision(data.decision);
    setSavedAt(data.savedAt);
    setHydrated(true);
  }, []);

  const handleItemUpdate = useCallback(
    (id: string, patch: Partial<Pick<LaunchCheckItem, "status" | "notes">>) => {
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

  const handleCardUpdate = useCallback((id: string, status: LaunchCheckStatus) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? { ...card, status, updatedAt: new Date().toISOString() }
          : card
      )
    );
  }, []);

  function handleSave() {
    const stored = persistLaunchCandidateData(items, cards, decision);
    setSavedAt(stored.savedAt ?? null);
  }

  function handleResetAll() {
    resetLaunchCandidateStorage();
    const fresh = initLaunchCandidateData();
    setItems(fresh.items);
    setCards(fresh.cards);
    setDecision(fresh.decision);
    setSavedAt(null);
  }

  function handleSetDecision(value: LaunchDecisionValue) {
    const next = { value, updatedAt: new Date().toISOString() };
    setDecision(next);
    persistLaunchCandidateData(items, cards, next);
    setSavedAt(new Date().toISOString());
  }

  function handleResetDecision() {
    const next = defaultDecision();
    setDecision(next);
    persistLaunchCandidateData(items, cards, next);
  }

  if (!hydrated) {
    return (
      <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
        Launch candidate ачааллаж байна…
      </p>
    );
  }

  const summary = summarizeLaunchCandidate(items, cards, decision);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Production summary</h2>
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
            href="/admin/final-audit"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
          >
            Final audit
          </Link>
        </div>
      </section>

      <LaunchStatusCard
        cards={cards}
        onUpdate={handleCardUpdate}
        blockerCount={summary.fail}
      />

      {SECTION_ORDER.map((section) => (
        <LaunchChecklist
          key={section}
          section={section}
          items={items}
          onUpdate={handleItemUpdate}
        />
      ))}

      <LaunchBlockersList items={items} />

      <LaunchDecisionCard
        decision={decision}
        onSetDecision={handleSetDecision}
        onReset={handleResetDecision}
      />

      <LaunchReportExportCard
        items={items}
        cards={cards}
        decision={decision}
        onSave={handleSave}
        onResetAll={handleResetAll}
        savedAt={savedAt}
      />

      <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Go-live docs</h2>
        <p className="mt-2 text-sm text-slate-600">
          GO_LIVE_NOTES.md · ROLLBACK_PLAN.md · POST_LAUNCH_MONITORING.md ·
          PHASE_6_LAUNCH_SUMMARY.md
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Sections: {Object.values(LAUNCH_SECTION_LABELS).join(" · ")}
        </p>
      </section>
    </div>
  );
}
