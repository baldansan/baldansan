"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/supabase/auth";
import { PublicPageShell } from "@/components/public-page-shell";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import type { InvitationLookup } from "@/lib/b2b/types";
import { buildInviteUrl } from "@/lib/organization/invite-url";
import { acceptInvitation, getInvitationByToken } from "@/lib/supabase/invitations";

type Props = {
  token: string;
};

export function InviteAcceptView({ token }: Props) {
  const { loggedIn } = useTeacherAuth();
  const [invite, setInvite] = useState<InvitationLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState<{
    kind: string;
    organizationId?: string;
    classroomId?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (loggedIn) {
        const { data } = await getCurrentUser();
        setUserEmail(data?.email ?? null);
      }
    }
    void loadUser();
  }, [loggedIn]);

  useEffect(() => {
    async function load() {
      const res = await getInvitationByToken(token);
      setLoading(false);
      if (res.error) setError(res.error);
      else setInvite(res.data);
    }
    void load();
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    const res = await acceptInvitation(token);
    setAccepting(false);
    if (res.error) setError(res.error);
    else if (res.data) {
      setAccepted({
        kind: res.data.inviteKind,
        organizationId: res.data.organizationId,
        classroomId: res.data.classroomId,
      });
    }
  }

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Урилга ачааллаж байна…</p>
      </PublicPageShell>
    );
  }

  if (accepted) {
    const isStudent = accepted.kind === "classroom_student";
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
          <h1 className="text-2xl font-bold text-emerald-900">Урилга амжилттай</h1>
          <p className="mt-2 text-sm text-emerald-800">
            {isStudent
              ? "Та classroom-д амжилттай нэгдлээ."
              : "Та байгууллагад амжилттай нэгдлээ."}
          </p>
          <Link
            href={
              isStudent
                ? "/my-assignments"
                : accepted.organizationId
                  ? `/organization/${accepted.organizationId}`
                  : "/organization"
            }
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
          >
            {isStudent ? "Миний даалгавар →" : "Organization →"}
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  if (!invite) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Урилга олдсонгүй</h1>
          <p className="mt-2 text-sm text-slate-600">
            {error ??
              "Энэ link хугацаа дууссан эсвэл аль хэдийн ашиглагдсан байж магадгүй. Байгууллагын админтай холбогдоно уу."}
          </p>
          <Link href="/organization" className="mt-4 text-sm text-emerald-600">
            Organization →
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  const isStudent = invite.inviteKind === "classroom_student";
  const nextPath = `/invite/${encodeURIComponent(token)}`;

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          Таныг Бөөндөө Сурцгаая platform-д урьсан байна
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Та email invitation link-ээр орж ирлээ.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {isStudent ? (
            <>
              <strong>{invite.classroomName ?? "Classroom"}</strong> classroom-д
              сурагчаар нэгдэх урилга.
            </>
          ) : (
            <>
              <strong>{invite.organizationName}</strong> байгууллагад{" "}
              <strong>{invite.role}</strong> эрхээр урилга.
            </>
          )}
        </p>
        {invite.displayName ? (
          <p className="text-sm text-slate-500">Нэр: {invite.displayName}</p>
        ) : null}
        {invite.email ? (
          <p className="text-sm text-slate-500">Имэйл: {invite.email}</p>
        ) : null}
        <p className="mt-1 text-xs text-slate-400">
          Хүчинтэй хугацаа: {new Date(invite.expiresAt).toLocaleString()}
        </p>
        <p className="mt-1 break-all text-xs text-slate-400">
          Link: {buildInviteUrl(token)}
        </p>

        {loggedIn === false ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
            >
              Login to accept
            </Link>
            <Link
              href={`/signup?next=${encodeURIComponent(nextPath)}`}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700"
            >
              Sign up
            </Link>
          </div>
        ) : loggedIn ? (
          <>
            {invite.email &&
            userEmail &&
            invite.email.toLowerCase() !== userEmail.toLowerCase() ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Энэ урилга {invite.email} хаягт зориулагдсан. Өөр account-аар accept хийх
                гэж байгаа бол байгууллагатайгаа шалгана уу.
              </p>
            ) : null}
            <button
              type="button"
              disabled={accepting}
              onClick={() => void handleAccept()}
              className="mt-4 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {accepting ? "Баталгаажуулж байна…" : "Accept invitation"}
            </button>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Session шалгаж байна…</p>
        )}

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
      </section>
    </PublicPageShell>
  );
}
