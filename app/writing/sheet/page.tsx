import { WritingSheetClient } from "@/components/writing/writing-sheet-client";

export const metadata = {
  title: "Хэвлэх дэвтэр — Ханзны дэвтэр",
};

/** Хэвлэх дэвтэр: зурлага/ханзаа сонгож, нүд, өнгөө тохируулаад A4 PDF болгож хэвлэнэ. */
export default async function WritingSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ chars?: string; list?: string }>;
}) {
  const sp = await searchParams;
  return (
    <WritingSheetClient
      initialChars={typeof sp.chars === "string" ? sp.chars : ""}
      listId={typeof sp.list === "string" ? sp.list : null}
    />
  );
}
