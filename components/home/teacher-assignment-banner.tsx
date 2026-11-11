"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lessonPath } from "@/lib/content";
import { isCustomAssignment, type StudentAssignment } from "@/lib/classroom/types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { writingListIdFromLessonId } from "@/lib/writing/types";

const TYPE_LABELS: Record<string, string> = {
  full_lesson: "Хичээлийг бүтнээр хийх",
  watch: "Бичлэг үзэх",
  vocabulary: "Үг цээжлэх",
  quiz: "Дасгал ажиллах",
  review: "Давтах",
};

function dueInfo(iso: string | null): { text: string; urgent: boolean } {
  if (!iso) return { text: "Хугацаагүй", urgent: false };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { text: "Хугацаагүй", urgent: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { text: "Хугацаа хэтэрсэн!", urgent: true };
  if (days === 0) return { text: "Өнөөдөр дуусна", urgent: true };
  if (days === 1) return { text: "Маргааш дуусна", urgent: true };
  return { text: `${d.getMonth() + 1}-р сарын ${d.getDate()} хүртэл`, urgent: false };
}

function hrefFor(a: StudentAssignment): string {
  if (isCustomAssignment(a.lessonId)) return "/my-assignments";
  const writing = writingListIdFromLessonId(a.lessonId);
  if (writing) return `/writing/${writing}`;
  return lessonPath(a.lessonId);
}

/**
 * Нүүр хуудасны хамгийн дээр: «БАГШИЙН ДААЛГАВАР · ЗААВАЛ».
 * Багш өгсөн, хийж дуусаагүй даалгавар байвал л гарна; хийж дуустал алга болохгүй.
 * (Ангийн заавал хөтөлбөрийн хичээлүүд тусдаа хэсэгт харагддаг тул энд орохгүй.)
 */
export function TeacherAssignmentBanner({ loggedIn }: { loggedIn: boolean }) {
  const locale = useUiLocale();
  const [pending, setPending] = useState<StudentAssignment[]>([]);
  // Ангид харьяалагддаг, мэдэгдэл асаагаагүй сурагчид «мэдэгдэл авах» товч санал болгоно.
  const [askPush, setAskPush] = useState(false);
  const [pushState, setPushState] = useState<"idle" | "busy" | "on" | "denied">("idle");

  useEffect(() => {
    if (!loggedIn) return;
    let alive = true;
    void (async () => {
      try {
        const { getStudentAssignments } = await import("@/lib/supabase/classrooms");
        const { data } = await getStudentAssignments();
        if (!alive) return;
        if ((data ?? []).length > 0) {
          const push = await import("@/lib/push/push-client");
          if (
            alive &&
            push.getPushAvailability() === "ready" &&
            (await push.getNotificationPermissionState()) === "default"
          ) {
            setAskPush(true);
          }
        }
        if (!alive) return;
        setPending(
          (data ?? []).filter(
            (a) =>
              !a.isCurriculum &&
              a.status !== "archived" &&
              a.resultStatus !== "completed"
          )
        );
      } catch {
        /* нүүр хуудсыг даалгавраас болж унагахгүй */
      }
    })();
    return () => {
      alive = false;
    };
  }, [loggedIn]);

  async function enablePush() {
    setPushState("busy");
    const push = await import("@/lib/push/push-client");
    const res = await push.subscribeToPush();
    setPushState(res.ok ? "on" : "denied");
  }

  const pushPrompt =
    askPush && pushState !== "denied" ? (
      <button
        type="button"
        disabled={pushState !== "idle"}
        onClick={() => void enablePush()}
        className="rounded-xl bg-white px-4 py-2 text-left text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
      >
        {pushState === "on"
          ? `✓ ${tr(locale, "Мэдэгдэл аслаа")}`
          : `🔔 ${tr(locale, "Багш даалгавар өгөхөд утсандаа мэдэгдэл авах")}`}
      </button>
    ) : null;

  if (!loggedIn) return null;
  if (pending.length === 0) return pushPrompt;

  const shown = pending.slice(0, 2);
  const rest = pending.length - shown.length;

  return (
    <section aria-label={tr(locale, "Багшийн даалгавар")} className="flex flex-col gap-2">
      {shown.map((a) => {
        const due = dueInfo(a.dueDate);
        return (
          <Link
            key={a.id}
            href={hrefFor(a)}
            className="block rounded-2xl border-2 border-orange-400 bg-orange-50 p-4 shadow-sm transition active:scale-[0.99]"
          >
            <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-extrabold uppercase tracking-wider text-orange-700">
              <span>📌 {tr(locale, "Багшийн даалгавар")}</span>
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] text-white">
                {tr(locale, "Заавал")}
              </span>
            </p>
            <p className="mt-1.5 text-base font-bold leading-snug text-slate-900" translate="no">
              {a.title}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {isCustomAssignment(a.lessonId)
                ? tr(locale, "Багшийн өөрийн даалгавар")
                : tr(locale, TYPE_LABELS[a.assignmentType] ?? "Хичээл")}
              {a.classroomName ? (
                <span translate="no"> · {a.classroomName}</span>
              ) : null}
            </p>
            {a.instructions ? (
              <p className="mt-1.5 line-clamp-2 text-sm text-slate-700" translate="no">
                «{a.instructions}»
              </p>
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-3">
              <span
                className={`text-xs font-semibold ${due.urgent ? "text-red-600" : "text-slate-600"}`}
              >
                ⏰ {tr(locale, due.text)}
              </span>
              <span className="rounded-full bg-orange-500 px-4 py-1.5 text-sm font-bold text-white">
                {tr(locale, "Одоо хийх")} →
              </span>
            </div>
          </Link>
        );
      })}
      {rest > 0 ? (
        <Link
          href="/my-assignments"
          className="rounded-xl bg-orange-100 px-4 py-2 text-center text-sm font-semibold text-orange-900"
        >
          {tr(locale, "Бас")} {rest} {tr(locale, "даалгавар байна — бүгдийг харах")} →
        </Link>
      ) : null}
      {pushPrompt}
    </section>
  );
}
