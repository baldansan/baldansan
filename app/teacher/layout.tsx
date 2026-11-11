import { AdminLayoutShell } from "@/app/admin/admin-layout-shell";

/** Багшийн хуудсууд админтай нэг ажлын талбарт (зүүн цэстэй) нээгдэнэ. */
export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell guard={false}>{children}</AdminLayoutShell>;
}
