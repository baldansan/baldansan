import { WritingListForm } from "@/components/writing/writing-list-form";

export const metadata = {
  title: "Дэвтэр засах — Бөөндөө Сурцгаая",
};

export default async function WritingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WritingListForm mode="edit" listId={id} />;
}
