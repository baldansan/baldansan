"use client";

import { DEMO_BADGE_LABEL, DEMO_DATA_NOTE } from "@/lib/demo-data";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { GradeChip } from "@/components/admin/learner-grade-board";
import {
  LEARNER_GRADE_LABELS,
  LEARNER_GRADE_RANGES,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";
// Type-only: the data module is server-only and must not reach the browser bundle.
import type {
  ClassDeliveryMode,
  TrainingCenterClassRow,
  TrainingCenterOverview,
} from "@/lib/supabase/admin-training-center";

const DELIVERY_MODE_LABELS: Record<ClassDeliveryMode, string> = {
  in_person: "Танхим",
  online: "Онлайн",
  hybrid: "Холимог",
};

type Props = {
  overview: TrainingCenterOverview;
};

type SortKey = "grade" | "completion" | "activity";

const SORT_OPTIONS: { key: SortKey; label: string; hint: string }[] = [
  {
    key: "grade",
    label: "Дундаж үнэлгээгээр",
    hint: "Хамгийн өндөр оноотой бүлэг эхэнд.",
  },
  {
    key: "completion",
    label: "Даалгаврын гүйцэтгэлээр",
    hint: "Өгсөн даалгавраа хамгийн их дуусгасан бүлэг эхэнд.",
  },
  {
    key: "activity",
    label: "Идэвхээр",
    hint: "Нэг сурагчид ногдох суралцсан хугацаагаар.",
  },
];

/** Solid bar tones, same hue family as the grade chips. */
const GRADE_BAR_TONES: Record<LearnerGradeBucket, string> = {
  A: "bg-emerald-400",
  B: "bg-lime-400",
  C: "bg-amber-400",
  D: "bg-orange-400",
  F: "bg-red-400",
  unrated: "bg-slate-300",
};

const DELIVERY_TONES: Record<ClassDeliveryMode, string> = {
  in_person: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  online: "bg-sky-50 text-sky-800 ring-sky-200",
  hybrid: "bg-violet-50 text-violet-800 ring-violet-200",
};

const numberFormatter = new Intl.NumberFormat("mn-MN");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** A missing figure is «—» with the reason on hover — never a zero. */
function Missing({ reason }: { reason?: string }) {
  return (
    <span className="text-slate-400" title={reason}>
      —
    </span>
  );
}

function DeliveryBadge({ mode }: { mode: ClassDeliveryMode | null }) {
  if (!mode) {
    return <Missing reason="Хичээллэх хэлбэр бүртгэгдээгүй байна." />;
  }
  return (
    <span className={`admin-badge ${DELIVERY_TONES[mode]}`}>
      {DELIVERY_MODE_LABELS[mode]}
    </span>
  );
}

function ScoreCell({
  score,
  grade,
  ratedCount,
  reason,
}: {
  score: number | null;
  grade: LearnerGradeBucket;
  ratedCount: number;
  reason?: string;
}) {
  if (score == null) {
    return (
      <div className="flex items-center gap-2">
        <GradeChip bucket="unrated" size="sm" />
        <span className="text-xs text-slate-500">
          {reason ?? "Үнэлэхэд хангалттай өгөгдөл алга."}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <GradeChip bucket={grade} size="sm" />
      <span className="font-bold text-slate-900">{score}</span>
      <span className="text-xs text-slate-500">
        {formatNumber(ratedCount)} сурагчаар
      </span>
    </div>
  );
}

function GradeDistribution({
  distribution,
}: {
  distribution: { bucket: LearnerGradeBucket; count: number }[];
}) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <p className="text-xs text-slate-500">
        Үнэлгээ гаргах сурагч алга.
      </p>
    );
  }

  const present = distribution.filter((item) => item.count > 0);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={present
          .map(
            (item) =>
              `${LEARNER_GRADE_LABELS[item.bucket]}: ${item.count} сурагч`
          )
          .join(", ")}
      >
        {present.map((item) => (
          <span
            key={item.bucket}
            className={GRADE_BAR_TONES[item.bucket]}
            style={{ width: `${(item.count / total) * 100}%` }}
            title={`${LEARNER_GRADE_LABELS[item.bucket]} — ${item.count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {present.map((item) => (
          <span
            key={item.bucket}
            className="inline-flex items-center gap-1"
            title={LEARNER_GRADE_RANGES[item.bucket]}
          >
            <GradeChip bucket={item.bucket} size="sm" />
            <span className="text-xs font-semibold text-slate-700">
              {formatNumber(item.count)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Why a class has no average score — stated plainly instead of showing 0. */
function unratedReason(row: TrainingCenterClassRow): string {
  if (row.studentCount === 0) return "Бүлэгт сурагч бүртгэгдээгүй.";
  if (row.linkedStudentCount === 0) return "Апп руу нэвтэрсэн сурагч алга.";
  if (row.assignmentCount === 0) {
    return "Даалгавар оноогоогүй, дасгал ажиллаагүй байна.";
  }
  return "Үнэлэхэд хангалттай дасгалын бичлэг алга.";
}

function sortValue(row: TrainingCenterClassRow, key: SortKey): number | null {
  if (key === "grade") return row.averageScore;
  if (key === "completion") return row.completionRate;
  return row.averageStudyMinutes;
}

export function TrainingCenterBoard({ overview }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("grade");

  const sortedClasses = useMemo(() => {
    const rows = [...overview.classes];
    rows.sort((a, b) => {
      const left = sortValue(a, sortKey);
      const right = sortValue(b, sortKey);
      // Rows with nothing to compare stay at the bottom rather than reading as 0.
      if (left == null && right == null) return a.name.localeCompare(b.name, "mn");
      if (left == null) return 1;
      if (right == null) return -1;
      if (left !== right) return right - left;
      return a.name.localeCompare(b.name, "mn");
    });
    return rows;
  }, [overview.classes, sortKey]);

  const activeSortHint =
    SORT_OPTIONS.find((option) => option.key === sortKey)?.hint ?? "";

  const orgHref = (organizationId: string | null) =>
    organizationId ? `/admin/center?org=${organizationId}` : "/admin/center";

  return (
    <div className="flex flex-col gap-6">
      {overview.unknownOrganization ? (
        <p className="admin-panel border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
          Хаягт заасан байгууллага олдсонгүй. Доор бүх бүлгийг харуулав.
        </p>
      ) : null}

      {overview.organizations.length > 1 ? (
        <section className="admin-panel p-4">
          <h2 className="admin-section-title text-base">Байгууллага</h2>
          <p className="admin-section-desc">
            Аль төвийн бүлгүүдийг харахаа сонгоно уу.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={orgHref(null)}
              aria-current={
                overview.selectedOrganizationId == null ? "page" : undefined
              }
              className={
                overview.selectedOrganizationId == null
                  ? "admin-btn-secondary"
                  : "admin-btn-ghost text-sm"
              }
            >
              Бүгд
            </Link>
            {overview.organizations.map((organization) => (
              <Link
                key={organization.id}
                href={orgHref(organization.id)}
                aria-current={
                  overview.selectedOrganizationId === organization.id
                    ? "page"
                    : undefined
                }
                className={
                  overview.selectedOrganizationId === organization.id
                    ? "admin-btn-secondary"
                    : "admin-btn-ghost text-sm"
                }
              >
                {organization.name}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {formatNumber(organization.classroomCount)} бүлэг
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section
        aria-label="Төвийн хураангуй"
        className="grid grid-cols-2 gap-3 lg:grid-cols-5"
      >
        <AdminMetricCard
          label="Бүлэг"
          value={formatNumber(overview.totals.classroomCount)}
          hint={
            overview.selectedOrganizationName
              ? overview.selectedOrganizationName
              : "Бүх байгууллагын нийлбэр"
          }
          icon="🏢"
          accent="slate"
        />
        <AdminMetricCard
          label="Багш"
          value={formatNumber(overview.totals.teacherCount)}
          hint="Бүлэг хариуцсан багш"
          icon="🧑‍🏫"
          accent="slate"
        />
        <AdminMetricCard
          label="Сурагч"
          value={formatNumber(overview.totals.studentCount)}
          hint={`${formatNumber(overview.totals.linkedStudentCount)} нь апп руу нэвтэрсэн`}
          icon="🎒"
          accent="slate"
        />
        <AdminMetricCard
          label="Дундаж оноо"
          value={overview.totals.averageScore ?? "—"}
          hint={
            overview.totals.averageScore == null
              ? "Үнэлэхэд хангалттай өгөгдөл алга"
              : `${LEARNER_GRADE_LABELS[overview.totals.averageGrade]} · ${formatNumber(overview.totals.ratedStudentCount)} үнэлгээгээр`
          }
          icon="🎓"
          accent={overview.totals.averageScore == null ? "slate" : "emerald"}
        />
        <AdminMetricCard
          label={`Сүүлийн ${overview.activityWindowDays} хоногт идэвхтэй`}
          value={
            overview.totals.activeShare == null
              ? "—"
              : `${overview.totals.activeShare}%`
          }
          hint={
            overview.totals.activeShare == null
              ? "Нэвтэрсэн сурагч алга тул тооцох боломжгүй"
              : `${formatNumber(overview.totals.activeStudentCount ?? 0)} / ${formatNumber(overview.totals.linkedStudentCount)} сурагч`
          }
          icon="⚡"
          accent={overview.totals.activeShare == null ? "slate" : "amber"}
        />
      </section>

      {overview.classes.length === 0 ? (
        <section className="admin-panel p-6">
          <h2 className="admin-section-title">Бүлэг алга</h2>
          <p className="admin-section-desc">
            {overview.selectedOrganizationName
              ? `«${overview.selectedOrganizationName}» байгууллагад бүртгэлтэй бүлэг алга байна.`
              : "Одоогоор бүртгэлтэй бүлэг алга байна. Байгууллага үүсгээд бүлэг, багш нэмсний дараа энэ хуудас дүүрнэ."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/b2b/organizations/new" className="admin-btn-secondary">
              Байгууллага үүсгэх
            </Link>
            <Link href="/admin/b2b" className="admin-btn-ghost text-sm">
              Байгууллагын хэсэг
            </Link>
          </div>
        </section>
      ) : (
        <>
          {overview.classes.some((row) => row.isDemo) ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-amber-900">
              {DEMO_DATA_NOTE}
            </p>
          ) : null}

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="admin-label">Эрэмбэлэх</span>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSortKey(option.key)}
                  aria-pressed={sortKey === option.key}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                    sortKey === option.key
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {activeSortHint} Тоологдох өгөгдөлгүй бүлэг жагсаалтын төгсгөлд
              орно — «—» гэдэг нь тэг биш, тоолох боломжгүй гэсэн үг.
            </p>
          </section>

          <section className="admin-table-wrap">
            <table className="admin-table">
              <caption className="sr-only">Бүлгүүдийн харьцуулалт</caption>
              <thead>
                <tr>
                  <th>Бүлэг</th>
                  <th>Түвшин</th>
                  <th>Хэлбэр</th>
                  <th>Багш</th>
                  <th>Сурагч</th>
                  <th>Дундаж оноо</th>
                  <th>Даалгаврын гүйцэтгэл</th>
                  <th>Суралцсан хугацаа</th>
                  <th>{overview.activityWindowDays} хоног идэвхгүй</th>
                </tr>
              </thead>
              <tbody>
                {sortedClasses.map((row) => (
                  <tr key={row.classroomId}>
                    <td>
                      <span className="font-medium text-slate-900">
                        {row.name}
                      </span>
                      {row.isDemo ? (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                          {DEMO_BADGE_LABEL}
                        </span>
                      ) : null}
                      {row.scheduleNote ? (
                        <span className="block text-xs text-slate-500">
                          {row.scheduleNote}
                        </span>
                      ) : null}
                      {!overview.selectedOrganizationId && row.organizationName ? (
                        <span className="block text-xs text-slate-400">
                          {row.organizationName}
                        </span>
                      ) : null}
                    </td>
                    <td className="text-slate-700">
                      {row.levelLabel ?? (
                        <Missing reason="Бүлгийн түвшин бүртгэгдээгүй." />
                      )}
                    </td>
                    <td>
                      <DeliveryBadge mode={row.deliveryMode} />
                    </td>
                    <td className="text-slate-700">{row.teacherLabel}</td>
                    <td className="text-slate-700">
                      {formatNumber(row.studentCount)}
                      <span className="block text-xs text-slate-500">
                        {formatNumber(row.linkedStudentCount)} нэвтэрсэн
                      </span>
                    </td>
                    <td>
                      <ScoreCell
                        score={row.averageScore}
                        grade={row.averageGrade}
                        ratedCount={row.ratedStudentCount}
                        reason={unratedReason(row)}
                      />
                    </td>
                    <td className="text-slate-700">
                      {row.completionRate == null ? (
                        <Missing reason="Даалгавар оноогоогүй эсвэл нэвтэрсэн сурагч алга." />
                      ) : (
                        <>
                          {row.completionRate}%
                          <span className="block text-xs text-slate-500">
                            {formatNumber(row.assignmentCount)} даалгавраас
                          </span>
                        </>
                      )}
                    </td>
                    <td className="text-slate-700">
                      {row.averageStudyMinutes == null ? (
                        <Missing
                          reason={
                            overview.studyMinutesUnavailable
                              ? "Хугацааны хэмжилт идэвхгүй байна."
                              : "Нэвтэрсэн сурагч алга."
                          }
                        />
                      ) : (
                        <>
                          {formatNumber(row.averageStudyMinutes)} мин
                          <span className="block text-xs text-slate-500">
                            нэг сурагчид
                          </span>
                        </>
                      )}
                    </td>
                    <td>
                      {row.inactiveStudentCount == null ? (
                        <Missing reason="Нэвтэрсэн сурагч алга." />
                      ) : (
                        <span
                          className={
                            row.inactiveStudentCount > 0
                              ? "font-semibold text-amber-700"
                              : "text-slate-700"
                          }
                        >
                          {formatNumber(row.inactiveStudentCount)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="admin-panel p-5">
            <h2 className="admin-section-title">Бүлэг тус бүрийн үнэлгээний тархалт</h2>
            <p className="admin-section-desc">
              Нэг бүлэгт хэдэн сурагч A, B, C, D, F авсныг харуулна. Дундаж оноо
              ижил боловч тархалт нь өөр хоёр бүлэг ялгаатай зааж байна гэсэн үг.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedClasses.map((row) => (
                <div
                  key={row.classroomId}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {row.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.levelLabel ?? "Түвшин тодорхойгүй"} ·{" "}
                        {row.deliveryMode
                          ? DELIVERY_MODE_LABELS[row.deliveryMode]
                          : "Хэлбэр тодорхойгүй"}
                      </p>
                    </div>
                    <GradeChip bucket={row.averageGrade} size="sm" />
                  </div>
                  <div className="mt-3">
                    <GradeDistribution distribution={row.distribution} />
                  </div>
                  {row.notes.length > 0 ? (
                    <ul className="mt-2 flex flex-col gap-0.5">
                      {row.notes.map((note) => (
                        <li key={note} className="text-xs text-slate-500">
                          {note}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel p-5">
            <h2 className="admin-section-title">Багш нарын харьцуулалт</h2>
            <p className="admin-section-desc">
              Багш бүрийн бүх бүлгийн сурагчдыг нэгтгэж үнэлэв. Ижил түвшний хоёр
              бүлгийг зэрэгцүүлэн харах боломжтой.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Энэ зөрүү зөвхөн багшийн ажлыг илэрхийлэхгүй. Бүлгийн хэмжээ,
              хичээллэх цагийн хуваарь, сурагчдын анхны түвшин, танхим эсвэл
              онлайн хэлбэр зэрэг олон зүйл нөлөөлдөг. Тоог яриа эхлүүлэх шалтгаан
              болгон ашиглаж, дүгнэлт болгож болохгүй.
            </p>

            {overview.teachers.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Бүлэгт багш оноогоогүй байна.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {overview.teachers.map((teacher) => (
                  <article
                    key={teacher.teacherUserId}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <header className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {teacher.teacherLabel}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {formatNumber(teacher.classes.length)} бүлэг ·{" "}
                          {formatNumber(teacher.studentCount)} сурагч
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <GradeChip bucket={teacher.averageGrade} />
                        <span className="text-lg font-bold text-slate-900">
                          {teacher.averageScore ?? "—"}
                        </span>
                      </div>
                    </header>

                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="admin-label">Даалгаврын гүйцэтгэл</dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">
                          {teacher.completionRate == null ? (
                            <Missing reason="Даалгавар оноогоогүй эсвэл нэвтэрсэн сурагч алга." />
                          ) : (
                            `${teacher.completionRate}%`
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="admin-label">Үнэлэгдсэн сурагч</dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">
                          {formatNumber(teacher.ratedStudentCount)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3">
                      <GradeDistribution distribution={teacher.distribution} />
                    </div>

                    <ul className="mt-3 flex flex-col gap-1">
                      {teacher.classes.map((item) => (
                        <li
                          key={item.classroomId}
                          className="flex flex-wrap items-center gap-2 text-xs text-slate-600"
                        >
                          <span className="font-medium text-slate-800">
                            {item.name}
                          </span>
                          <span>{item.levelLabel ?? "Түвшин тодорхойгүй"}</span>
                          <DeliveryBadge mode={item.deliveryMode} />
                          <span>{formatNumber(item.studentCount)} сурагч</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section className="admin-panel p-5">
        <h2 className="admin-section-title">Тоонууд хаанаас гардаг вэ</h2>
        <ul className="admin-section-desc mt-2 flex list-disc flex-col gap-1 pl-5">
          <li>
            Дундаж оноо нь сурагч бүрийн сүүлийн дасгалын хувь, даалгаврын
            гүйцэтгэл, сурсан үгээс бүрдэх A–F үнэлгээний дундаж.
          </li>
          <li>
            Даалгаврын гүйцэтгэл = дуусгасан даалгавар ÷ (нэвтэрсэн сурагчийн тоо
            × бүлэгт оноосон даалгаврын тоо).
          </li>
          <li>
            Суралцсан хугацаа нь сүүлийн {overview.activityWindowDays} хоногийн
            хэмжилтийг нэвтэрсэн сурагчийн тоонд хуваасан дундаж.
          </li>
          <li>
            «{overview.activityWindowDays} хоног идэвхгүй» баганад хичээл, дасгал,
            үг, даалгаврын аль нэгээр ч бичлэг үлдээгээгүй сурагчид ордог.
          </li>
          <li>
            Апп руу нэвтрээгүй, зөвхөн урилга хүлээж буй сурагчийн өгөгдөл
            байхгүй тул үнэлгээ, гүйцэтгэлд тооцогдохгүй.
          </li>
        </ul>
      </section>

      {overview.unassignedClassroomCount > 0 &&
      !overview.selectedOrganizationId ? (
        <p className="text-xs text-slate-500">
          {formatNumber(overview.unassignedClassroomCount)} бүлэг ямар ч
          байгууллагад холбогдоогүй байна — тэднийг «Бүгд» харагдацад л харна.
        </p>
      ) : null}

      {overview.warnings.length > 0 ? (
        <section className="admin-panel border-amber-200 bg-amber-50/60 p-4">
          <h2 className="text-sm font-semibold text-amber-900">Анхааруулга</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {overview.warnings.map((warning) => (
              <li key={warning} className="text-xs text-amber-800">
                • {warning}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
