"use client";

/**
 * Дасгалын сонсголын аудио — НЭГ файлыг олон асуулт хуваалцдаг тул
 * HTMLAudioElement-ийг url-аар нь кэшлэж, асуулт солигдоход дахин
 * татахгүй, шууд хэсэг рүү нь үсэрч тоглуулна. Дараагийн асуултын
 * файлыг урьдчилж татна (prefetch).
 */

const cache = new Map<string, HTMLAudioElement>();
const MAX = 4;

export function getPracticeAudio(url: string): HTMLAudioElement {
  let el = cache.get(url);
  if (!el) {
    el = new Audio();
    el.preload = "auto";
    el.src = url;
    el.load();
    cache.set(url, el);
    if (cache.size > MAX) {
      const oldest = cache.keys().next().value;
      if (oldest && oldest !== url) {
        const old = cache.get(oldest);
        old?.pause();
        cache.delete(oldest);
      }
    }
  }
  return el;
}

export function prefetchPracticeAudio(urls: Array<string | null | undefined>) {
  if (typeof window === "undefined") return;
  for (const u of urls) {
    if (u && !cache.has(u)) getPracticeAudio(u);
  }
}

/** Бусад кэшлэгдсэн аудиог зогсооно (нэг зэрэг хоёр дуу гарахгүй). */
export function pauseOtherPracticeAudio(except: HTMLAudioElement) {
  for (const el of cache.values()) {
    if (el !== except && !el.paused) el.pause();
  }
}

const AUTOPLAY_KEY = "buunduu-practice-autoplay-v1";

export function readPracticeAutoplay(): boolean {
  try {
    return window.localStorage.getItem(AUTOPLAY_KEY) !== "0";
  } catch {
    return true;
  }
}

export function writePracticeAutoplay(on: boolean) {
  try {
    window.localStorage.setItem(AUTOPLAY_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}

/**
 * «🔊 Дахин сонс» — багшийн тайлбараас асуултын аудио хэсгийг дахин тоглуулна.
 * PracticeAudio-гийн кэшлэсэн элементийг дахин ашиглана (файл дахин татахгүй);
 * `endSec` өгвөл тэнд зогсооно.
 */
export function replayPracticeAudio(
  url: string,
  startSec: number | null = null,
  endSec: number | null = null
): void {
  if (typeof window === "undefined" || !url) return;
  const el = getPracticeAudio(url);
  pauseOtherPracticeAudio(el);

  const seekAndPlay = () => {
    try {
      el.currentTime = startSec ?? 0;
    } catch {
      // seek дэмжигдэхгүй бол байгаагаас нь
    }
    if (endSec != null) {
      const stopAtEnd = () => {
        if (el.currentTime >= endSec) {
          el.pause();
          el.removeEventListener("timeupdate", stopAtEnd);
        }
      };
      el.addEventListener("timeupdate", stopAtEnd);
      el.addEventListener("pause", () => el.removeEventListener("timeupdate", stopAtEnd), {
        once: true,
      });
    }
    el.play().catch(() => {
      /* хөтөч тоглуулалтыг хориглосон */
    });
  };

  if (el.readyState >= 1) seekAndPlay();
  else el.addEventListener("loadedmetadata", seekAndPlay, { once: true });
}
