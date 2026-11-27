import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMessagesView } from "@/components/admin/admin-messages-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Мэдэгдэл явуулах — Удирдлагын хэсэг",
};

export default function AdminMessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Мэдэгдэл явуулах"
        description="Энд сурагчдын утас руу мэдэгдэл явуулна: бүгдэд, олон хоног ороогүй хүмүүст, нэг ангид, эсвэл нэрээр сонгосон хүмүүст. Нэг хүнтэй хоёр талаасаа бичилцэх бол нэрийнх нь хажуугийн «Чат» товчийг дар. Мэдэгдэл асаагаагүй хүнд очихгүй."
      />
      <AdminMessagesView />
    </div>
  );
}
