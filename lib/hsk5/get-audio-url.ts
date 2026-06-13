import { normalizeZipPath } from "@/lib/import/zip-path";
import manifest from "@/src/data/hsk5-audio-manifest.json";

export type Hsk5Book = "5A" | "5B";
export type Hsk5AudioType = "textbook" | "workbook";

export type Hsk5AudioManifestEntry = {
  book: Hsk5Book;
  lesson: number;
  type: Hsk5AudioType;
  filename: string;
  storage_path: string;
  public_url: string;
};

export const HSK5_AUDIO_BUCKET_PUBLIC_BASE =
  "https://yxowfkumkrbppkqligdz.supabase.co/storage/v1/object/public/hsk-audio";

const entries = manifest as Hsk5AudioManifestEntry[];

const byFilename = new Map<string, string>();
const byStoragePath = new Map<string, string>();
const byLookupKey = new Map<string, string>();

function indexFromFilename(filename: string): number {
  const special = filename.match(/^hsk5[AB]-workbook-(\d+)\.mp3$/i);
  if (special) return 1;
  const m = filename.match(/^hsk5[AB]-(?:textbook|workbook)-\d{2}(\d{2})\.mp3$/i);
  if (m) return Number(m[1]);
  return 1;
}

for (const entry of entries) {
  byFilename.set(entry.filename.toLowerCase(), entry.public_url);
  byStoragePath.set(entry.storage_path.toLowerCase(), entry.public_url);
  const normalized = normalizeZipPath(entry.storage_path).toLowerCase();
  byStoragePath.set(normalized, entry.public_url);
  const idx = indexFromFilename(entry.filename);
  byLookupKey.set(`${entry.book}|${entry.type}|${entry.lesson}|${idx}`, entry.public_url);
}

export type GetAudioUrlOptions = {
  index?: number;
  type?: Hsk5AudioType;
};

function normalizeOptions(
  indexOrOptions?: number | GetAudioUrlOptions
): GetAudioUrlOptions {
  if (typeof indexOrOptions === "number") {
    return { index: indexOrOptions };
  }
  return indexOrOptions ?? {};
}

/**
 * HSK5 аудио public URL — манифест эх сурвалж, томьёо зөвхөн нөөц.
 */
export function getAudioUrl(
  book: Hsk5Book,
  lesson: number,
  indexOrOptions?: number | GetAudioUrlOptions,
  type: Hsk5AudioType = "textbook"
): string | null {
  const opts = normalizeOptions(indexOrOptions);
  const audioType = opts.type ?? type;
  const index = opts.index ?? 1;

  const fromManifest = byLookupKey.get(`${book}|${audioType}|${lesson}|${index}`);
  if (fromManifest) return fromManifest;

  return buildFallbackHsk5AudioUrl(book, lesson, index, audioType);
}

function buildFallbackHsk5AudioUrl(
  book: Hsk5Book,
  lesson: number,
  index: number,
  type: Hsk5AudioType
): string | null {
  const LL = String(lesson).padStart(2, "0");

  if (book === "5B" && type === "workbook" && lesson === 37) {
    const storagePath = `hsk5Bworkbookaudios/lesson-${LL}/hsk5B-workbook-37.mp3`;
    return `${HSK5_AUDIO_BUCKET_PUBLIC_BASE}/${storagePath}`;
  }

  const NN = String(index).padStart(2, "0");
  const folder = `hsk${book}${type}audios`;
  const filename = `hsk${book}-${type}-${LL}${NN}.mp3`;
  const storagePath = `${folder}/lesson-${LL}/${filename}`;
  return `${HSK5_AUDIO_BUCKET_PUBLIC_BASE}/${storagePath}`;
}

export type ParsedHsk5AudioRef = {
  book: Hsk5Book;
  lesson: number;
  type: Hsk5AudioType;
  index: number;
};

/** Parse `hsk5A-textbook-0101.mp3` or `hsk5B-workbook-37.mp3`. */
export function parseHsk5AudioFilename(filename: string): ParsedHsk5AudioRef | null {
  const base = filename.split("/").pop()?.trim() ?? "";
  if (!base) return null;

  const special = base.match(/^hsk(5[AB])-workbook-(\d+)\.mp3$/i);
  if (special) {
    return {
      book: special[1] as Hsk5Book,
      type: "workbook",
      lesson: Number(special[2]),
      index: 1,
    };
  }

  const standard = base.match(/^hsk(5[AB])-(textbook|workbook)-(\d{2})(\d{2})\.mp3$/i);
  if (standard) {
    return {
      book: standard[1] as Hsk5Book,
      type: standard[2].toLowerCase() as Hsk5AudioType,
      lesson: Number(standard[3]),
      index: Number(standard[4]),
    };
  }

  return null;
}

/** Resolve package path / filename / storage_path to a Supabase public URL. */
export function resolveHsk5AudioPath(path: string | null | undefined): string | null {
  const raw = String(path ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const normalized = normalizeZipPath(raw);
  const lower = normalized.toLowerCase();

  const fromStorage = byStoragePath.get(lower);
  if (fromStorage) return fromStorage;

  const basename = normalized.split("/").pop()?.toLowerCase();
  if (basename) {
    const fromFilename = byFilename.get(basename);
    if (fromFilename) return fromFilename;

    const parsed = parseHsk5AudioFilename(basename);
    if (parsed) {
      return getAudioUrl(parsed.book, parsed.lesson, {
        index: parsed.index,
        type: parsed.type,
      });
    }
  }

  if (lower.includes("hsk5") && lower.endsWith(".mp3")) {
    const tail = basename ?? lower;
    const parsed = parseHsk5AudioFilename(tail);
    if (parsed) {
      return getAudioUrl(parsed.book, parsed.lesson, {
        index: parsed.index,
        type: parsed.type,
      });
    }
  }

  return null;
}

export function listHsk5AudioForLesson(
  book: Hsk5Book,
  lesson: number,
  type: Hsk5AudioType
): Hsk5AudioManifestEntry[] {
  return entries.filter(
    (e) => e.book === book && e.lesson === lesson && e.type === type
  );
}
