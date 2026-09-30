import { getIdioms, type Idiom, type IdiomKind } from "@/lib/library/data";

/** /library/idioms жагсаалтын параметрүүд — жагсаалт + дэлгэрэнгүй хуудас хоёулаа ашиглана. */
export type IdiomListParams = {
  kind: IdiomKind;
  level: number;
  q: string;
  hsk: boolean;
  page: number;
};

export const IDIOM_PER_PAGE = 40;
export const IDIOM_LEVELS = [1, 2, 3, 4, 5, 6, 7];

export const IDIOM_KINDS: Array<{ key: IdiomKind; zh: string; mn: string }> = [
  { key: "idioms", zh: "成语", mn: "Хэлц үг" },
  { key: "proverbs", zh: "谚语", mn: "Зүйр цэцэн үг" },
  { key: "xiehouyu", zh: "歇后语", mn: "Ёгт хэллэг (歇后语)" },
];

export function parseIdiomKind(v: string): IdiomKind {
  return (IDIOM_KINDS.find((k) => k.key === v)?.key ?? "idioms") as IdiomKind;
}

export function parseIdiomListParams(
  sp: Record<string, string | string[] | undefined>
): IdiomListParams {
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
  const int = (v: string | string[] | undefined, d: number) => {
    const n = Number.parseInt(str(v), 10);
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  return {
    kind: parseIdiomKind(str(sp.kind)),
    level: int(sp.level, 0),
    q: str(sp.q).trim(),
    hsk: str(sp.hsk) === "1",
    page: int(sp.page, 1),
  };
}

function toSearchParams(p: Partial<IdiomListParams>): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.kind && p.kind !== "idioms") sp.set("kind", p.kind);
  if (p.level && p.level > 0) sp.set("level", String(p.level));
  if (p.hsk) sp.set("hsk", "1");
  if (p.q) sp.set("q", p.q);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  return sp;
}

/** Жагсаалтын холбоос. */
export function idiomListHref(p: Partial<IdiomListParams>): string {
  const s = toSearchParams(p).toString();
  return s ? `/library/idioms?${s}` : "/library/idioms";
}

/** Дэлгэрэнгүй холбоос — жагсаалтын шүүлтүүрийг хадгална (PC дээр 2 самбар хэвээр үлдэнэ). */
export function idiomDetailHref(id: string, p: Partial<IdiomListParams>): string {
  const s = toSearchParams(p).toString();
  const base = `/library/idioms/${encodeURIComponent(id)}`;
  return s ? `${base}?${s}` : base;
}

/* Эрэмбэлсэн жагсаалтыг төрөл тус бүрээр нэг л удаа бэлдэнэ (процесст нэг удаа). */
const sortedCache = new Map<IdiomKind, Promise<Idiom[]>>();
export function getSortedIdioms(kind: IdiomKind): Promise<Idiom[]> {
  let p = sortedCache.get(kind);
  if (!p) {
    p = getIdioms(kind).then((items) =>
      [...items].sort(
        (a, b) =>
          (a.in_hsk_list ? 0 : 1) - (b.in_hsk_list ? 0 : 1) ||
          a.level - b.level ||
          a.id.localeCompare(b.id)
      )
    );
    sortedCache.set(kind, p);
  }
  return p;
}

export function idiomLevelLabel(lv: number): string {
  return lv >= 7 ? "HSK 7–9" : `HSK ${lv}`;
}

export function idiomMatchesQuery(x: Idiom, q: string): boolean {
  if (!q) return true;
  const lq = q.toLowerCase();
  return (
    x.zh.includes(q) ||
    (x.zh_trad?.includes(q) ?? false) ||
    x.en.some((e) => e.toLowerCase().includes(lq)) ||
    (x.mn?.keyMn?.toLowerCase().includes(lq) ?? false) ||
    (x.mn?.meaningMn?.toLowerCase().includes(lq) ?? false)
  );
}

/** Шүүсэн бүтэн жагсаалт (хуудаслахаас өмнө). */
export async function filterIdioms(p: IdiomListParams): Promise<Idiom[]> {
  const all = await getSortedIdioms(p.kind);
  return all.filter(
    (x) =>
      (p.level > 0 ? (p.level >= 7 ? x.level >= 7 : x.level === p.level) : true) &&
      (p.hsk ? Boolean(x.in_hsk_list) : true) &&
      idiomMatchesQuery(x, p.q)
  );
}
