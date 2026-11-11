import {
  BICHLEG_SPEED_CYCLE,
  type BichlegPreferredSpeed,
} from "@/lib/bichleg/playback-rate";

/**
 * Бичлэг тоглуулагчийн хэрэглэгчийн тохиргоо (localStorage).
 * Бүгд try/catch — private mode, quota, SSR үед аюулгүй.
 */

const SPEED_KEY = "bichleg:speed";
const HANZI_SIZE_KEY = "bichleg:hanzi-size";
const RESUME_PREFIX = "bichleg:resume:";

export type BichlegHanziSize = "s" | "m" | "l";
export const BICHLEG_HANZI_SIZES: BichlegHanziSize[] = ["s", "m", "l"];

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode / quota */
  }
}

/* ---------- хурд ---------- */

export function readPreferredSpeed(): BichlegPreferredSpeed {
  const raw = Number(safeGet(SPEED_KEY));
  return (BICHLEG_SPEED_CYCLE as readonly number[]).includes(raw)
    ? (raw as BichlegPreferredSpeed)
    : 1;
}

export function writePreferredSpeed(speed: BichlegPreferredSpeed): void {
  safeSet(SPEED_KEY, String(speed));
}

/* ---------- ханзын хэмжээ ---------- */

export function readHanziSize(): BichlegHanziSize {
  const raw = safeGet(HANZI_SIZE_KEY);
  return raw === "s" || raw === "l" ? raw : "m";
}

export function writeHanziSize(size: BichlegHanziSize): void {
  safeSet(HANZI_SIZE_KEY, size);
}

export function nextHanziSize(current: BichlegHanziSize): BichlegHanziSize {
  const i = BICHLEG_HANZI_SIZES.indexOf(current);
  return BICHLEG_HANZI_SIZES[(i + 1) % BICHLEG_HANZI_SIZES.length]!;
}

export function formatHanziSizeLabel(size: BichlegHanziSize): string {
  return size === "s" ? "A-" : size === "l" ? "A+" : "A";
}

/* ---------- хадмалын дэвсгэр ---------- */

const SUB_BG_KEY = "bichleg:sub-bg";
/** solid = битүү хар (видеоны өөрийн бичгийг дарна), soft = хагас тунгалаг, none = дэвсгэргүй. */
export type BichlegSubBg = "solid" | "soft" | "none";
export const BICHLEG_SUB_BGS: BichlegSubBg[] = ["solid", "soft", "none"];

export function readSubBg(): BichlegSubBg {
  const raw = safeGet(SUB_BG_KEY);
  return raw === "soft" || raw === "none" ? raw : "solid";
}

export function writeSubBg(bg: BichlegSubBg): void {
  safeSet(SUB_BG_KEY, bg);
}

export function nextSubBg(current: BichlegSubBg): BichlegSubBg {
  const i = BICHLEG_SUB_BGS.indexOf(current);
  return BICHLEG_SUB_BGS[(i + 1) % BICHLEG_SUB_BGS.length]!;
}

export function subBgLabel(bg: BichlegSubBg): string {
  return bg === "solid" ? "Битүү" : bg === "soft" ? "Хагас тунгалаг" : "Дэвсгэргүй";
}

/* ---------- утас хэвтээ үеийн горим ---------- */

const LAND_MODE_KEY = "bichleg:land-mode";
/** full = видео бүтэн дэлгэц, хадмал дээр нь; side = видео зүүн талд, хадмал баруун талд. */
export type BichlegLandMode = "full" | "side";

export function readLandMode(): BichlegLandMode {
  return safeGet(LAND_MODE_KEY) === "side" ? "side" : "full";
}

export function writeLandMode(mode: BichlegLandMode): void {
  safeSet(LAND_MODE_KEY, mode);
}

export function landModeLabel(mode: BichlegLandMode): string {
  return mode === "side" ? "Хажууд" : "Дээр нь";
}

/* ---------- сүүлд үзсэн байрлал (үргэлжлүүлэх) ---------- */

export type BichlegResumeEntry = {
  /** Тоглуулагчийн яг зогссон секунд (серверийн watched_sec бол «оргил»). */
  sec: number;
  durationSec: number;
  /** ISO цаг — хуучин бичлэгийг цэвэрлэхэд. */
  at: string;
};

export function readResumePosition(videoId: string): BichlegResumeEntry | null {
  const raw = safeGet(`${RESUME_PREFIX}${videoId}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<BichlegResumeEntry>;
    const sec = Number(parsed.sec);
    if (!Number.isFinite(sec) || sec < 0) return null;
    return {
      sec,
      durationSec: Number(parsed.durationSec ?? 0) || 0,
      at: typeof parsed.at === "string" ? parsed.at : "",
    };
  } catch {
    return null;
  }
}

export function writeResumePosition(
  videoId: string,
  sec: number,
  durationSec: number
): void {
  if (!Number.isFinite(sec)) return;
  const entry: BichlegResumeEntry = {
    sec: Math.max(0, Math.round(sec * 10) / 10),
    durationSec: Number.isFinite(durationSec) ? durationSec : 0,
    at: new Date().toISOString(),
  };
  safeSet(`${RESUME_PREFIX}${videoId}`, JSON.stringify(entry));
}

export function clearResumePosition(videoId: string): void {
  safeSet(`${RESUME_PREFIX}${videoId}`, null);
}
