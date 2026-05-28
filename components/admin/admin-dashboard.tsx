"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "@/components/admin/admin-auth-gate";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminSectionTitle } from "@/components/admin/admin-section-title";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import type { AuthUser } from "@/types/auth";

function DashboardContent({ user }: { user: AuthUser }) {
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
        <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Admin эрх шалгах хэсгийг дараагийн алхамд идэвхжүүлнэ. Одоо нэвтэрсэн
          хэрэглэгч: {user.email ?? user.id}
        </p>
      </section>

      <AdminSectionTitle
        title="Хэсгүүд"
        description="Дараагийн алхмуудад subtitle, vocabulary, quiz засварлагч нэмэгдэнэ."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminCard
          title="Хичээлүүд"
          description="HSK5 хичээлүүдийг жагсаах, засах, шинээр үүсгэх (UI skeleton)."
          href="/admin/lessons"
        />
        <AdminCard
          title="Ноорог контент"
          description="Ноорог статустай хичээлүүд — Step 4-өөс publish workflow."
          href="/admin/lessons"
        />
        <AdminCard
          title="Нийтлэгдсэн хичээл"
          description="available статустай хичээлүүдийг хянах."
          href="/admin/lessons"
        />
        <AdminCard
          title="Upload workflow"
          description="Контент нэмэх алхам: metadata → subtitle → vocabulary → quiz → preview → publish. Дэлгэрэнгүй CONTENT_WORKFLOW.md."
        />
        <AdminCard
          title="Content quality checklist"
          description="Subtitle, vocabulary тоо, quiz тоо, public route шалгалт publish-ийн өмнө."
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
              Хичээл удирдах →
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

function AdminDashboardInner() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    getCurrentUser().then(({ data }) => setUser(data));
  }, []);

  if (!user) return null;

  return <DashboardContent user={user} />;
}

export function AdminDashboard() {
  return (
    <AdminAuthGate>
      <AdminDashboardInner />
    </AdminAuthGate>
  );
}
