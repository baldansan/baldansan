"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import { CLASS_LEVELS } from "@/lib/content/classroom-copy";
import type { MyOrganization } from "@/lib/b2b/types";
import { canManageClassrooms } from "@/lib/supabase/organization-permissions";
import { getMyOrganizationsWithRole } from "@/lib/supabase/organizations";
import { createClassroom } from "@/lib/supabase/classrooms";

export function CreateClassForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillOrgId = searchParams.get("organizationId") ?? "";

  const [name, setName] = useState("");
  const [level, setLevel] = useState("HSK5");
  const [description, setDescription] = useState("");
  const [orgs, setOrgs] = useState<MyOrganization[]>([]);
  const [scope, setScope] = useState<"personal" | "organization">(
    prefillOrgId ? "organization" : "personal"
  );
  const [organizationId, setOrganizationId] = useState(prefillOrgId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await getMyOrganizationsWithRole();
      const list = (res.data ?? []).filter((o) =>
        canManageClassrooms({ role: o.memberRole })
      );
      setOrgs(list);
      if (prefillOrgId && list.some((o) => o.id === prefillOrgId)) {
        setScope("organization");
        setOrganizationId(prefillOrgId);
      } else if (list[0] && scope === "organization" && !organizationId) {
        setOrganizationId(list[0].id);
      }
    }
    void load();
  }, [prefillOrgId, organizationId, scope]);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const { data, error: createError } = await createClassroom({
      name,
      level,
      description,
      organizationId: scope === "organization" ? organizationId : null,
      visibility: scope === "organization" ? "organization" : "private",
    });
    setSaving(false);
    if (createError || !data) {
      setError(createError ?? "Failed to create class.");
      return;
    }
    router.push(`/teacher/classes/${data.id}`);
  }

  const selectedOrg = orgs.find((o) => o.id === organizationId);

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href="/teacher/classes"
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← Миний ангиуд
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Шинэ анги үүсгэх</h1>
      </section>

      <form
        className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void handleCreate();
        }}
      >
        {orgs.length > 0 ? (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Classroom type</span>
              <select
                value={scope}
                onChange={(e) =>
                  setScope(e.target.value as "personal" | "organization")
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="personal">Personal classroom</option>
                <option value="organization">Organization classroom</option>
              </select>
            </label>
            {scope === "organization" ? (
              <>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Organization</span>
                  <select
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    required
                    className="rounded-lg border border-slate-200 px-3 py-2"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
                  Энэ classroom байгууллагын classroom хэлбэрээр үүснэ.
                  {selectedOrg ? ` (${selectedOrg.name})` : ""}
                </p>
              </>
            ) : null}
          </>
        ) : null}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Class name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Жишээ: HSK5 Morning Group"
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Level</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {CLASS_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create class"}
        </button>
      </form>
    </PublicPageShell>
  );
}
