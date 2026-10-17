/**
 * Бүрдэл хэсгийн монгол нэрийн нөөц толиуд (component_meanings_mn.json 82KB +
 * hsk_char_gloss.json 143KB). Өмнө нь char-breakdown-data.ts статикаар импортолж,
 * хичээл үзэх / давтлага / тоглоомын хуудас бүрийн эхний JS-д ~160KB (59KB gz)
 * нэмж байсан. Одоо:
 *  - async зам (CharacterDecompositionHint, WordCharBreakdownPanel) →
 *    ensureComponentNamesLoaded() — public/data-аас fetch, зөвхөн хэрэгтэй үед.
 *  - sync зам (radical тоглоомууд, сервер) → component-names-register.ts-ийг
 *    импортолж өмнөх шигээ статикаар авна.
 */

type NameTable = Record<string, { mn?: string }>;

let partNames: NameTable | null = null;
let charGloss: NameTable | null = null;
let loading: Promise<void> | null = null;

export function registerComponentNames(part: NameTable, gloss: NameTable): void {
  partNames = part;
  charGloss = gloss;
}

export function componentNamesLoaded(): boolean {
  return partNames !== null && charGloss !== null;
}

/** public/ дахь ижил файлуудыг char-breakdown-full.ts, word-parts-line.tsx ч fetch хийдэг → browser cache хуваалцана. */
const PART_NAMES_URL = "/data/component_meanings_mn.json";
const CHAR_GLOSS_URL = "/data/hsk_char_gloss.json";

async function fetchTable(url: string): Promise<NameTable> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as NameTable;
}

export function ensureComponentNamesLoaded(): Promise<void> {
  if (componentNamesLoaded()) return Promise.resolve();
  // Сервер талд (SSR) fetch хийхгүй — нэрийн нөөцгүй, dataset-ийн нэр хэвээр ажиллана.
  if (typeof window === "undefined") return Promise.resolve();
  if (!loading) {
    loading = Promise.all([fetchTable(PART_NAMES_URL), fetchTable(CHAR_GLOSS_URL)])
      .then(([part, gloss]) => {
        registerComponentNames(part, gloss);
      })
      .catch(() => {
        loading = null;
      });
  }
  return loading;
}

/** Нөөц нэр: makemeahanzi бүрдэл хэсгийн нэр → ханзны морфемийн утга. "" бол олдсонгүй/ачаалагдаагүй. */
export function fallbackComponentNameMn(glyph: string): string {
  const part = partNames?.[glyph]?.mn?.trim();
  if (part) return part;
  return charGloss?.[glyph]?.mn?.trim() || "";
}
