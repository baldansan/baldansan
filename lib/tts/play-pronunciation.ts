import { getLangTtsSettings } from "@/lib/tts/tts-settings";
import { speakText, stopSpeaking, type SpeakResult } from "@/lib/tts/speech";

export async function speakWithSavedSettings(
  text: string,
  lang: string
): Promise<SpeakResult> {
  const settings = getLangTtsSettings(lang);
  return speakText(text, {
    lang,
    voiceURI: settings.voiceURI,
    rate: settings.rate,
    pitch: settings.pitch,
    volume: settings.volume,
  });
}

export function stopPronunciation(): void {
  stopSpeaking();
}

export async function playAudioUrl(url: string): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Audio unavailable" };
  }

  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.preload = "auto";

    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
    };

    audio.onended = () => {
      cleanup();
      resolve({ ok: true });
    };

    audio.onerror = () => {
      cleanup();
      resolve({ ok: false, error: "Audio playback failed" });
    };

    void audio.play().catch(() => {
      cleanup();
      resolve({ ok: false, error: "Audio playback failed" });
    });
  });
}
