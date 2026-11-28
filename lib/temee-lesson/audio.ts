import { buildAudioCmnUrl } from "@/lib/tts/audio-cmn";
import type { TemeeAudioRef } from "@/types/temee-lesson";

/** "syl:ma1" / "word:老师" / "file:x.mp3" → тоглуулах URL. */
export function temeeAudioUrl(ref: TemeeAudioRef, lessonId: string): string {
  if (ref.startsWith("syl:")) {
    return `/open/audio-cmn/syllables/cmn-${ref.slice(4)}.mp3`;
  }
  if (ref.startsWith("word:")) return buildAudioCmnUrl(ref.slice(5));
  if (ref.startsWith("file:")) return `/temee-lesson/${lessonId}/${ref.slice(5)}`;
  return ref;
}

/*
 * Хурд: бичлэгүүд жижиг (5–15KB) ч дарах бүрд сүлжээнээс татвал утсан дээр 1–3 секунд хүлээлгэнэ.
 * Тиймээс дэлгэц нээгдэхэд тухайн (ба дараагийн) дэлгэцийн бичлэгийг урьдчилан татаж санах ойд хадгална —
 * дарахад шууд дуугарна.
 *
 * iOS: дууг хэрэглэгчийн даралтын дотор эхлүүлэх ёстой, мөн нэг удаа «нээгдсэн» <audio> элементийг
 * дараа нь кодоос дахин тоглуулж болдог. Тиймээс БҮХ дууг нэг элементээр тоглуулна (дараалсан бичлэг ч).
 */
const blobCache = new Map<string, Promise<string | null>>();
let el: HTMLAudioElement | null = null;
let token = 0;

function fetchBlobUrl(url: string): Promise<string | null> {
  let hit = blobCache.get(url);
  if (!hit) {
    hit = fetch(url)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b ? URL.createObjectURL(b) : null))
      .catch(() => null);
    blobCache.set(url, hit);
    // Амжилтгүй бол дараагийн удаа дахин оролдоно.
    void hit.then((v) => {
      if (v == null) blobCache.delete(url);
    });
  }
  return hit;
}

const ready = new Map<string, string>();

/** Дэлгэц нээгдэхэд дуудна: бичлэгүүдийг урьдчилан татна. */
export function preloadTemeeAudio(urls: string[]): void {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (ready.has(url)) continue;
    void fetchBlobUrl(url).then((blobUrl) => {
      if (blobUrl) ready.set(url, blobUrl);
    });
  }
}

function element(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = "auto";
  }
  return el;
}

/**
 * iPhone: дууг зөвхөн даралтын дотроос эхлүүлж болдог. Өөр зүйл (TTS г.м.) тоглож дууссаны
 * ДАРАА энэ элементээр дуу гаргах бол даралтын дотор нэг удаа чимээгүй «нээж» өгнө.
 */
export function unlockTemeeAudio(url: string): void {
  const a = element();
  token += 1;
  a.onended = null;
  a.onerror = null;
  a.muted = true;
  a.src = url;
  const done = () => {
    a.pause();
    a.muted = false;
  };
  void a.play().then(done).catch(() => {
    a.muted = false;
  });
}

export function stopTemeeAudio(): void {
  token += 1;
  if (el) {
    el.onended = null;
    el.onerror = null;
    el.pause();
  }
}

function playOne(url: string, mine: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const a = element();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      a.onended = null;
      a.onerror = null;
      resolve(ok);
    };
    // Сүлжээ гацвал үүрд хүлээхгүй.
    const timer = window.setTimeout(() => finish(false), 9000);
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    // Урьдчилан татсан бол санах ойгоос (шууд), үгүй бол сүлжээнээс шууд урсгана.
    a.src = ready.get(url) ?? url;
    void a.play().catch(() => finish(false));
    if (mine !== token) finish(true);
  });
}

/** Бичлэгүүдийг дараалан тоглоно. Шинээр дуудахад өмнөх нь зогсоно. Амжилтгүй бол нэг удаа дахин оролдоно. */
export async function playTemeeSequence(urls: string[], gapMs = 160): Promise<boolean> {
  stopTemeeAudio();
  const mine = token;
  let ok = true;
  for (let i = 0; i < urls.length; i += 1) {
    if (mine !== token) return true;
    let played = await playOne(urls[i]!, mine);
    if (!played && mine === token) {
      ready.delete(urls[i]!);
      played = await playOne(urls[i]!, mine);
    }
    if (mine !== token) return true;
    if (!played) ok = false;
    if (i < urls.length - 1) await new Promise((r) => window.setTimeout(r, gapMs));
  }
  return ok;
}
