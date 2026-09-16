import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SystemCheckView } from "@/components/admin/system-check-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Системийн шалгалт — Удирдлагын хэсэг",
};

export default function AdminSystemCheckPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Системийн шалгалт"
        description="Supabase тохиргоо, нэвтрэлт, админы эрх, контент унших, ажил, үйлдлийн бүртгэл, файл хадгалалтын бэлэн байдлыг зөвхөн харах шалгалт."
      />
      <SystemCheckView />
    </div>
  );
}
