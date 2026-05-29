"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import { upsertCurrentTeacherProfile } from "@/lib/supabase/classrooms";

export function TeacherSetupForm() {
  const router = useRouter();
  const { loggedIn } = useTeacherAuth();
  const [displayName, setDisplayName] = useState("");
  const [organization, setOrganization] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loggedIn === null) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading…</p>
      </PublicPageShell>
    );
  }

  if (!loggedIn) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Багшийн profile</h1>
          <p className="mt-2 text-sm text-slate-600">Нэвтэрсний дараа profile үүсгэнэ.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Нэвтрэх
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: saveError } = await upsertCurrentTeacherProfile({
      displayName,
      organization,
      bio,
      role: "teacher",
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    router.push("/teacher-dashboard");
  }

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Багшийн profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Classroom үүсгэхийн өмнө багшийн profile-оо хадгална.
        </p>
      </section>

      <form
        className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Display name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Organization</span>
          <input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Сургалтын төв, сургууль..."
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-200">
          Organization account (multi-teacher team) дараагийн шатанд холбогдоно.
          Одоогоор organization text field нь teacher profile-д хадгалагдана.
        </p>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save teacher profile"}
        </button>
      </form>
    </PublicPageShell>
  );
}
