"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AttendanceSummaryCard } from "@/components/teacher/attendance-summary-card";
import { PublicPageShell } from "@/components/public-page-shell";
import { mongoliaDay } from "@/lib/analytics/activity-tracker";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  formatIsoDay,
  type AttendanceEntryInput,
  type AttendanceRegister as AttendanceRegisterData,
  type AttendanceStatus,
  type ClassroomAttendanceSummary,
} from "@/lib/classroom/attendance-types";
import { MONGOLIA_TIME_LABEL, formatMongoliaDateTime } from "@/lib/datetime/mongolia-time";
import {
  ATTENDANCE_WINDOW_DAYS,
  DELIVERY_MODE_LABELS,
  getAttendanceClassroomContext,
  getAttendanceRegister,
  getClassroomAttendanceSummary,
  saveAttendanceRegister,
  type AttendanceClassroomContext,
} from "@/lib/supabase/classroom-attendance";

type Props = {
  classroomId: string;
};

/** What the teacher has on screen for one student, saved or not. */
type DraftEntry = {
  status: AttendanceStatus | null;
  note: string;
};

type DraftMap = Record<string, DraftEntry>;

function draftFromRegister(register: AttendanceRegisterData): DraftMap {
  const saved = new Map(register.records.map((r) => [r.studentId, r]));
  const draft: DraftMap = {};
  for (const entry of register.roster) {
    const row = saved.get(entry.studentId);
    draft[entry.studentId] = {
      status: row?.status ?? null,
      note: row?.note ?? "",
    };
  }
  return draft;
}

function draftsEqual(a: DraftMap, b: DraftMap): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const left = a[key];
    const right = b[key];
    if (!left || !right) return false;
    if (left.status !== right.status) return false;
    if (left.note.trim() !== right.note.trim()) return false;
  }
  return true;
}

/**
 * Ирцийн бүртгэл — нэг өдрийн ирцийг авах дэлгэц.
 *
 * Онлайн анги ч ижилхэн ирцээ бүртгэнэ; хичээл явуулах хэлбэр нь зөвхөн
 * тайлбар болохоос хаалт биш.
 */
export function AttendanceRegisterView({ classroomId }: Props) {
  const today = useMemo(() => mongoliaDay(), []);

  const [sessionDate, setSessionDate] = useState(today);
  const [classroom, setClassroom] = useState<AttendanceClassroomContext | null>(
    null
  );
  const [register, setRegister] = useState<AttendanceRegisterData | null>(null);
  const [summary, setSummary] = useState<ClassroomAttendanceSummary | null>(
    null
  );
  const [draft, setDraft] = useState<DraftMap>({});
  const [savedDraft, setSavedDraft] = useState<DraftMap>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    const res = await getClassroomAttendanceSummary(
      classroomId,
      today,
      ATTENDANCE_WINDOW_DAYS
    );
    if (res.error) setError(res.error);
    else setSummary(res.data);
  }, [classroomId, today]);

  const loadDate = useCallback(
    async (date: string) => {
      setLoading(true);
      setError(null);
      const res = await getAttendanceRegister(classroomId, date);
      setLoading(false);
      if (res.error || !res.data) {
        setError(res.error ?? "Ирцийн бүртгэлийг уншиж чадсангүй.");
        return;
      }
      setRegister(res.data);
      const next = draftFromRegister(res.data);
      setDraft(next);
      setSavedDraft(next);
      setSavedAt(res.data.lastSavedAt);
    },
    [classroomId]
  );

  useEffect(() => {
    let mounted = true;
    void getAttendanceClassroomContext(classroomId).then((res) => {
      if (!mounted) return;
      if (res.error) setError(res.error);
      else setClassroom(res.data);
    });
    return () => {
      mounted = false;
    };
  }, [classroomId]);

  useEffect(() => {
    void loadDate(sessionDate);
  }, [loadDate, sessionDate]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const dirty = useMemo(
    () => !draftsEqual(draft, savedDraft),
    [draft, savedDraft]
  );

  const markedCount = useMemo(
    () => Object.values(draft).filter((entry) => entry.status !== null).length,
    [draft]
  );

  function setStatus(studentId: string, status: AttendanceStatus) {
    setDraft((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status === status ? null : status,
        note: prev[studentId]?.note ?? "",
      },
    }));
  }

  function setNote(studentId: string, note: string) {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { status: prev[studentId]?.status ?? null, note },
    }));
  }

  function markAllPresent() {
    setDraft((prev) => {
      const next: DraftMap = {};
      for (const [studentId, entry] of Object.entries(prev)) {
        next[studentId] = { status: entry.status ?? "present", note: entry.note };
      }
      return next;
    });
  }

  async function handleSave() {
    if (!register) return;

    const entries: AttendanceEntryInput[] = register.roster
      .map((rosterEntry): AttendanceEntryInput | null => {
        const entry = draft[rosterEntry.studentId];
        if (!entry || entry.status === null) return null;
        return {
          studentId: rosterEntry.studentId,
          status: entry.status,
          note: entry.note,
        };
      })
      .filter((entry): entry is AttendanceEntryInput => entry !== null);

    if (entries.length === 0) {
      setError("Хадгалахын тулд ядаж нэг сурагчийн ирцийг тэмдэглэнэ үү.");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await saveAttendanceRegister({
      classroomId,
      sessionDate,
      entries,
    });
    setSaving(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setSavedDraft(draft);
    setSavedAt(new Date().toISOString());
    await loadDate(sessionDate);
    await loadSummary();
  }

  const deliveryLabel = classroom?.deliveryMode
    ? DELIVERY_MODE_LABELS[classroom.deliveryMode]
    : null;

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href={`/teacher/classes/${classroomId}`}
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← Ангийн хуудас
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Ирцийн бүртгэл
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {classroom?.name ?? "Анги"}
          {classroom?.level ? ` · ${classroom.level}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {deliveryLabel ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800 ring-1 ring-emerald-100">
              {deliveryLabel}
            </span>
          ) : null}
          {classroom?.scheduleNote ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700" translate="no">
              {classroom.scheduleNote}
            </span>
          ) : null}
          <span className="text-slate-500">{MONGOLIA_TIME_LABEL}-аар</span>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Хичээлийн өдөр</span>
            <input
              type="date"
              value={sessionDate}
              max={today}
              onChange={(e) => setSessionDate(e.target.value || today)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {sessionDate !== today ? (
              <button
                type="button"
                onClick={() => setSessionDate(today)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Өнөөдөр
              </button>
            ) : null}
            <button
              type="button"
              onClick={markAllPresent}
              disabled={loading || !register?.hasRoster}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Тэмдэглээгүйг «Ирсэн» болгох
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          {formatIsoDay(sessionDate)}
          {sessionDate === today ? " (өнөөдөр)" : ""}
          {register?.hasRegister
            ? ` · Энэ өдрийн ирц бүртгэгдсэн байна${
                savedAt
                  ? ` — сүүлд ${formatMongoliaDateTime(savedAt, "datetime")}`
                  : ""
              }`
            : " · Энэ өдрийн ирц хараахан бүртгэгдээгүй"}
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      ) : !register ? null : !register.hasRoster ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Ангид сурагч алга
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Ирц бүртгэхийн тулд эхлээд сурагчдаа нэмнэ үү. Урилга илгээсэн боловч
            хараахан бүртгэлээ үүсгээгүй сурагчийн ирцийг ч тэмдэглэж болно.
          </p>
          <Link
            href={`/teacher/classes/${classroomId}`}
            className="mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Сурагч нэмэх
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Сурагчид ({register.roster.length})
            </h2>
            <p className="text-xs text-slate-500">
              {markedCount}/{register.roster.length} тэмдэглэсэн
            </p>
          </div>

          <ul className="mt-4 flex flex-col gap-3">
            {register.roster.map((student) => {
              const entry = draft[student.studentId] ?? {
                status: null,
                note: "",
              };
              return (
                <li
                  key={student.studentId}
                  className="rounded-xl bg-slate-50/70 p-4 ring-1 ring-slate-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {student.displayName}
                      </p>
                      {student.studentUserId === null ? (
                        <p className="text-xs text-slate-500">
                          Бүртгэлээ хараахан үүсгээгүй
                        </p>
                      ) : null}
                    </div>
                    {entry.status === null ? (
                      <span className="text-xs text-slate-400">
                        Тэмдэглээгүй
                      </span>
                    ) : null}
                  </div>

                  <div
                    role="group"
                    aria-label={`${student.displayName} — ирцийн төлөв`}
                    className="mt-3 flex flex-wrap gap-2"
                  >
                    {ATTENDANCE_STATUSES.map((status) => {
                      const active = entry.status === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setStatus(student.studentId, status)}
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition ${
                            active
                              ? "bg-emerald-500 text-white ring-emerald-500"
                              : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {ATTENDANCE_STATUS_LABELS[status]}
                        </button>
                      );
                    })}
                  </div>

                  <label className="mt-3 flex flex-col gap-1 text-sm">
                    <span className="text-xs font-medium text-slate-600">
                      Тэмдэглэл (заавал биш)
                    </span>
                    <input
                      value={entry.note}
                      onChange={(e) => setNote(student.studentId, e.target.value)}
                      placeholder="Жишээ нь: эмчид үзүүлсэн"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || markedCount === 0}
              className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              {saving ? "Хадгалж байна…" : "Ирц хадгалах"}
            </button>
            {dirty ? (
              <span className="text-xs text-amber-800">
                Хадгалаагүй өөрчлөлт байна
              </span>
            ) : register.hasRegister ? (
              <span className="text-xs text-emerald-700">Хадгалагдлаа</span>
            ) : null}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Тэмдэглээгүй сурагчийн ирц хадгалагдахгүй — «бүртгээгүй» гэж үлдэнэ.
            Нэг өдрийн ирцийг дахин хадгалахад хуучин бүртгэл шинэчлэгдэнэ.
          </p>
        </section>
      )}

      {summary ? <AttendanceSummaryCard summary={summary} /> : null}
    </PublicPageShell>
  );
}
