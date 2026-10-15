import { hanziCdnUrl } from "@/lib/hanzi/character-data-loader";

const HANZI_RE = /^[\u4e00-\u9fff]$/;

/**
 * Ханзны зурлагын JSON — jsdelivr CDN-ээс дамжуулна (fallback: клиент CDN-д хүрэхгүй үед).
 * node_modules/hanzi-writer-data-г function-д багцлахаа больсон (47MB / 9,580 файл → cold start).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ char: string }> }
) {
  const { char } = await context.params;
  const decoded = decodeURIComponent(char);

  if (!HANZI_RE.test(decoded)) {
    return Response.json({ error: "invalid character" }, { status: 400 });
  }

  try {
    const upstream = await fetch(hanziCdnUrl(decoded), {
      // Ханзны өгөгдөл хэзээ ч өөрчлөгдөхгүй — Next fetch cache + CDN кэш.
      cache: "force-cache",
    });
    if (!upstream.ok) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    const body = await upstream.text();
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return Response.json({ error: "upstream unavailable" }, { status: 502 });
  }
}
