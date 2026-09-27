import { lookupWritingText } from "@/lib/writing/lookup";

/**
 * POST { text } → { items, unknown } — «Бичих дэвтэр»-т оруулсан текстийн
 * ханз бүрийг үг/пиньинь/утгатай нь таньж буцаана (data/hsk_words.json + ханзны толь).
 */
export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTH = 4000;

export async function POST(request: Request) {
  let text = "";
  try {
    const body = (await request.json()) as { text?: unknown };
    text = typeof body?.text === "string" ? body.text : "";
  } catch {
    return Response.json({ error: "Invalid JSON", items: [], unknown: [] }, { status: 400 });
  }
  if (!text.trim()) {
    return Response.json({ items: [], unknown: [] });
  }
  try {
    const result = await lookupWritingText(text.slice(0, MAX_TEXT_LENGTH));
    return Response.json(result);
  } catch (error) {
    console.warn("[writing] lookup failed", error);
    return Response.json({ error: "Lookup failed", items: [], unknown: [] }, { status: 500 });
  }
}
