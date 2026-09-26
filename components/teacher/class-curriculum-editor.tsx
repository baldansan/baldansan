"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { formatMongoliaDateTimeOrFallback } from "@/lib/datetime/mongolia-time";
import {
  CURRICULUM_COURSE_IDS,
  curriculumCourseLabel,
  type Assignment,
  type CurriculumLessonOption,
  type CurriculumProgressRow,
} from "@/lib/classroom/types";
import {
  getClassroomCurriculum,
  getClassroomCurriculumProgress,
  setClassroomCurriculum,
} from "@/lib/supabase/curriculum";

type Props = {
  classroomId: string;
  /** Хадгалсны дараа ангийн статистикийг дахин ачаална. */
  onSaved?: () => void;
};

type LevelInfo = { courseId: string; lessonCount: number };

function lessonLabel(lesson: CurriculumLessonOption): string {
  return lesson.chineseTitle ? `${lesson.chineseTitle} · ${lesson.title}` : lesson.title;
}

/**
 * Багшийн ангийн хуудас: ангийн заавал хөтөлбөр (түвшин + хичээлүүд) сонгох,
 * сурагч бүрийн гүйцэтгэлийг харах.
 */
export function ClassCurriculumEditor({ classroomId, onSaved }: Props) {
  const locale = useUiLocale();
  const [curriculum, setCurriculum] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<CurriculumProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [levels, setLevels] = useState<LevelInfo[] | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<CurriculumLessonOption[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const currentCourseId = curriculum[0]?.courseId ?? null;

  const fetchAll = useCallback(
    () =>
      Promise.all([
        getClassroomCurriculum(classroomId),
        getClassroomCurriculumProgress(classroomId),
      ]),
    [classroomId]
  );

  const apply = useCallback(
    ([curRes, progRes]: Awaited<ReturnType<typeof fetchAll>>) => {
      setLoading(false);
      if (curRes.error) {
        setError(curRes.error);
        return;
      }
      setError(null);
      const list = curRes.data ?? [];
      setCurriculum(list);
      setProgress(progRes.data ?? []);
      if (list.length === 0) setEditing(true);
    },
    []
  );

  const load = useCallback(async () => apply(await fetchAll()), [apply, fetchAll]);

  useEffect(() => {
    let alive = true;
    fetchAll().then((res) => {
      if (alive) apply(res);
    });
    return () => {
      alive = false;
    };
  }, [fetchAll, apply]);

  // Түвшин бүрийн нийтлэгдсэн хичээлийн тоо — засварлах үед нэг л удаа.
  useEffect(() => {
    if (!editing || levels) return;
    let alive = true;
    fetch("/api/curriculum/lessons")
      .then((r) => r.json())
      .then((json: { levels?: LevelInfo[] }) => {
        if (alive) setLevels(json.levels ?? []);
      })
      .catch(() => {
        if (alive) setLevels([]);
      });
    return () => {
      alive = false;
    };
  }, [editing, levels]);

  /** Түвшин сонгоход тэр түвшний хичээлүүдийг (курсын дарааллаар) ачаална. */
  async function pickLevel(id: string) {
    setCourseId(id);
    setLessonsLoading(true);
    let list: CurriculumLessonOption[] = [];
    try {
      const res = await fetch(`/api/curriculum/lessons?courseId=${encodeURIComponent(id)}`);
      const json = (await res.json()) as { lessons?: CurriculumLessonOption[] };
      list = json.lessons ?? [];
    } catch {
      list = [];
    }
    setLessons(list);
    // Одоогийн хөтөлбөрийн түвшин бол хадгалсан сонголтыг, үгүй бол бүгдийг чагтална.
    const saved = new Set(
      curriculum.filter((a) => a.courseId === id).map((a) => a.lessonId)
    );
    setChecked(
      saved.size > 0
        ? new Set(list.filter((l) => saved.has(l.id)).map((l) => l.id))
        : new Set(list.map((l) => l.id))
    );
    setLessonsLoading(false);
  }

  function toggleEditor() {
    if (editing) {
      setEditing(false);
      return;
    }
    setEditing(true);
    // Засварлаж эхлэхэд одоогийн түвшинг сонгосон байдлаар нээнэ.
    const initial = courseId ?? currentCourseId;
    if (initial) void pickLevel(initial);
  }

  const selectedCount = useMemo(
    () => lessons.filter((l) => checked.has(l.id)).length,
    [lessons, checked]
  );

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    if (!courseId || saving) return;
    const selected = lessons.filter((l) => checked.has(l.id));
    const keep = new Set(selected.map((l) => l.id));
    const removed = curriculum.filter((a) => !keep.has(a.lessonId)).length;
    if (
      removed > 0 &&
      !window.confirm(
        `${removed} ${tr(locale, "хичээл хөтөлбөрөөс хасагдана — сурагчдын тэр хичээлийн гүйцэтгэлийн тэмдэглэл устана. Үргэлжлүүлэх үү?")}`
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    const res = await setClassroomCurriculum(
      classroomId,
      courseId,
      selected.map((l, i) => ({ lessonId: l.id, title: lessonLabel(l), orderIndex: i }))
    );
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setNotice(`${tr(locale, "Хадгалагдлаа")} ✓ · ${res.data ?? 0} ${tr(locale, "хичээл")}`);
    await load();
    setEditing((res.data ?? 0) === 0);
    onSaved?.();
  }

  if (loading) {
    return <p className="text-sm text-slate-500">{tr(locale, "Ачааллаж байна…")}</p>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>
      ) : null}

      {curriculum.length > 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                {tr(locale, "Заавал хөтөлбөр")}
              </p>
              <p className="text-lg font-bold text-emerald-900">
                {curriculumCourseLabel(currentCourseId)} · {curriculum.length}{" "}
                {tr(locale, "хичээл")}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleEditor}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-300"
            >
              {editing ? tr(locale, "Хаах") : tr(locale, "Өөрчлөх")}
            </button>
          </div>
          <ol className="mt-3 flex flex-wrap gap-1.5">
            {curriculum.map((a, i) => (
              <li
                key={a.id}
                className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 ring-1 ring-emerald-100"
              >
                {i + 1}. <span translate="no">{a.title}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          {tr(locale, "Энэ ангид заавал хөтөлбөр хараахан алга. Түвшнээ сонгоод, сурагч бүрийн заавал дуусгах хичээлүүдийг чагтална уу.")}
        </p>
      )}

      {editing ? (
        <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              1. {tr(locale, "Түвшин сонгох")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CURRICULUM_COURSE_IDS.map((id) => {
                const info = levels?.find((l) => l.courseId === id);
                const empty = info != null && info.lessonCount === 0;
                const active = courseId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={empty}
                    onClick={() => void pickLevel(id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 disabled:opacity-40 ${
                      active
                        ? "bg-emerald-600 text-white ring-emerald-600"
                        : "bg-white text-slate-700 ring-slate-200 hover:ring-emerald-300"
                    }`}
                  >
                    {curriculumCourseLabel(id)}
                    {info ? (
                      <span className={active ? "text-emerald-100" : "text-slate-400"}>
                        {" "}
                        · {info.lessonCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {courseId ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  2. {tr(locale, "Заавал хийх хичээлүүд")}{" "}
                  <span className="font-normal text-slate-500">
                    ({selectedCount}/{lessons.length})
                  </span>
                </p>
                {lessons.length > 0 ? (
                  <div className="flex gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setChecked(new Set(lessons.map((l) => l.id)))}
                      className="text-emerald-700"
                    >
                      {tr(locale, "Бүгдийг сонгох")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecked(new Set())}
                      className="text-slate-500"
                    >
                      {tr(locale, "Бүгдийг арилгах")}
                    </button>
                  </div>
                ) : null}
              </div>
              {lessonsLoading ? (
                <p className="mt-2 text-sm text-slate-500">{tr(locale, "Ачааллаж байна…")}</p>
              ) : lessons.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  {tr(locale, "Энэ түвшинд нийтлэгдсэн хичээл алга.")}
                </p>
              ) : (
                <ul className="mt-2 max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-xl ring-1 ring-slate-200">
                  {lessons.map((lesson, i) => (
                    <li key={lesson.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checked.has(lesson.id)}
                          onChange={() => toggle(lesson.id)}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        <span className="w-6 shrink-0 text-right text-xs text-slate-400">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-slate-800" translate="no">
                          {lessonLabel(lesson)}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void save()}
            disabled={!courseId || saving || lessonsLoading}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? tr(locale, "Хадгалж байна…") : tr(locale, "Хадгалах")}
          </button>
        </div>
      ) : null}

      {curriculum.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {tr(locale, "Сурагч бүрийн гүйцэтгэл")}
          </h3>
          {progress.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              {tr(locale, "Апп дээр бүртгэлтэй сурагч хараахан алга.")}
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table className="w-full min-w-[480px] bg-white text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">{tr(locale, "Сурагч")}</th>
                    <th className="px-3 py-2 font-semibold">{tr(locale, "Дууссан")}</th>
                    <th className="px-3 py-2 font-semibold">{tr(locale, "Гүйцэтгэл")}</th>
                    <th className="px-3 py-2 font-semibold">{tr(locale, "Сүүлд дуусгасан")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {progress.map((row) => (
                    <tr key={row.studentUserId}>
                      <td className="px-3 py-2 font-medium text-slate-900" translate="no">
                        {row.displayName}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.completed}/{row.total}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${row.percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {row.percent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {formatMongoliaDateTimeOrFallback(row.lastCompletedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
