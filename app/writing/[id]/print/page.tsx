import { WritingPrintClient } from "@/components/writing/writing-print-client";

export const metadata = {
  title: "Хэвлэх — Бичих дэвтэр",
};

/** Хэвлэх хуудас — дэвтэр локал (localStorage) байж болох тул уншилт клиент талд. */
export default async function WritingPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WritingPrintClient listId={id} />;
}
