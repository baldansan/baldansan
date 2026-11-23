import { prepareTextForTts } from "@/lib/tts/prepare-tts-text";

export type SpeakOptions = {
  lang: string;
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
};

export type SpeakResult = {
  ok: boolean;
  error?: string;
};

export const TTS_UNAVAILABLE_MESSAGE =
  "Энэ төхөөрөмж дээр уншуулах боломжгүй байна.";

export const NO_ZH_VOICE_MESSAGE =
  "Энэ төхөөрөмжид хятад дуу (中文 voice) суугаагүй байна. Тохиргоо → Хэл/Дуу хоолойгоос хятад дуу нэмнэ үү, эсвэл Chrome/Safari ашиглана уу.";

let voicesCache: SpeechSynthesisVoice[] = [];
/** Shared in-flight voice load — all TTS callers reuse one promise (not per SpeakerButton). */
let voicesLoadPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

export function isSpeechSupported(): boolean {
  return getSynth() !== null;
}

function normalizeLang(lang: string): string {
  return lang.trim().replace("_", "-");
}

function langMatchesVoice(voiceLang: string, targetLang: string): boolean {
  const voice = normalizeLang(voiceLang).toLowerCase();
  const target = normalizeLang(targetLang).toLowerCase();
  if (voice === target) return true;
  const voiceBase = voice.split("-")[0];
  const targetBase = target.split("-")[0];
  return voiceBase === targetBase;
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = getSynth();
  if (!synth) return Promise.resolve([]);

  if (voicesCache.length > 0) {
    return Promise.resolve(voicesCache);
  }

  if (voicesLoadPromise) {
    return voicesLoadPromise;
  }

  voicesLoadPromise = new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      voicesCache = synth.getVoices();
      resolve(voicesCache);
    };

    const initial = synth.getVoices();
    if (initial.length > 0) {
      voicesCache = initial;
      finish();
      return;
    }

    const onVoicesChanged = () => {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      finish();
    };

    synth.addEventListener("voiceschanged", onVoicesChanged);

    window.setTimeout(() => {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      finish();
    }, 800);
  });

  return voicesLoadPromise;
}

export async function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return loadVoices();
}

export function getVoicesForLang(lang: string): SpeechSynthesisVoice[] {
  const synth = getSynth();
  if (!synth) return [];
  const voices = voicesCache.length > 0 ? voicesCache : synth.getVoices();
  return voices.filter((voice) => langMatchesVoice(voice.lang, lang));
}

export function getDefaultVoiceForLang(lang: string): SpeechSynthesisVoice | null {
  const matches = getVoicesForLang(lang);
  if (matches.length === 0) return null;

  const exact = matches.find(
    (voice) =>
      normalizeLang(voice.lang).toLowerCase() ===
      normalizeLang(lang).toLowerCase()
  );
  return exact ?? matches[0] ?? null;
}

export function stopSpeaking(): void {
  const synth = getSynth();
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    // Mobile browsers may throw if cancel is called too quickly.
  }
}

export async function speakText(
  text: string,
  options: SpeakOptions
): Promise<SpeakResult> {
  const synth = getSynth();
  if (!synth) {
    return { ok: false, error: TTS_UNAVAILABLE_MESSAGE };
  }

  const prepared = prepareTextForTts(text);
  if (!prepared) {
    return { ok: false, error: "Хоосон текст." };
  }

  const wasBusy = synth.speaking || synth.pending;
  stopSpeaking();
  // Safari/iOS: speak() нь хэрэглэгчийн дарсан gesture дотор дуудагдах ёстой —
  // voices ачаалагдсан, өмнөх уншлага байхгүй бол await/setTimeout-гүйгээр шууд уншина.
  // (cancel()-ийн яг дараа speak() дуудвал Safari алгасдаг тул busy үед setTimeout.)
  if (voicesCache.length === 0 && synth.getVoices().length > 0) voicesCache = synth.getVoices();
  const voicesReady = voicesCache.length > 0 && !wasBusy;
  if (voicesCache.length === 0) {
    // Дуу хоолой ачаалахыг хүлээх зуур gesture дуусна — түгжээг одоо тайлна.
    primeSpeech();
    await loadVoices();
  }

  return new Promise((resolve) => {
    try {
      const utterance = new SpeechSynthesisUtterance(prepared);
      utterance.lang = normalizeLang(options.lang);
      utterance.rate = options.rate ?? 0.9;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;

      const voices = synth.getVoices();
      let voice: SpeechSynthesisVoice | null = null;

      if (options.voiceURI) {
        voice = voices.find((item) => item.voiceURI === options.voiceURI) ?? null;
      }
      if (!voice) {
        voice = getDefaultVoiceForLang(options.lang);
      }
      if (voice) {
        utterance.voice = voice;
      } else if (/^(zh|cmn)/i.test(options.lang) && voices.length > 0) {
        // Хятад дуу суулгаагүй төхөөрөмж ханзыг англи дуугаар «уншдаг» байсан —
        // ойлгомжгүй чимээ гаргахын оронд ойлгомжтой мэдээлэл өгнө.
        resolve({ ok: false, error: NO_ZH_VOICE_MESSAGE });
        return;
      }

      utterance.onend = () => resolve({ ok: true });
      utterance.onerror = () =>
        resolve({ ok: false, error: TTS_UNAVAILABLE_MESSAGE });

      const go = () => {
        try {
          synth.speak(utterance);
        } catch {
          resolve({ ok: false, error: TTS_UNAVAILABLE_MESSAGE });
        }
      };
      if (voicesReady) go();
      else window.setTimeout(go, 0);
    } catch {
      resolve({ ok: false, error: TTS_UNAVAILABLE_MESSAGE });
    }
  });
}

let speechPrimed = false;

/**
 * iOS/Safari: speechSynthesis.speak() эхний удаа заавал хэрэглэгчийн дарсан
 * gesture дотор дуудагдах ёстой. Бичлэг (mp3) эхэлж оролдоод, олдоогүй үед
 * TTS рүү шилжихэд gesture аль хэдийн дууссан байдаг тул дуу гардаггүй байв.
 * Дарсан агшинд чимээгүй нэг utterance уншуулж «түгжээг тайлна» — нэг л удаа.
 */
export function primeSpeech(): void {
  if (speechPrimed) return;
  const synth = getSynth();
  if (!synth) return;
  try {
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    silent.rate = 2;
    synth.speak(silent);
    speechPrimed = true;
  } catch {
    // дэмжихгүй хөтөч — алгасна
  }
}
