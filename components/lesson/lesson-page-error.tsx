import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import {
  lessonLoadFailureDescription,
  lessonLoadFailureTitle,
  shouldShowLessonLoadDebugDetails,
  type LessonLoadDebugInfo,
  type LessonLoadFailureKind,
} from "@/lib/lesson/lesson-load-diagnostics";

type Props = {
  failureKind: LessonLoadFailureKind;
  debug: LessonLoadDebugInfo;
  retryHref: string;
};

export function LessonPageError({ failureKind, debug, retryHref }: Props) {
  const showDebug = shouldShowLessonLoadDebugDetails();

  return (
    <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[390px] lg:max-w-none">
      <MobileCard className="mt-6 !py-10 text-center">
        <p className="text-sm font-medium text-amber-700">Хичээл ачаалах</p>
        <h1 className="mt-2 text-xl font-bold text-[var(--app-text)]">
          {lessonLoadFailureTitle(failureKind)}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
          {lessonLoadFailureDescription(failureKind)}
        </p>

        {showDebug ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Dev debug</p>
            <dl className="mt-2 space-y-1">
              {debug.route ? (
                <div>
                  <dt className="inline font-medium">route: </dt>
                  <dd className="inline break-all">{debug.route}</dd>
                </div>
              ) : null}
              <div>
                <dt className="inline font-medium">lessonId: </dt>
                <dd className="inline break-all">{debug.lessonId}</dd>
              </div>
              <div>
                <dt className="inline font-medium">fetch source: </dt>
                <dd className="inline">{debug.fetchSource}</dd>
              </div>
              <div>
                <dt className="inline font-medium">NEXT_PUBLIC_SUPABASE_URL: </dt>
                <dd className="inline">{debug.supabaseUrlPresent ? "yes" : "no"}</dd>
              </div>
              <div>
                <dt className="inline font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY: </dt>
                <dd className="inline">
                  {debug.supabaseAnonKeyPresent ? "yes" : "no"}
                </dd>
              </div>
              {debug.errorMessage ? (
                <div>
                  <dt className="font-medium">error: </dt>
                  <dd className="mt-0.5 break-all whitespace-pre-wrap">
                    {debug.errorMessage}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          <Link href={retryHref} className="app-btn-primary inline-flex justify-center">
            Дахин оролдох
          </Link>
          <Link href="/home" className="app-btn-secondary inline-flex justify-center">
            Нүүр хуудас
          </Link>
          <Link
            href="/courses"
            className="inline-flex justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            Курс руу
          </Link>
        </div>
      </MobileCard>
    </MobileAppShell>
  );
}
