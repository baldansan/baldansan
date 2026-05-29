"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OnboardingTaskList } from "@/components/organization/onboarding-task-list";
import { OrganizationRoleBadge } from "@/components/organization/organization-role-badge";
import { PilotReadinessCard } from "@/components/organization/pilot-readiness-card";
import { PublicPageShell } from "@/components/public-page-shell";
import { ReportExportCard } from "@/components/teacher/report-export-card";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import type { OnboardingTaskStatus, OrganizationDashboardData } from "@/lib/b2b/types";
import type { OrganizationPilotSummary } from "@/lib/b2b/types";
import {
  buildPilotChecklistMarkdown,
  buildPilotPlanJson,
  buildPilotPlanMarkdown,
  type PilotPlanData,
} from "@/lib/organization/pilot-plan-builder";
import { canManageOrganization } from "@/lib/supabase/organization-permissions";
import {
  getOrganizationPilotSummary,
  markOrganizationReadyForPilot,
  seedDefaultOnboardingTasks,
  updateOnboardingTaskStatus,
  upsertOrganizationOnboarding,
} from "@/lib/supabase/organization-onboarding";
import { getOrganizationDashboardData } from "@/lib/supabase/organizations";

type Props = {
  organizationId: string;
};

export function OrganizationSetupWizardView({ organizationId }: Props) {
  const { loggedIn } = useTeacherAuth();
  const [dash, setDash] = useState<OrganizationDashboardData | null>(null);
  const [pilot, setPilot] = useState<OrganizationPilotSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [targetStartDate, setTargetStartDate] = useState("");
  const [targetStudentCount, setTargetStudentCount] = useState("");
  const [pilotGoal, setPilotGoal] = useState("");
  const [onboardingNote, setOnboardingNote] = useState("");

  const load = useCallback(async () => {
    const [dashRes, pilotRes] = await Promise.all([
      getOrganizationDashboardData(organizationId),
      getOrganizationPilotSummary(organizationId),
    ]);
    setLoading(false);
    if (dashRes.error) setError(dashRes.error);
    else setDash(dashRes.data);
    if (pilotRes.error) setError(pilotRes.error);
    else {
      setPilot(pilotRes.data);
      const o = pilotRes.data?.onboarding;
      if (o) {
        setTargetStartDate(o.targetStartDate ?? "");
        setTargetStudentCount(
          o.targetStudentCount != null ? String(o.targetStudentCount) : ""
        );
        setPilotGoal(o.pilotGoal ?? "");
        setOnboardingNote(o.onboardingNote ?? "");
      }
    }
  }, [organizationId]);

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    void load();
  }, [loggedIn, load]);

  const role = dash?.membership.memberRole ?? "assistant";
  const canManage = canManageOrganization({ role });

  const planData = useMemo((): PilotPlanData | null => {
    if (!dash || !pilot) return null;
    return {
      organization: {
        id: dash.organization.id,
        name: dash.organization.name,
        type: dash.organization.organizationType,
        status: dash.organization.status,
        email: dash.organization.email,
        phone: dash.organization.phone,
      },
      onboarding: pilot.onboarding,
      readiness: pilot.readiness,
      tasks: pilot.tasks,
      members: dash.members,
      classrooms: dash.classrooms,
      assignments: dash.assignments,
    };
  }, [dash, pilot]);

  const planMarkdown = useMemo(
    () => (planData ? buildPilotPlanMarkdown(planData) : ""),
    [planData]
  );
  const planJson = useMemo(
    () => (planData ? buildPilotPlanJson(planData) : ""),
    [planData]
  );
  const checklistMarkdown = useMemo(
    () => (planData ? buildPilotChecklistMarkdown(planData) : ""),
    [planData]
  );

  async function handleTaskStatus(taskId: string, status: OnboardingTaskStatus) {
    setSaving(true);
    const res = await updateOnboardingTaskStatus(taskId, status);
    setSaving(false);
    if (res.error) setError(res.error);
    else void load();
  }

  async function handleSavePilotDetails() {
    if (!canManage) return;
    setSaving(true);
    setError(null);
    const res = await upsertOrganizationOnboarding(organizationId, {
      targetStartDate: targetStartDate || null,
      targetStudentCount: targetStudentCount
        ? Number.parseInt(targetStudentCount, 10)
        : null,
      pilotGoal: pilotGoal || null,
      onboardingNote: onboardingNote || null,
      onboardingStatus: "in_progress",
    });
    setSaving(false);
    if (res.error) setError(res.error);
    else void load();
  }

  async function handleMarkReady() {
    if (!canManage) return;
    setSaving(true);
    setError(null);
    const res = await markOrganizationReadyForPilot(organizationId);
    setSaving(false);
    if (res.error) setError(res.error);
    else void load();
  }

  async function handleSeedTasks() {
    setSaving(true);
    const res = await seedDefaultOnboardingTasks(organizationId);
    setSaving(false);
    if (res.error) setError(res.error);
    else void load();
  }

  function downloadJson() {
    const blob = new Blob([planJson], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pilot-plan-${organizationId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loggedIn === null || loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading setup wizard…</p>
      </PublicPageShell>
    );
  }

  if (!loggedIn) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Organization setup wizard</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to continue.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Login
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  if (!dash || !pilot) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">{error ?? "Organization not found."}</p>
      </PublicPageShell>
    );
  }

  const ownersManagers = dash.members.filter((m) =>
    ["owner", "manager"].includes(m.role)
  );
  const teachers = dash.members.filter((m) =>
    ["owner", "manager", "teacher"].includes(m.role)
  );
  const pendingInvites = dash.members.filter((m) => m.status === "invited");

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href={`/organization/${organizationId}`}
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          ← Organization dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Organization setup wizard</h1>
          <OrganizationRoleBadge role={role} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Pilot эхлүүлэхэд шаардлагатай байгууллага, багш, classroom, assignment
          тохиргоог алхамчилж бэлдэнэ.
        </p>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <PilotReadinessCard
        organizationId={organizationId}
        readiness={pilot.readiness}
        onboardingStatus={pilot.onboarding?.onboardingStatus}
        pilotStage={pilot.onboarding?.pilotStage}
        showSetupLink={false}
      />

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Onboarding tasks</h2>
        {pilot.tasks.length === 0 && canManage ? (
          <button
            type="button"
            onClick={() => void handleSeedTasks()}
            disabled={saving}
            className="mt-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Seed default tasks
          </button>
        ) : null}
        <div className="mt-3">
          <OnboardingTaskList
            organizationId={organizationId}
            tasks={pilot.tasks}
            canManage={canManage}
            saving={saving}
            onStatusChange={(id, status) => void handleTaskStatus(id, status)}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Step 1 — Organization profile</h2>
        <p className="mt-2 text-sm text-slate-600">
          {dash.organization.name} · {dash.organization.organizationType} ·{" "}
          {dash.organization.status}
        </p>
        <p className="text-sm text-slate-600">
          {dash.organization.email ?? "—"} · {dash.organization.phone ?? "—"}
        </p>
        {canManage ? (
          <Link
            href={`/organization/${organizationId}`}
            className="mt-3 inline-block text-sm text-emerald-600"
          >
            Edit organization details →
          </Link>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Step 2 — Team members</h2>
        <p className="mt-2 text-sm text-slate-600">
          Owner/manager: {ownersManagers.length} · Teachers: {teachers.length} ·
          Pending invites: {pendingInvites.length}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/organization/${organizationId}/members`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Manage members →
          </Link>
          {canManage ? (
            <Link
              href={`/organization/${organizationId}/members/import`}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
            >
              Bulk import teachers/managers →
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Step 3 — Classrooms & students</h2>
        <p className="mt-2 text-sm text-slate-600">
          {dash.classroomCount} classroom(s)
          {dash.classrooms[0]
            ? ` · First: ${dash.classrooms[0].name} (${dash.classrooms[0].studentCount ?? 0} students)`
            : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/teacher/classes/new?organizationId=${organizationId}`}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Create classroom
          </Link>
          <Link
            href={`/organization/${organizationId}/classrooms`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            View classrooms
          </Link>
          {canManage && dash.classrooms[0] ? (
            <Link
              href={`/teacher/classes/${dash.classrooms[0].id}/students/import`}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
            >
              Bulk import students →
            </Link>
          ) : canManage && dash.classrooms.length === 0 ? (
            <p className="text-sm text-amber-800">
              Create a classroom first, then bulk import students.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Step 4 — Assignments</h2>
        <p className="mt-2 text-sm text-slate-600">
          {dash.assignmentCount} assignment(s)
          {dash.assignments[0] ? ` · First: ${dash.assignments[0].title}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/teacher/assignments/new?organizationId=${organizationId}`}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Create assignment
          </Link>
          <Link
            href={`/organization/${organizationId}/assignments`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            View assignments
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Step 5 — Student flow test</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
          <li>Student assigned to classroom (student_user_id or invite)</li>
          <li>
            Student opens{" "}
            <Link href="/my-assignments" className="text-emerald-600">
              /my-assignments
            </Link>
          </li>
          <li>Student completes lesson quiz</li>
          <li>Teacher sees result on class or assignment page</li>
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Step 6 — Pilot readiness</h2>
        {canManage ? (
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Target start date</span>
              <input
                type="date"
                value={targetStartDate}
                onChange={(e) => setTargetStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Target student count</span>
              <input
                type="number"
                min={1}
                value={targetStudentCount}
                onChange={(e) => setTargetStudentCount(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Pilot goal</span>
              <textarea
                value={pilotGoal}
                onChange={(e) => setPilotGoal(e.target.value)}
                rows={3}
                className="rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Жишээ: 2 classroom, 20 students, HSK5 pilot 4 weeks"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Onboarding note</span>
              <textarea
                value={onboardingNote}
                onChange={(e) => setOnboardingNote(e.target.value)}
                rows={2}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSavePilotDetails()}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Save pilot details
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleMarkReady()}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Mark ready for pilot
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Owner or manager can set pilot targets and mark readiness.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Pilot plan export</h2>
        <div className="mt-3 flex flex-col gap-3">
          <ReportExportCard
            markdown={planMarkdown}
            filename={`pilot-plan-${organizationId.slice(0, 8)}.md`}
            label="Copy pilot plan"
          />
          <ReportExportCard
            markdown={checklistMarkdown}
            filename={`pilot-checklist-${organizationId.slice(0, 8)}.md`}
            label="Copy checklist"
          />
          <button
            type="button"
            onClick={downloadJson}
            className="self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Download JSON
          </button>
        </div>
      </section>
    </PublicPageShell>
  );
}
