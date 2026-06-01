"use client";

import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AdminAlert } from "@/components/admin/admin-editor-ui";
import {
  ReleaseStatusBadge,
  WorkflowQaBadge,
} from "@/components/admin/release-workflow-badges";
import {
  approveLessonForPublish,
  markLessonReviewed,
  updateLessonQaStatus,
  updateLessonReleaseNotes,
  updateLessonReleaseStatus,
} from "@/lib/supabase/admin-release";
import { getCurrentUser } from "@/lib/supabase/auth";
import type {
  LessonContent,
  LessonReleaseStatus,
  LessonWorkflowQaStatus,
} from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
};

export function LessonApprovalControls({ lesson }: Props) {
  const router = useRouter();
  const [releaseStatus, setReleaseStatus] = useState<LessonReleaseStatus>(
    lesson.releaseStatus ?? "draft"
  );
  const [qaStatus, setQaStatus] = useState<LessonWorkflowQaStatus>(
    lesson.qaStatus ?? "needs_review"
  );
  const [notes, setNotes] = useState(lesson.releaseNotes ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  async function runAction(
    label: string,
    action: () => Promise<{ error: string | null }>
  ) {
    setBusy(label);
    setError(null);
    setSuccess(null);
    const result = await action();
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(`${label} — амжилттай.`);
    refresh();
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">
        Release approval
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Internal release_status / qa_status — public publish тусдаа хэвээр.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <ReleaseStatusBadge status={releaseStatus} />
        <WorkflowQaBadge status={qaStatus} />
        {lesson.approvedAt ? (
          <span className="text-xs text-slate-500">
            Approved {formatMongoliaDateTimeWithLabel(lesson.approvedAt)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Release status</span>
          <select
            value={releaseStatus}
            onChange={(e) =>
              setReleaseStatus(e.target.value as LessonReleaseStatus)
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="draft">draft</option>
            <option value="in_review">in_review</option>
            <option value="approved">approved</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">QA status</span>
          <select
            value={qaStatus}
            onChange={(e) =>
              setQaStatus(e.target.value as LessonWorkflowQaStatus)
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="needs_review">needs_review</option>
            <option value="passed">passed</option>
            <option value="failed">failed</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm">
        <span className="font-medium text-slate-700">Release notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Review notes for this release…"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            void runAction("Mark in review", async () => {
              const r = await markLessonReviewed(lesson.id);
              if (!r.error) setReleaseStatus("in_review");
              return r;
            })
          }
          className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50"
        >
          {busy === "Mark in review" ? "…" : "Mark in review"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            void runAction("Mark QA passed", async () => {
              const r = await updateLessonQaStatus(lesson.id, "passed");
              if (!r.error) setQaStatus("passed");
              return r;
            })
          }
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy === "Mark QA passed" ? "…" : "Mark QA passed"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            void runAction("Approve for publish", async () => {
              const { data: user } = await getCurrentUser();
              if (!user?.id) {
                return { error: "Sign in required to approve." };
              }
              const r = await approveLessonForPublish(
                lesson.id,
                user.id,
                notes
              );
              if (!r.error) {
                setReleaseStatus("approved");
                setQaStatus("passed");
              }
              return r;
            })
          }
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy === "Approve for publish" ? "…" : "Approve for publish"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            void runAction("Save release fields", async () => {
              const statusR = await updateLessonReleaseStatus(
                lesson.id,
                releaseStatus
              );
              if (statusR.error) return statusR;
              const qaR = await updateLessonQaStatus(lesson.id, qaStatus);
              if (qaR.error) return qaR;
              return updateLessonReleaseNotes(lesson.id, notes);
            })
          }
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-emerald-200 disabled:opacity-50"
        >
          {busy === "Save release fields" ? "…" : "Save release notes"}
        </button>
      </div>

      <div className="mt-4">
        <AdminAlert error={error} success={success} />
      </div>
    </section>
  );
}
