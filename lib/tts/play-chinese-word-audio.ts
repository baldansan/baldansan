import { buildAudioCmnUrl } from "@/lib/tts/audio-cmn";
import { playAudioUrl } from "@/lib/tts/play-pronunciation";
import { speakText } from "@/lib/tts/speech";

const CHINESE_TTS_FALLBACK_RATE = 0.8;

/** Recorded cmn-{hanzi}.mp3 first; on 404/error fall back to zh-CN TTS (slower). */
export async function playChineseWordAudio(text: string): Promise<{ ok: boolean }> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false };

  const url = buildAudioCmnUrl(trimmed);
  const audioResult = await playAudioUrl(url);
  if (audioResult.ok) return { ok: true };

  const tts = await speakText(trimmed, {
    lang: "zh-CN",
    rate: CHINESE_TTS_FALLBACK_RATE,
  });
  return { ok: tts.ok };
}
