"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CsvImportCard } from "@/components/import/csv-import-card";
import { PublicPageShell } from "@/components/public-page-shell";
import type { BulkImportResult, ClassroomStudentImportRow } from "@/lib/import/csv-import";
import { CLASSROOM_STUDENT_EXAMPLE_CSV } from "@/lib/import/csv-import";
import {
  bulkAddClassroomStudents,
  getClassroomById,
} from "@/lib/supabase/classrooms";

type Props = {
  classroomId: string;
};

export function ClassroomStudentsImportView({ classroomId }: Props) {
  const [classroomName, setClassroomName] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [canImport, setCanImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await getClassroomById(classroomId);
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error ?? "Classroom not found.");
      setCanImport(false);
      return;
    }
    setClassroomName(res.data.name);
    setOrganizationId(res.data.organizationId);
    setCanImport(true);
  }, [classroomId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleImport(
    validRows: ClassroomStudentImportRow[]
  ): Promise<BulkImportResult> {
    const res = await bulkAddClassroomStudents(
      classroomId,
      validRows.map((row) => ({
        rowIndex: row.rowIndex,
        email: row.email,
        displayName: row.displayName,
        studentUserId: row.studentUserId,
        status: row.status,
      })),
      organizationId ? { organizationId } : undefined
    );

    const importedAt = new Date().toISOString();
    if (res.error || !res.data) {
      return {
        importedAt,
        type: "classroom_students",
        inserted: 0,
        skipped: 0,
        errors: [res.error ?? "Import failed."],
        warnings: [],
        duplicates: [],
        rows: [],
      };
    }

    return {
      importedAt,
      type: "classroom_students",
      inserted: res.data.inserted,
      skipped: res.data.skipped,
      errors: res.data.errors,
      warnings: [],
      duplicates: [],
      rows: res.data.rows.map((r) => ({
        rowIndex: r.rowIndex ?? 0,
        status: r.status,
        message: r.message,
        email: r.email,
        displayName: r.displayName,
        id: r.studentId,
      })),
    };
  }

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading…</p>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href={`/teacher/classes/${classroomId}`}
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          ← Classroom
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Bulk import students</h1>
        <p className="mt-1 text-sm text-slate-600">
          Classroom-д сурагчдыг CSV-ээр бөөнөөр нэмнэ.
          {classroomName ? ` (${classroomName})` : ""}
        </p>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
      </section>

      <CsvImportCard
        title="Classroom student CSV import"
        subtitle="Paste CSV with email, display_name, status. No email is sent yet."
        importType="classroom_students"
        expectedHeaders={["email", "display_name", "status"]}
        exampleCsv={CLASSROOM_STUDENT_EXAMPLE_CSV}
        helpText="Optional student_user_id links an existing auth user. Otherwise rows stay invited until linked."
        canImport={canImport}
        onImport={handleImport}
      />

      <Link
        href={`/teacher/classes/${classroomId}`}
        className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
      >
        ← Back to classroom
      </Link>
      <p className="text-sm text-slate-600">
        After import, generate invite links from the{" "}
        <Link
          href={`/teacher/classes/${classroomId}`}
          className="font-semibold text-emerald-600"
        >
          classroom page
        </Link>{" "}
        or{" "}
        <Link
          href={`/teacher/classes/${classroomId}/invitations`}
          className="font-semibold text-emerald-600"
        >
          invitations list
        </Link>
        .
      </p>
    </PublicPageShell>
  );
}
