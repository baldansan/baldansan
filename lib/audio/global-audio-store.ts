/**
 * Глобал аудио тоглуулагч — нэг л <audio> элемент, бүх апп даяар.
 *
 * Хоёр суваг:
 *  • track — хичээлийн 课文 / яриа / хичээлийн бүтэн аудио. Хуудас солиход
 *    тасрахгүй; доод талын mini-player (components/audio/mini-audio-player)
 *    энэ төлвийг харуулна.
 *  • clip  — үгийн дуудлага зэрэг 1–2 секундын богино клип. Mini-player
 *    харуулахгүй; тоглож байхад track-ийг түр зогсооно (давхцахгүй).
 *
 * React-ээс гадуур (lib/tts/*) ч дуудагддаг тул энгийн singleton store —
 * компонентууд useSyncExternalStore-оор уншина (components/providers/global-audio-provider).
 */

export type GlobalAudioTrack = {
  /** Нэг хичээл дотор давтагдашгүй — "lesson:12:text:0" гэх мэт. */
  id: string;
  src: string;
  title: string;
  subtitle?: string;
  /** Буцах холбоос — mini-player дээрх гарчиг дарахад. */
  href?: string;
};

export type GlobalAudioStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export type GlobalAudioState = {
  track: GlobalAudioTrack | null;
  status: GlobalAudioStatus;
  currentTime: number;
  duration: number;
  rate: number;
};

type Listener = () => void;

const INITIAL: GlobalAudioState = {
  track: null,
  status: "idle",
  currentTime: 0,
  duration: 0,
  rate: 1,
};

let state: GlobalAudioState = INITIAL;
const listeners = new Set<Listener>();

let trackEl: HTMLAudioElement | null = null;
let clipEl: HTMLAudioElement | null = null;
let clipPending: ((result: { ok: boolean; error?: string }) => void) | null = null;

function emit() {
  for (const l of listeners) l();
}

function set(patch: Partial<GlobalAudioState>) {
  state = { ...state, ...patch };
  emit();
}

function ensureTrackEl(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (trackEl) return trackEl;
  const a = new Audio();
  a.preload = "auto";
  a.addEventListener("play", () => set({ status: "playing" }));
  a.addEventListener("playing", () => set({ status: "playing" }));
  a.addEventListener("pause", () => {
    if (state.status === "ended" || state.status === "idle") return;
    set({ status: "paused" });
  });
  a.addEventListener("waiting", () => {
    if (state.status === "playing") set({ status: "loading" });
  });
  a.addEventListener("ended", () => set({ status: "ended", currentTime: a.duration || state.duration }));
  a.addEventListener("error", () => set({ status: "error" }));
  a.addEventListener("loadedmetadata", () =>
    set({ duration: Number.isFinite(a.duration) ? a.duration : 0 })
  );
  a.addEventListener("durationchange", () =>
    set({ duration: Number.isFinite(a.duration) ? a.duration : 0 })
  );
  a.addEventListener("timeupdate", () => set({ currentTime: a.currentTime }));
  a.addEventListener("ratechange", () => set({ rate: a.playbackRate }));
  trackEl = a;
  return a;
}

function ensureClipEl(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (clipEl) return clipEl;
  const a = new Audio();
  a.preload = "auto";
  clipEl = a;
  return a;
}

export const globalAudio = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): GlobalAudioState {
    return state;
  },

  /** Шинэ track эхлүүлнэ (ижил id бол эхнээс нь). */
  play(track: GlobalAudioTrack, opts: { rate?: number } = {}): Promise<boolean> {
    const a = ensureTrackEl();
    if (!a) return Promise.resolve(false);
    const clip = clipEl;
    if (clip && !clip.paused) clip.pause();
    const rate = opts.rate ?? state.rate ?? 1;
    const sameSrc = state.track?.src === track.src;
    if (!sameSrc) {
      a.src = track.src;
      a.load();
    } else {
      a.currentTime = 0;
    }
    a.playbackRate = rate;
    set({ track, status: "loading", currentTime: 0, rate, duration: sameSrc ? state.duration : 0 });
    return a
      .play()
      .then(() => true)
      .catch(() => {
        set({ status: "error" });
        return false;
      });
  },

  /** Тухайн id тоглож байвал зогсооно, зогссон/дууссан бол үргэлжлүүлнэ, өөр бол шинээр эхлүүлнэ. */
  toggle(track: GlobalAudioTrack, opts: { rate?: number } = {}): Promise<boolean> {
    const a = ensureTrackEl();
    if (!a) return Promise.resolve(false);
    if (state.track?.id === track.id) {
      if (state.status === "playing" || state.status === "loading") {
        a.pause();
        return Promise.resolve(false);
      }
      if (state.status === "paused") return globalAudio.resume();
    }
    return globalAudio.play(track, opts);
  },

  resume(): Promise<boolean> {
    const a = trackEl;
    if (!a || !state.track) return Promise.resolve(false);
    if (state.status === "ended") a.currentTime = 0;
    return a
      .play()
      .then(() => true)
      .catch(() => false);
  },

  pause(): void {
    trackEl?.pause();
  },

  /** Mini-player хаах — track-ийг бүрэн зогсоож устгана. */
  stop(): void {
    const a = trackEl;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    set({ track: null, status: "idle", currentTime: 0, duration: 0 });
  },

  /** Тухайн id-тай track тоглож байвал л зогсооно (модуль дотор "дараагийнх" дарахад). */
  stopIf(trackId: string): void {
    if (state.track?.id === trackId) globalAudio.stop();
  },

  seek(seconds: number): void {
    const a = trackEl;
    if (!a || !state.track) return;
    const max = Number.isFinite(a.duration) ? a.duration : seconds;
    a.currentTime = Math.max(0, Math.min(max, seconds));
    set({ currentTime: a.currentTime });
  },

  setRate(rate: number): void {
    const a = trackEl;
    if (a) a.playbackRate = rate;
    set({ rate });
  },

  isActive(trackId: string): boolean {
    return (
      state.track?.id === trackId &&
      (state.status === "playing" || state.status === "loading")
    );
  },

  /**
   * Богино клип (үгийн дуудлага). Track тоглож байвал түр зогсооно.
   * Дууссан/алдаа гарсан эсэхээр resolve хийнэ — tts fallback-д хэрэгтэй.
   */
  playClip(src: string): Promise<{ ok: boolean; error?: string }> {
    const a = ensureClipEl();
    if (!a) return Promise.resolve({ ok: false, error: "Audio unavailable" });
    if (trackEl && !trackEl.paused) trackEl.pause();
    // Өмнөх клип дуусаагүй байхад шинийг эхлүүлбэл — өмнөхийг ok:true-гээр хаана
    // (дараалж дарахад fallback TTS давхар дуугарахгүй).
    const previous = clipPending;
    clipPending = null;
    previous?.({ ok: true });
    return new Promise((resolve) => {
      clipPending = resolve;
      const cleanup = () => {
        a.onended = null;
        a.onerror = null;
        if (clipPending === resolve) clipPending = null;
      };
      a.onended = () => {
        cleanup();
        resolve({ ok: true });
      };
      a.onerror = () => {
        cleanup();
        resolve({ ok: false, error: "Audio playback failed" });
      };
      try {
        a.pause();
        a.src = src;
        a.currentTime = 0;
      } catch {
        cleanup();
        resolve({ ok: false, error: "Audio playback failed" });
        return;
      }
      void a.play().catch(() => {
        cleanup();
        resolve({ ok: false, error: "Audio playback failed" });
      });
    });
  },

  stopClip(): void {
    clipEl?.pause();
  },
};
