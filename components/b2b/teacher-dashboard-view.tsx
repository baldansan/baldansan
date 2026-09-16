"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { B2BSteps } from "@/components/b2b/b2b-section";
import { OrganizationRoleBadge } from "@/components/organization/organization-role-badge";
import { PilotReadinessCard } from "@/components/organization/pilot-readiness-card";
import { PublicPageShell } from "@/components/public-page-shell";
import { NeedsAttentionCard } from "@/components/teacher/needs-attention-card";
import { TeacherMetricCard } from "@/components/teacher/teacher-metric-card";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import { CLASSROOM_WORKFLOW_STEPS } from "@/lib/content/classroom-copy";
import type { Classroom, TeacherProfile } from "@/lib/classroom/types";
import type {
  RecentClassActivity,
  TeacherOverviewMetrics,
} from "@/lib/teacher/analytics-types";
import type { MyOrganization, OrganizationPilotSummary } from "@/lib/b2b/types";
import {
  getPersonalClassrooms,
  getTeacherClassrooms,
  getCurrentTeacherProfile,
} from "@/lib/supabase/classrooms";
import { getOrganizationPilotSummary } from "@/lib/supabase/organization-onboarding";
import { getMyOrganizationsWithRole } from "@/lib/supabase/organizations";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import { canManageOrganization } from "@/lib/supabase/organization-permissions";
import {
  getTeacherOverviewMetrics,
  getTeacherRecentClassActivity,
} from "@/lib/supabase/teacher-analytics";

/** Shown before a teacher profile exists, so the empty state explains itself. */
const TEACHER_CAPABILITIES = [
  {
    icon: "👥",
    title: "Анги, оюутны бүртгэл",
    detail:
      "Анги үүсгээд оюутнуудаа имэйлээр эсвэл жагсаалтаар нэг дор урина.",
  },
  {
    icon: "📝",
    title: "Даалгавар оноох",
    detail:
      "HSK түвшин бүрийн хичээлээс сонгож, хугацаатай даалгавар өгнө.",
  },
  {
    icon: "📊",
    title: "Ахицын хяналт",
    detail:
      "Хэн дуусгасан, хэн хоцорч байгаа, дасгалын дундаж оноог хичээл тус бүрээр харна.",
  },
  {
    icon: "📄",
    title: "Тайлан татах",
    detail:
      "Ангийн гүйцэтгэлийг тайлан болгон гаргаж, хэлтэс дээрээ хуваалцана.",
  },
];

const QUICK_ACTIONS = [
  { href: "/teacher/reports", label: "Ангийн тайлан" },
  { href: "/teacher/assignments", label: "Даалгаврууд" },
  { href: "/teacher/assignments/new", label: "Даалгавар үүсгэх" },
  { href: "/teacher/classes/new", label: "Анги үүсгэх" },
  { href: "/teacher/classes", label: "Миний ангиуд" },
  { href: "/courses", label: "Хичээлүүд", primary: true },
];

export function TeacherDashboardView() {
  const { loggedIn, email } = useTeacherAuth();
  const [profile, setProfile] = useState<TeacherProfile | null | undefined>(
    undefined
  );
  const [metrics, setMetrics] = useState<TeacherOverviewMetrics | null>(null);
  const [activity, setActivity] = useState<RecentClassActivity[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [myOrganizations, setMyOrganizations] = useState<MyOrganization[]>([]);
  const [personalClasses, setPersonalClasses] = useState<Classroom[]>([]);
  const [orgClasses, setOrgClasses] = useState<Classroom[]>([]);
  const [orgPilot, setOrgPilot] = useState<OrganizationPilotSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    async function load() {
      const [profileRes, metricsRes, activityRes, orgsRes, personalRes, allClassesRes] =
        await Promise.all([
        getCurrentTeacherProfile(),
        getTeacherOverviewMetrics(),
        getTeacherRecentClassActivity(8),
        getMyOrganizationsWithRole(),
        getPersonalClassrooms(),
        getTeacherClassrooms(),
      ]);
      setProfile(profileRes.data);
      if (metricsRes.error) setLoadError(metricsRes.error);
      else setMetrics(metricsRes.data);
      if (activityRes.error) setLoadError(activityRes.error);
      else setActivity(activityRes.data ?? []);
      setMyOrganizations(orgsRes.data ?? []);
      setPersonalClasses(personalRes.data ?? []);
      setOrgClasses(
        (allClassesRes.data ?? []).filter((c) => Boolean(c.organizationId))
      );
      if (orgsRes.data?.[0]) {
        const pilotRes = await getOrganizationPilotSummary(orgsRes.data[0].id);
        if (pilotRes.data) setOrgPilot(pilotRes.data);
      }
      setWarnings([...metricsRes.warnings, ...activityRes.warnings]);
    }
    void load();
  }, [loggedIn]);

  if (loggedIn === null) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </PublicPageShell>
    );
  }

  if (!loggedIn) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Багшийн самбар</h1>
          <p className="mt-2 text-sm text-slate-600">
            Багшийн самбарт хандахын тулд нэвтэрнэ үү.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Нэвтрэх
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800"
            >
              Танилцуулга үзэх
            </Link>
          </div>
        </section>
      </PublicPageShell>
    );
  }

  if (profile === undefined) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Самбарыг ачаалж байна…</p>
      </PublicPageShell>
    );
  }

  if (!profile) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Багш
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Багшийн самбар
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Анги үүсгэж, оюутнуудаа урьж, даалгавар оноон, ахицыг нь нэг дороос
            хянана. Эхлэхийн тулд багшийн профайлаа үүсгэнэ үү — нэг минут
            болно.
          </p>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {TEACHER_CAPABILITIES.map((item) => (
              <li
                key={item.title}
                className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200"
              >
                <p className="text-sm font-semibold text-slate-900">
                  <span aria-hidden className="mr-2">
                    {item.icon}
                  </span>
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/teacher/setup"
              className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Багшийн профайл үүсгэх →
            </Link>
            <Link
              href="/courses"
              className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
            >
              Хичээлүүдийг үзэх
            </Link>
          </div>
        </section>
      </PublicPageShell>
    );
  }

  const needsAttentionItems = (metrics?.classesNeedingAttention ?? []).map(
    (c) => ({
      kind: "low_assignment_completion" as const,
      label: c.name,
      detail: c.reason,
    })
  );

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          Багш
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Багшийн самбар
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Анги, даалгавар, сурагчийн ахицыг нэг дор хянах хэсэг.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {profile.displayName ?? email}
          {profile.organization ? ` · ${profile.organization}` : ""}
        </p>
        {loadError ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {loadError}
          </p>
        ) : null}
        {warnings.length > 0 ? (
          <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Миний байгууллагууд</h2>
        {myOrganizations.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {myOrganizations.map((org) => (
              <li
                key={org.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"
              >
                <div>
                  <span className="font-medium text-slate-900">{org.name}</span>
                  <span className="ml-2">
                    <OrganizationRoleBadge role={org.memberRole} />
                  </span>
                  <span className="ml-2 text-xs text-slate-500">{org.status}</span>
                </div>
                <Link
                  href={`/organization/${org.id}`}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-800"
                >
                  Самбар нээх →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              Байгууллагын бүртгэл хараахан холбогдоогүй байна.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/organization"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Байгууллагын хэсэг
              </Link>
              <Link
                href="/school-inquiry"
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Сургалтын төв / байгууллага холбох хүсэлт илгээх
              </Link>
            </div>
          </div>
        )}
      </section>

      {orgPilot && myOrganizations[0] ? (
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Байгууллагын туршилт — {myOrganizations[0].name}
          </h2>
          <div className="mt-3">
            <PilotReadinessCard
              organizationId={myOrganizations[0].id}
              readiness={orgPilot.readiness}
              onboardingStatus={orgPilot.onboarding?.onboardingStatus}
              pilotStage={orgPilot.onboarding?.pilotStage}
              showSetupLink={canManageOrganization({
                role: myOrganizations[0].memberRole,
              })}
            />
          </div>
          {orgPilot.tasks.filter((t) => t.status !== "completed").length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
              {orgPilot.tasks
                .filter((t) => t.status !== "completed" && t.status !== "skipped")
                .slice(0, 3)
                .map((t) => (
                  <li key={t.id}>· {t.title}</li>
                ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Хувийн ангиуд</h2>
        {personalClasses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Одоогоор хувийн анги алга.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {personalClasses.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/teacher/classes/${c.id}`}
                  className="block rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200 hover:ring-emerald-200"
                >
                  {c.name} · {c.studentCount ?? 0} сурагч
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/teacher/classes/new"
          className="mt-2 inline-block text-sm text-emerald-600"
        >
          Хувийн анги үүсгэх →
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Байгууллагын ангиуд</h2>
        {orgClasses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Байгууллагын анги алга. Байгууллагад нэгдэх эсвэл байгууллагын
            самбараас шинэ анги үүсгэнэ үү.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {orgClasses.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/teacher/classes/${c.id}`}
                  className="block rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200 hover:ring-emerald-200"
                >
                  {c.name}
                  {c.organizationName ? ` · ${c.organizationName}` : ""} ·{" "}
                  {c.studentCount ?? 0} сурагч
                </Link>
              </li>
            ))}
          </ul>
        )}
        {myOrganizations[0] ? (
          <Link
            href={`/teacher/classes/new?organizationId=${myOrganizations[0].id}`}
            className="mt-2 inline-block text-sm text-emerald-600"
          >
            Байгууллагын анги үүсгэх →
          </Link>
        ) : null}
      </section>

      {metrics ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <TeacherMetricCard
            label="Ангиуд"
            value={String(metrics.classroomCount)}
            sub={`${metrics.activeClassroomCount} идэвхтэй`}
          />
          <TeacherMetricCard
            label="Сурагчид"
            value={String(metrics.studentCount)}
          />
          <TeacherMetricCard
            label="Даалгавар"
            value={String(metrics.assignmentCount)}
          />
          <TeacherMetricCard
            label="Дуусгасан"
            value={String(metrics.completedResultCount)}
            sub="даалгаврын үр дүн"
          />
          <TeacherMetricCard
            label="Дасгалын дундаж"
            value={
              metrics.averageQuizPercentage != null
                ? `${metrics.averageQuizPercentage}%`
                : "—"
            }
          />
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Ангийн сүүлийн үйл ажиллагаа</h2>
        {activity.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Одоогоор бүртгэгдсэн үйл ажиллагаа алга.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {activity.map((item) => (
              <li
                key={`${item.type}-${item.id}`}
                className="rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200"
              >
                <span className="font-medium text-slate-900">{item.label}</span>
                {item.classroomName ? (
                  <span className="text-slate-500"> · {item.classroomName}</span>
                ) : null}
                <span className="block text-xs text-slate-400">
                  {formatMongoliaDateTimeWithLabel(item.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Анхаарал шаардсан ангиуд</h2>
        <div className="mt-3">
          <NeedsAttentionCard items={needsAttentionItems} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Түргэн тайлан</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ангийн ахиц, даалгаврын гүйцэтгэл, татаж авах боломжтой тайлан.
        </p>
        <Link
          href="/teacher/reports"
          className="mt-3 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Ангийн тайлан нээх →
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Түргэн үйлдэл</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                  : "rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Ангитай ажиллах зөвлөмж
        </h2>
        <div className="mt-3">
          <B2BSteps steps={CLASSROOM_WORKFLOW_STEPS} />
        </div>
      </section>
    </PublicPageShell>
  );
}
