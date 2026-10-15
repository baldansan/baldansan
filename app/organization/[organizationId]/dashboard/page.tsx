import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { DirectorDashboard } from "@/components/organization/director/director-dashboard";
import { checkDashboardAccess } from "@/lib/organization/dashboard-access";
import { loadOrganizationDashboard } from "@/lib/organization/dashboard-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Захирлын самбар — Бөөндөө Сурцгаая",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationDirectorDashboardPage({ params }: Props) {
  const { organizationId } = await params;
  const access = await checkDashboardAccess(organizationId);

  if (access !== "ok") {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-900">Захирлын самбар</h1>
          <p className="mt-2 text-sm text-slate-600">
            {access === "login"
              ? "Энэ хуудсыг үзэхийн тулд эхлээд нэвтэрнэ үү."
              : access === "denied"
                ? "Энэ самбарыг зөвхөн байгууллагын эзэмшигч, менежер эсвэл админ үзнэ."
                : "Холболтын тохиргоо дутуу байна."}
          </p>
          <Link href={access === "login" ? "/login" : `/organization/${organizationId}`} className="mt-4 inline-block rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
            {access === "login" ? "Нэвтрэх" : "Буцах"}
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  const data = await loadOrganizationDashboard(organizationId);
  return (
    <PublicPageShell active="help" showBottomNav={false} mainClassName="max-w-[1200px]!">
      <DirectorDashboard organizationId={organizationId} data={data} />
    </PublicPageShell>
  );
}
