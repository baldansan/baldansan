"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KidCreateForm } from "@/components/kids/kid-create-form";
import { KidsServiceRoleNotice } from "@/components/kids/kids-service-role-notice";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { fetchKids } from "@/lib/kids/client";
import { formatKidLastActive } from "@/lib/kids/format";
import type { KidProfile } from "@/lib/kids/types";

type Props = {
  classroomId: string;
  /** Хүүхэд нэмэгдсэний дараа ангийн статистикийг дахин ачаална. */
  onChanged?: () => void;
};

/** Багшийн ангийн хуудас: имэйлгүй сурагч (хүүхдийн бүртгэл) нэмэх + жагсаалт. */
export function ClassKidsSection({ classroomId, onChanged }: Props) {
  const locale = useUiLocale();
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceRoleMissing, setServiceRoleMissing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchKids(classroomId).then((res) => {
      if (!alive) return;
      setLoading(false);
      if (!res.data) {
        setServiceRoleMissing(Boolean(res.serviceRoleMissing));
        setError(res.serviceRoleMissing ? null : res.error);
        return;
      }
      setError(null);
      setKids(res.data);
    });
    return () => {
      alive = false;
    };
  }, [classroomId]);

  if (serviceRoleMissing) return <KidsServiceRoleNotice />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {tr(locale, "Имэйлгүй бага насны сурагчид бүртгэл үүсгээд энэ ангид шууд нэмнэ. Хүүхэд утсан дээр «🧒 Хүүхэд нэвтрэх» → avatar → 4 оронтой PIN-ээр орно.")}
      </p>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">{tr(locale, "Ачааллаж байна…")}</p>
      ) : kids.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {kids.map((kid) => (
            <li
              key={kid.childUserId}
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200"
            >
              <span className="text-2xl" aria-hidden>
                {kid.avatar}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900" translate="no">
                  {kid.displayName}
                </span>
                <span className="block text-xs text-slate-500">
                  {formatKidLastActive(locale, kid.lastActiveAt)}
                  {kid.currentStreak > 0 ? ` · 🔥 ${kid.currentStreak}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{tr(locale, "Энэ ангид хүүхдийн бүртгэл хараахан алга.")}</p>
      )}

      {showForm ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <KidCreateForm
            classroomId={classroomId}
            compact
            onCreated={(kid) => {
              setKids((list) => [...list, kid]);
              setShowForm(false);
              onChanged?.();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          ＋ {tr(locale, "Хүүхэд нэмэх")}
        </button>
      )}

      <p className="text-xs text-slate-500">
        {tr(locale, "Таны нэмсэн хүүхдүүдийн нэр, avatar, PIN-г «Гэр бүл» хуудаснаас засна.")}{" "}
        <Link href="/family" className="font-semibold text-emerald-700">
          /family →
        </Link>
      </p>
    </div>
  );
}
