import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * «Уншлагын сан / 文库» — content/open/ доторх нээлттэй лицензтэй өгөгдлийг
 * сервер талд уншина (fs). Файлууд next.config-ийн outputFileTracingIncludes
 * тохиргоогоор Vercel дээр хамт тархана. Нэг процесст нэг л удаа уншина.
 */

const ROOT = path.join(process.cwd(), "content", "open");
const cache = new Map<string, Promise<unknown>>();

async function readJson<T>(rel: string): Promise<T> {
  let p = cache.get(rel) as Promise<T> | undefined;
  if (!p) {
    p = fs.readFile(path.join(ROOT, rel), "utf8").then((s) => JSON.parse(s) as T);
    cache.set(rel, p);
  }
  return p;
}

/* ---------------- Хүүхдийн зурагт ном ---------------- */

export type StoryPage = {
  id: string;
  page: number;
  zh: string;
  pinyin: string;
  hsk_max?: number;
  image?: string;
  audio?: string;
  en?: string;
};

export type Story = {
  id: string;
  /** "gsb" = Global Storybooks (page audio), "sw" = StoryWeaver */
  provider: "gsb" | "sw";
  url: string;
  title: string;
  title_pinyin: string;
  title_en?: string;
  description?: string;
  /** Эх сайтын уншлагын түвшин (1–5) */
  level: number;
  hsk_p90: number | null;
  hsk_max: number | null;
  authors: string[];
  illustrators: string[];
  narrator?: string;
  cover: string;
  audio_full?: string;
  page_count: number;
  char_count: number;
  pages: StoryPage[];
  source: string;
  license: string;
  license_url?: string;
  attribution: string;
  flags: string[];
};

type GsbStory = {
  id: string; url: string; title: string; title_pinyin: string; title_en?: string; level: number;
  hsk_max?: number; hsk_p90?: number; author?: string; illustrator?: string; narrator?: string;
  cover: string; audio_full?: string; page_count: number; char_count: number; pages: StoryPage[];
  source: string; license: string; license_url?: string; attribution: string;
};
type SwStory = {
  id: string; url: string; title: string; title_pinyin: string; description?: string; level: number;
  hsk_max?: number; hsk_p90?: number | null; authors?: string[]; original_authors?: string[]; illustrators?: string[];
  cover: string; page_count: number; char_count: number; pages: StoryPage[]; flags?: string[];
  source: string; license: string; license_url?: string; attribution: string;
};

let storiesPromise: Promise<Story[]> | null = null;

export function getStories(): Promise<Story[]> {
  if (!storiesPromise) {
    storiesPromise = (async () => {
      const [gsb, sw] = await Promise.all([
        readJson<{ stories: GsbStory[] }>("global-storybooks-zh/data.json"),
        readJson<{ stories: SwStory[] }>("storyweaver-zh/data.json"),
      ]);
      const a: Story[] = gsb.stories.map((s) => ({
        id: s.id,
        provider: "gsb",
        url: s.url,
        title: s.title,
        title_pinyin: s.title_pinyin,
        title_en: s.title_en,
        level: s.level,
        hsk_p90: s.hsk_p90 ?? null,
        hsk_max: s.hsk_max ?? null,
        authors: s.author ? [s.author] : [],
        illustrators: s.illustrator ? [s.illustrator] : [],
        narrator: s.narrator,
        cover: s.cover,
        audio_full: s.audio_full,
        page_count: s.page_count,
        char_count: s.char_count,
        pages: s.pages,
        source: s.source,
        license: s.license,
        license_url: s.license_url,
        attribution: s.attribution,
        flags: [],
      }));
      const b: Story[] = sw.stories
        .filter((s) => !(s.flags ?? []).includes("wordless"))
        .map((s) => ({
          id: s.id,
          provider: "sw",
          url: s.url,
          title: s.title,
          title_pinyin: s.title_pinyin,
          description: s.description,
          level: s.level,
          hsk_p90: s.hsk_p90 ?? null,
          hsk_max: s.hsk_max ?? null,
          authors: [...(s.original_authors ?? []), ...(s.authors ?? [])],
          illustrators: s.illustrators ?? [],
          cover: s.cover,
          page_count: s.page_count,
          char_count: s.char_count,
          pages: s.pages,
          source: s.source,
          license: s.license,
          license_url: s.license_url,
          attribution: s.attribution,
          flags: s.flags ?? [],
        }));
      // Дуутай (Global Storybooks) номууд эхэнд, дараа нь түвшин, дараа нь богино нь эхэнд.
      return [...a, ...b].sort(
        (x, y) =>
          (x.provider === "gsb" ? 0 : 1) - (y.provider === "gsb" ? 0 : 1) ||
          x.level - y.level ||
          x.char_count - y.char_count,
      );
    })();
  }
  return storiesPromise;
}

export async function getStory(id: string): Promise<Story | null> {
  const all = await getStories();
  return all.find((s) => s.id === id) ?? null;
}

/* ---------------- Сонгодог (蒙学 + 唐诗) ---------------- */

export type ClassicLine = { id: string; zh: string; pinyin: string; phrases?: string[] };
export type ClassicSection = { chapter: string | null; lines: ClassicLine[] };
export type ClassicWork = {
  id: string;
  title: string;
  title_trad?: string;
  author?: string | null;
  dynasty?: string | null;
  level: string;
  source: string;
  license: string;
  attribution: string;
  edition?: string;
  sections?: ClassicSection[];
  /** 千家诗 — шүлгүүд */
  poems?: Poem[];
};
export type Poem = {
  id: string;
  title: string;
  author: string;
  dynasty?: string;
  form?: string;
  tags?: string[];
  paragraphs: { id: string; zh: string; pinyin: string }[];
  level?: string;
};

export function getMengxue(): Promise<{ works: ClassicWork[]; license: string; attribution: string; pinyin_note?: string }> {
  return readJson("chinese-poetry/mengxue.json");
}

export function getTangshi(): Promise<{ poems: Poem[]; license: string; attribution: string; pinyin_note?: string }> {
  return readJson("chinese-poetry/tangshi300.json");
}

export function getSongci(): Promise<{ poems: Poem[]; license: string; attribution: string; pinyin_note?: string }> {
  return readJson("chinese-poetry/songci300.json");
}

/* ---------------- 成语 · 谚语 · 歇后语 · 寓言 ---------------- */

export type Idiom = {
  id: string;
  zh: string;
  zh_trad?: string;
  pinyin: string;
  pinyin_syllables?: string;
  /** pypinyin-ээр нөхсөн — багш шалгах */
  pinyin_check?: boolean;
  mandarin?: boolean;
  en: string[];
  literal?: string;
  etymology?: string;
  source_quotes?: { zh: string; ref?: string; en?: string }[];
  level: number;
  in_hsk_list?: boolean;
  source_url: string;
};

export type IdiomKind = "idioms" | "proverbs" | "xiehouyu";

export async function getIdioms(kind: IdiomKind): Promise<Idiom[]> {
  const d = await readJson<{ items: Idiom[] }>(`wiktionary-zh/${kind}.json`);
  // Зөвхөн путунхуа (Mandarin) хэллэгүүд; кантон гэх мэт аялгууныхыг хасна.
  return d.items.filter((x) => x.mandarin);
}

export type Fable = {
  id: string;
  key: string;
  idiom: string;
  title: string;
  book: string;
  chapter?: string;
  zh: string;
  zh_trad?: string;
  pinyin: string;
  sentences: { zh: string; pinyin: string }[];
  source?: string;
  source_url?: string;
  license?: string;
};

export async function getFables(): Promise<{ items: Fable[]; license: string; source_url: string }> {
  return readJson("fables-classical/data.json");
}

/* ---------------- Жишээ өгүүлбэр ---------------- */

export type Sentence = {
  id: string | number;
  zh: string;
  pinyin: string;
  en?: string;
  level: number;
  source: string;
  attribution: string;
  /** Tatoeba: "tatoeba-reviewed" = хүн шалгасан пиньинь */
  pinyin_src?: string;
};

type ZhongdexSentence = Sentence & { level_app?: number; words?: string[] };

export type SentenceSource = "tatoeba" | "zhongdex";

export async function getSentences(source: SentenceSource): Promise<Sentence[]> {
  if (source === "tatoeba") return readJson<Sentence[]>("tatoeba-cmn/sentences.json");
  const z = await readJson<ZhongdexSentence[]>("zhongdex/sentences.json");
  // zhongdex-ийн `level` нь HSK 3.0 жагсаалтаар; манай апп-ын hsk_words-той таарах `level_app`-ыг ашиглана.
  return z.map((s) => ({ ...s, level: s.level_app ?? s.level }));
}

export async function getZhMnSentences(): Promise<(Sentence & { mn: string })[]> {
  return readJson("tatoeba-cmn/zh-mn.json");
}

/* ---------------- Хайлт / хуудаслалт туслах ---------------- */

export function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const cur = Math.min(Math.max(1, page), pages);
  return { items: items.slice((cur - 1) * perPage, cur * perPage), page: cur, pages, total };
}

export function intParam(v: string | string[] | undefined, fallback: number): number {
  const n = Number.parseInt(Array.isArray(v) ? v[0] ?? "" : v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function strParam(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}
