import { TutorNotesAdminClient } from "@/components/admin/tutor-notes-admin-client";
import { fetchMockTests } from "@/lib/supabase/mock-tests-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Багшийн тайлбар оруулах — Удирдлагын хэсэг",
  description:
    "Загвар шалгалтын асуултын экспорт ба «Хувийн багш» тайлбарын JSON импорт.",
};

/** Admin-guarded: app/admin/layout.tsx → AdminLayoutShell → AdminGuard. */
export default async function AdminTutorNotesPage() {
  const tests = await fetchMockTests();
  return (
    <TutorNotesAdminClient
      tests={tests.map((test) => ({
        id: test.id,
        title: test.title,
        hsk_level: test.hsk_level,
        total_questions: test.total_questions,
      }))}
    />
  );
}
