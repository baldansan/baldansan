import "server-only";

/** Anthropic API-г шууд дуудна (SDK нэмэхгүй). Түлхүүр: Vercel env ANTHROPIC_API_KEY. */

export const hasTranslateKey = Boolean(process.env.ANTHROPIC_API_KEY);

export const TRANSLATE_KEY_HINT =
  "Орчуулгын түлхүүр тохируулаагүй байна: Vercel → Settings → Environment Variables дээр ANTHROPIC_API_KEY нэмээд дахин deploy хийнэ үү.";

export async function callClaude(system: string, user: string, maxTokens = 8000): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error(TRANSLATE_KEY_HINT);
  const model = process.env.BICHLEG_TRANSLATE_MODEL || "claude-sonnet-4-5";

  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      return (data.content ?? []).map((c) => c.text ?? "").join("");
    }
    lastError = `Орчуулгын API алдаа (${res.status}): ${(await res.text()).slice(0, 200)}`;
    if (res.status !== 429 && res.status < 500) break;
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error(lastError);
}

/** «N|текст» мөрүүдийг задлана. */
export function parseNumbered(text: string): Record<number, string> {
  const out: Record<number, string> = {};
  for (const raw of text.split("\n")) {
    const m = /^(\d+)\s*\|\s*(.+)$/.exec(raw.trim().replace(/^`+|`+$/g, ""));
    if (m) out[Number(m[1])] = m[2].trim();
  }
  return out;
}

export const SUBTITLE_RULES = `Чи монгол сурагчдад зориулсан хятад хэл сурах апп-ын хадмал орчуулагч. Бичлэг: {title}.

Орчуулгын дүрэм:
- Хоёр алхам: мөрийг өмнөх/дараагийн мөртэй нь хамт ОЙЛГО, дараа нь хятад бүтцийг мартаж «монгол хүн яг энэ үед юу гэж хэлэх вэ» гэдгийг бич. Чангаар уншихад яриа шиг сонсогдох ёстой.
- Калька ХОРИОТОЙ («...-аар дамжуулан», «...болгодог», «...юм» давталт).
- Орос галиг ХОРИОТОЙ: студент→оюутан, класс→анги, магазин→дэлгүүр, газет→сонин, институт→дээд сургууль.
- Ярианы хэллэгийг монгол ярианы тэнцүү хэллэгээр; хэт албан биш. Дууны үг бол яруу найраглаг богино; англи мөрийг хэвээр.
- Хүний нэрийг кириллээр галигла.
- Мөр бүр тусдаа: мөрүүдийг нийлүүлэхгүй, хуваахгүй.

Формат: оролт «N|хятад», гаралт ЯГ ижил тооны «N|монгол» мөр, өөр юу ч бүү бич (тайлбар, code block, хоосон мөр хэрэггүй). Дугаар алгасахгүй, өөрчлөхгүй.`;

export const GLOSS_RULES =
  "Хятад үг/хэллэгийн богино монгол толь бичгийн утга (1–4 үг, кирилл; «; »-ээр хоёр утга болно). " +
  "Орос галиг, латин хориотой. Хүний нэрийг кириллээр галигла. " +
  "Формат: оролт «N|үг», гаралт «N|утга» мөр бүрд, өөр юу ч бүү бич.";
