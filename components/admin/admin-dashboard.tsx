"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminSectionTitle } from "@/components/admin/admin-section-title";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import type { LessonQaSummary } from "@/lib/admin/lesson-qa";
import type { AuthUser } from "@/types/auth";

type Props = {
  summary: LessonQaSummary;
};

export function AdminDashboard({ summary }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    getCurrentUser().then(({ data }) => setUser(data));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Admin самбар
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Контент удирдах суурь хэсэг. Одоогоор зөвхөн унших горим — Supabase руу
          бичих идэвхгүй.
        </p>
        {user ? (
          <p className="mt-2 text-sm text-slate-600">
            Нэвтэрсэн: {user.email ?? user.id}
          </p>
        ) : null}
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminSummaryCard
          label="Needs review"
          value={summary.needsReviewCount}
        />
        <AdminSummaryCard label="Complete" value={summary.completeCount} />
        <AdminSummaryCard label="Available" value={summary.availableCount} />
        <AdminSummaryCard label="Total lessons" value={summary.totalLessons} />
      </div>

      <AdminSectionTitle
        title="Хэсгүүд"
        description="Content QA-аар publish-ийн өмнө subtitle, vocabulary, quiz шалгана."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminCard
          title="Content QA"
          description={`${summary.totalLessons} хичээл — metadata, subtitle, vocabulary, quiz бүрэн байдлыг шалгах.`}
          href="/admin/lessons"
        />
        <AdminCard
          title="Lessons needing review"
          description={`${summary.needsReviewCount} хичээл засах эсвэл контент нэмэх шаардлагатай.`}
          href="/admin/lessons"
        />
        <AdminCard
          title="Available lessons"
          description={`${summary.availableCount} нийтлэгдсэн хичээл public route дээр.`}
          href="/admin/lessons"
        />
        <AdminCard
          title="Next action: Create lesson draft"
          description="Шинэ хичээлийн metadata skeleton — save дараагийн алхамд."
          href="/admin/lessons/new"
        />
        <AdminCard
          title="Хичээлүүд"
          description="Бүх хичээлийн QA хүснэгт, preview холбоос."
          href="/admin/lessons"
        />
        <AdminCard
          title="Upload workflow"
          description="metadata → subtitle → vocabulary → quiz → preview → publish"
        />
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <AdminSectionTitle title="Түргэн холбоос" />
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          <li>
            <Link
              href="/admin/lessons"
              className="font-medium text-emerald-700 hover:text-emerald-800"
            >
              Content QA →
            </Link>
          </li>
          <li>
            <Link
              href="/admin/lessons/new"
              className="font-medium text-emerald-700 hover:text-emerald-800"
            >
              Шинэ хичээл үүсгэх →
            </Link>
          </li>
          <li>
            <Link
              href="/"
              className="font-medium text-slate-600 hover:text-emerald-700"
            >
              Апп руу буцах →
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
