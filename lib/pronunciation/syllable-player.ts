/**
 * Үеийн mp3 тоглуулагч — нэг л Audio; шинийг эхлүүлэхэд өмнөхийг зогсооно.
 */
let current: HTMLAudioElement | null = null;

export function stopSyllable(): void {
  if (current) {
    try {
      current.pause();
      current.currentTime = 0;
    } catch {
      // ignore
    }
    current = null;
  }
}

/** Файлыг тоглуулна; дуусахад (эсвэл алдаа) resolve. */
export function playSyllable(file: string): Promise<{ ok: boolean; durationMs: number }> {
  if (typeof window === "undefined") return Promise.resolve({ ok: false, durationMs: 0 });
  stopSyllable();
  return new Promise((resolve) => {
    const audio = new Audio(file);
    current = audio;
    const started = performance.now();
    audio.onended = () => {
      if (current === audio) current = null;
      resolve({ ok: true, durationMs: performance.now() - started });
    };
    audio.onerror = () => {
      if (current === audio) current = null;
      resolve({ ok: false, durationMs: 0 });
    };
    void audio.play().catch(() => {
      if (current === audio) current = null;
      resolve({ ok: false, durationMs: 0 });
    });
  });
}

/** A, дараа нь B (завсар gapMs). */
export async function playSequence(files: string[], gapMs = 500): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    await playSyllable(files[i]);
    if (i < files.length - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
}
