import { AdminLayoutShell } from "@/app/admin/admin-layout-shell";

/** Сургалтын төвийн хуудсууд багшийн самбартай нэг хүрээнд нээгдэнэ. */
export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell guard={false}>{children}</AdminLayoutShell>;
}
