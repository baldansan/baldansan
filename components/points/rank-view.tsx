"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { PERIOD_LABELS, type PointsPeriod } from "@/lib/points/points-config";
import {
  fetchBestStudents,
  fetchMyPublicProfile,
  fetchMyRanks,
  fetchRankClass,
  fetchRankGlobal,
  fetchRankOrganization,
  saveMyPublicProfile,
  type BestStudent,
  type MyRank,
  type PublicProfile,
  type RankRow,
} from "@/lib/points/rank";

type Tab = "class" | "organization" | "global";

const TAB_LABEL: Record<Tab, string> = {
  class: "Анги",
  organization: "Сургууль",
  global: "Нийт",
};
const MEDAL = ["🥇", "🥈", "🥉"];

function Podium({ rows }: { rows: RankRow[] }) {
  const top = rows.filter((r) => r.rank <= 3 && r.points > 0).slice(0, 3);
  if (top.length === 0) return null;
  return (
    <div className="mb-3 grid grid-cols-3 gap-2">
      {top.map((r, i) => (
        <div
          key={r.userId}
          className={`rounded-2xl p-3 text-center ring-1 ${
            r.isMe ? "bg-emerald-50 ring-emerald-300" : "bg-amber-50 ring-amber-200"
          }`}
        >
          <div className="text-2xl" aria-hidden>
            {MEDAL[Math.min(r.rank, 3) - 1] ?? MEDAL[i]}
          </div>
          <p className="mt-1 truncate text-xs font-bold" translate="no">
            {r.displayName}
          </p>
          <p className="text-sm font-black text-emerald-700">{r.points}</p>
        </div>
      ))}
    </div>
  );
}

function PublicOptIn() {
  const [p, setP] = useState<PublicProfile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetchMyPublicProfile().then(setP);
  }, []);

  if (!p) return null;

  async function save(next: PublicProfile) {
    setP(next);
    const res = await saveMyPublicProfile(next);
    setSaved(res.ok);
  }

  return (
    <MobileCard className="mt-3">
      <label className="flex items-center justify-between gap-3 text-sm font-bold">
        Намайг «Шилдэг сурагчид»-д нэрээр харуулах
        <input
          type="checkbox"
          checked={p.isPublic}
          onChange={(e) => void save({ ...p, isPublic: e.target.checked })}
          className="h-5 w-5 accent-emerald-600"
        />
      </label>
      {p.isPublic ? (
        <div className="mt-3 space-y-2">
          <input
            value={p.displayName}
            onChange={(e) => setP({ ...p, displayName: e.target.value })}
            onBlur={() => void save(p)}
            placeholder="Харагдах нэр"
            className="w-full rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm"
          />
          <input
            value={p.instagram}
            onChange={(e) => setP({ ...p, instagram: e.target.value })}
            onBlur={() => void save(p)}
            placeholder="Instagram (заавал биш)"
            className="w-full rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm"
          />
        </div>
      ) : (
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          Унтраалттай үед бусад нийт зэрэглэлд таны нэр «Нууц сурагч» гэж харагдана.
        </p>
      )}
      {saved ? <p className="mt-2 text-xs text-emerald-700">Хадгалагдлаа</p> : null}
    </MobileCard>
  );
}

export function RankView() {
  const [tab, setTab] = useState<Tab>("class");
  const [period, setPeriod] = useState<PointsPeriod>("30d");
  const [ranks, setRanks] = useState<MyRank[]>([]);
  const [rows, setRows] = useState<RankRow[]>([]);
  const [best, setBest] = useState<BestStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      const [mine, b] = await Promise.all([fetchMyRanks(period), fetchBestStudents(period, 10)]);
      if (!alive) return;
      setRanks(mine);
      setBest(b);

      let list: RankRow[] = [];
      if (tab === "global") {
        list = await fetchRankGlobal(period, 50);
      } else {
        const scope = mine.find((r) => r.scope === tab);
        if (scope?.scopeId) {
          list =
            tab === "class"
              ? await fetchRankClass(scope.scopeId, period)
              : await fetchRankOrganization(scope.scopeId, period);
        }
      }
      if (!alive) return;
      setRows(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [tab, period]);

  const hasScope = tab === "global" || ranks.some((r) => r.scope === tab);

  return (
    <MobileAppShell activeTab="profile">
      <MobilePageHeader
        title="Зэрэглэл"
        subtitle="Оноогоороо хэн нь тэргүүлж байна?"
        action={
          <Link href="/points" className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            ⭐ Миний оноо
          </Link>
        }
      />

      <div className="mb-3 flex gap-1 rounded-2xl bg-slate-100 p-1" role="tablist">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${
              tab === t ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABELS) as PointsPeriod[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
              period === p
                ? "bg-emerald-600 text-white ring-emerald-600"
                : "bg-white text-slate-600 ring-slate-200"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--app-muted)]">Ачааллаж байна…</p>
      ) : !hasScope ? (
        <MobileCard className="text-center text-sm text-[var(--app-muted)]">
          {tab === "class" ? (
            <>
              Та ямар нэг ангид ороогүй байна.{" "}
              <Link href="/join" className="font-bold text-emerald-700">Ангид орох</Link>
            </>
          ) : (
            "Сургуулийн зэрэглэл харагдахгүй байна."
          )}
        </MobileCard>
      ) : rows.length === 0 ? (
        <MobileCard className="text-center text-sm text-[var(--app-muted)]">
          Энэ хугацаанд оноо цуглуулсан хүн алга.
        </MobileCard>
      ) : (
        <>
          <Podium rows={rows} />
          <MobileCard padding="sm">
            <ol className="divide-y divide-slate-100">
              {rows.map((r) => (
                <li
                  key={r.userId}
                  className={`flex items-center gap-3 px-1 py-2.5 text-sm ${
                    r.isMe ? "rounded-xl bg-emerald-50 font-bold" : ""
                  }`}
                >
                  <span className="w-8 shrink-0 text-center font-black text-slate-500">
                    {MEDAL[r.rank - 1] ?? r.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate" translate="no">
                    {r.displayName}
                    {r.isMe ? " (Та)" : ""}
                  </span>
                  <b className="shrink-0 text-emerald-700">{r.points}</b>
                </li>
              ))}
            </ol>
          </MobileCard>
        </>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-base font-bold text-[var(--app-text)]">🌟 Шилдэг сурагчид</h2>
        {best.length === 0 ? (
          <MobileCard className="text-sm text-[var(--app-muted)]">
            Одоогоор нийтэд харагдахаар сонгосон сурагч алга.
          </MobileCard>
        ) : (
          <div className="space-y-2">
            {best.map((b) => (
              <MobileCard key={b.userId} padding="sm" className="flex items-center gap-3">
                <span className="w-8 text-center text-lg" aria-hidden>
                  {MEDAL[b.rank - 1] ?? b.rank}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm" translate="no">
                    {b.avatar ? `${b.avatar} ` : ""}
                    {b.displayName}
                  </b>
                  <span className="block truncate text-xs text-[var(--app-muted)]">
                    {[b.levelLabel, b.instagram ? `@${b.instagram.replace(/^@/, "")}` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <b className="text-emerald-700">{b.points}</b>
              </MobileCard>
            ))}
          </div>
        )}
        <PublicOptIn />
      </section>
    </MobileAppShell>
  );
}
