"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildSkillMap,
  loadMastery,
  loadSkills,
  type SkillMap,
  type SkillMapItem,
  type SkillRow,
  type MasteryRow,
  type SkillStatus,
} from "@/lib/skills/skill-map";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

const STATUS: Record<SkillStatus, { icon: string; label: string; cls: string }> = {
  good: { icon: "✅", label: "Чадна", cls: "text-emerald-700" },
  mid: { icon: "🟡", label: "Дунд", cls: "text-amber-700" },
  weak: { icon: "❌", label: "Сул", cls: "text-rose-700" },
  untested: { icon: "⚪", label: "Шалгаагүй", cls: "text-slate-400" },
};

function Row({ it }: { it: SkillMapItem }) {
  const locale = useUiLocale();
  const st = STATUS[it.status];
  const pct = it.mastery == null ? null : Math.round(it.mastery * 100);
  return (
    <li>
      <Link href={it.href} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
        <span className="w-6 text-center text-base" aria-label={st.label}>
          {st.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[var(--app-text)]">
            {it.name_mn}
            {it.name_zh && it.name_zh !== it.name_mn ? (
              <span className="hanzi ml-1 text-[var(--app-muted)]">{it.name_zh}</span>
            ) : null}
          </span>
          <span className="block truncate text-xs text-[var(--app-muted)]">
            {pct == null
              ? tr(locale, "Нотолгоо хараахан алга")
              : `${pct}% · ${it.evidence} ${tr(locale, "оролдлого")}`}{" "}
            · {tr(locale, it.hrefLabel)} →
          </span>
        </span>
        {pct != null ? (
          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
            <span
              className={`block h-full ${
                it.status === "good" ? "bg-emerald-500" : it.status === "mid" ? "bg-amber-400" : "bg-rose-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </span>
        ) : null}
      </Link>
    </li>
  );
}

/** «HSK N давахад юу чадаж, юу чадахгүй байна» — чадварын зураглал. */
export function SkillMapCard() {
  const locale = useUiLocale();
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [level, setLevel] = useState<number>(4);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [mastery, setMastery] = useState<Map<string, MasteryRow>>(new Map());
  const [guest, setGuest] = useState(true);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const n = Number(String(activeLevel).replace(/\D/g, ""));
    if (n >= 1 && n <= 6) {
      const t = setTimeout(() => setLevel(n), 0);
      return () => clearTimeout(t);
    }
  }, [hydrated, activeLevel]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const sk = await loadSkills();
      let uid: string | null = null;
      if (hasSupabaseConfig) {
        const { data } = await getCurrentUser();
        uid = data?.id ?? null;
      }
      const m = await loadMastery(uid);
      if (!alive) return;
      setSkills(sk);
      setMastery(m);
      setGuest(!uid);
      setReady(true);
    }, 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  const map: SkillMap | null = useMemo(
    () => (ready && skills.length ? buildSkillMap(level, skills, mastery, guest) : null),
    [ready, skills, mastery, guest, level]
  );

  // Migration/seed ороогүй бол карт огт харагдахгүй.
  if (ready && skills.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">🧭 {tr(locale, "Чадварын зураглал")}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {tr(
              locale,
              "HSK шалгалт давахад юу чадаж, юу дутуу байгааг харуулна. Мөр дээр дарвал тэр чадварыг сурах газар руу орно."
            )}
          </p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`h-8 w-8 rounded-full text-xs font-bold ${
                l === level ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {!map ? (
        <p className="mt-4 text-sm text-slate-500">{tr(locale, "Ачааллаж байна…")}</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                HSK {level} {tr(locale, "бэлэн байдал")}
              </p>
              <p className="text-3xl font-bold text-slate-900">{map.overallPct}%</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {(["good", "mid", "weak", "untested"] as SkillStatus[]).map((k) => (
                <span
                  key={k}
                  className={`rounded-full bg-white px-2.5 py-1 font-semibold ring-1 ring-slate-200 ${STATUS[k].cls}`}
                >
                  {STATUS[k].icon} {tr(locale, STATUS[k].label)} {map.counts[k]}
                </span>
              ))}
            </div>
            {map.counts.untested > 0 ? (
              <p className="w-full text-xs text-slate-500">
                {guest
                  ? tr(locale, "Нэвтэрвэл шалгалт, дасгалын үр дүн энд цуглана.")
                  : tr(
                      locale,
                      "⚪ Шалгаагүй чадвар олон байна — загвар шалгалт эсвэл дүрмийн дасгал хийвэл зураглал бүрэн болно."
                    )}{" "}
                <Link href={`/test?level=${level}`} className="font-semibold text-emerald-700">
                  {tr(locale, "Шалгалт өгөх →")}
                </Link>
              </p>
            ) : null}
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {map.groups.map((g) => {
              const weak = g.items.filter((i) => i.status === "weak").length;
              const good = g.items.filter((i) => i.status === "good").length;
              const isOpen = open === g.key || (open === null && g.key !== "grammar");
              return (
                <div key={g.key} className="py-2">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? `-${g.key}` : g.key)}
                    className="flex w-full items-center gap-2 px-1 py-1 text-left"
                  >
                    <span>{g.icon}</span>
                    <span className="flex-1 text-sm font-bold text-slate-900">
                      {tr(locale, g.title)} <span className="font-normal text-slate-500">({g.items.length})</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      ✅ {good} · ❌ {weak}
                    </span>
                    <span className="text-slate-400">{isOpen ? "▾" : "▸"}</span>
                  </button>
                  {isOpen ? (
                    <ul className="mt-1">
                      {g.items.map((it) => (
                        <Row key={it.id} it={it} />
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
