import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MockTestsActiveClient } from "@/components/admin/mock-tests-active-client";
import { fetchMockTests } from "@/lib/supabase/mock-tests-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Жинхэнэ шалгалтууд — Удирдлагын хэсэг",
};

/** Admin-guarded: app/admin/layout.tsx → AdminLayoutShell → AdminGuard. */
export default async function AdminMockTestsPage() {
  const tests = await fetchMockTests(undefined, { includeInactive: true });
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Жинхэнэ шалгалтууд (真题)"
        description="Түвшин бүрийн тестийг суралцагчид харуулах/нуух. HSK 1–2-т 10 орчим тест хангалттай; үлдсэнийг нууна (084 migration)."
      />
      <MockTestsActiveClient
        tests={tests.map((t) => ({
          id: t.id,
          title: t.title,
          hsk_level: t.hsk_level,
          total_questions: t.total_questions,
          is_active: t.is_active,
        }))}
      />
    </div>
  );
}
