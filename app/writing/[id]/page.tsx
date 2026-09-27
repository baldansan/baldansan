import { WritingNotebookClient } from "@/components/writing/writing-notebook-client";

export const metadata = {
  title: "Бичих дэвтэр — Бөөндөө Сурцгаая",
};

export default async function WritingListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WritingNotebookClient listId={id} />;
}
