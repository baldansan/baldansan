import { StorageRecacheClient } from "@/components/admin/storage-recache-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Storage кэш шинэчлэх — Удирдлагын хэсэг",
  description: "Хичээлийн аудио/зургийн CDN кэшийг 1 жил болгох.",
};

export default function AdminStorageRecachePage() {
  return <StorageRecacheClient />;
}
