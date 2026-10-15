import { globalAudio } from "@/lib/audio/global-audio-store";
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

/**
 * Богино клип (үгийн дуудлага) — глобал тоглуулагчийн clip сувгаар. Хичээлийн
 * урт аудио (track) тоглож байвал түр зогсооно, давхцахгүй.
 */
export async function playAudioUrl(url: string): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Audio unavailable" };
  }
  return globalAudio.playClip(url);
}
