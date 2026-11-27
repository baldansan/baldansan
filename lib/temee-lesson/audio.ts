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

let current: HTMLAudioElement | null = null;
let token = 0;

export function stopTemeeAudio(): void {
  token += 1;
  if (current) {
    current.pause();
    current = null;
  }
}

/** Бичлэгүүдийг дараалан тоглоно. Шинээр дуудахад өмнөх нь зогсоно. */
export async function playTemeeSequence(urls: string[], gapMs = 180): Promise<boolean> {
  stopTemeeAudio();
  const mine = token;
  let ok = true;
  for (let i = 0; i < urls.length; i += 1) {
    if (mine !== token) return ok;
    const played = await new Promise<boolean>((resolve) => {
      const a = new Audio(urls[i]);
      current = a;
      a.onended = () => resolve(true);
      a.onerror = () => resolve(false);
      void a.play().catch(() => resolve(false));
    });
    if (!played) ok = false;
    if (mine !== token) return ok;
    if (i < urls.length - 1) await new Promise((r) => window.setTimeout(r, gapMs));
  }
  if (mine === token) current = null;
  return ok;
}
