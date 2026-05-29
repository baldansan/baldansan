"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import { ASSIGNMENT_TYPES } from "@/lib/classroom/types";
import { getAllLessonIdsSync } from "@/lib/content";
import {
  createAssignment,
  getTeacherClassrooms,
} from "@/lib/supabase/classrooms";
import type { Classroom } from "@/lib/classroom/types";

export function NewAssignmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillLesson = searchParams.get("lesson") ?? "";
  const prefillClassroom = searchParams.get("classroom") ?? "";
  const prefillOrganizationId = searchParams.get("organizationId") ?? "";

  const lessonIds = getAllLessonIdsSync();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomId, setClassroomId] = useState(prefillClassroom);
  const [lessonId, setLessonId] = useState(
    lessonIds.includes(prefillLesson) ? prefillLesson : lessonIds[0] ?? "1"
  );
  const [assignmentType, setAssignmentType] = useState<string>("full_lesson");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("assigned");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await getTeacherClassrooms();
      let list = data ?? [];
      if (prefillOrganizationId) {
        list = list.filter((c) => c.organizationId === prefillOrganizationId);
      }
      setClassrooms(list);
      if (prefillClassroom && list.some((c) => c.id === prefillClassroom)) {
        setClassroomId(prefillClassroom);
      } else if (list[0]) {
        setClassroomId((prev) => prev || list[0].id);
      }
    }
    void load();
  }, [prefillClassroom, prefillOrganizationId]);

  useEffect(() => {
    if (!title && lessonId) {
      setTitle(`Lesson ${lessonId} assignment`);
    }
  }, [lessonId, title]);

  async function handleCreate() {
    if (!classroomId || !title.trim()) return;
    setSaving(true);
    setError(null);
    const { data, error: createError } = await createAssignment({
      classroomId,
      lessonId,
      assignmentType,
      title,
      instructions,
      dueDate: dueDate || undefined,
      status,
    });
    setSaving(false);
    if (createError || !data) {
      setError(createError ?? "Failed to create assignment.");
      return;
    }
    router.push(`/teacher/assignments/${data.id}`);
  }

  if (classrooms.length === 0) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">
          Эхлээд анги үүсгэнэ үү.
        </p>
        <Link
          href="/teacher/classes/new"
          className="mt-3 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
        >
          Create class
        </Link>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href="/teacher/assignments"
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← Даалгаврууд
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Шинэ даалгавар</h1>
        {prefillOrganizationId ? (
          <p className="mt-2 text-sm text-slate-600">
            Organization classrooms only (organizationId filter active).
          </p>
        ) : null}
      </section>

      <form
        className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void handleCreate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Select class</span>
          <select
            value={classroomId}
            onChange={(e) => setClassroomId(e.target.value)}
            required
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.organizationName ? ` (${c.organizationName})` : " (personal)"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Select lesson</span>
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {lessonIds.map((id) => (
              <option key={id} value={id}>
                Lesson {id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Assignment type</span>
          <select
            value={assignmentType}
            onChange={(e) => setAssignmentType(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {ASSIGNMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Instructions</span>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="assigned">assigned</option>
            <option value="archived">archived</option>
          </select>
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create assignment"}
        </button>
      </form>
    </PublicPageShell>
  );
}
