import { buildAudioCmnUrl, buildHsk30AudioUrl } from "@/lib/tts/audio-cmn";
import { playAudioUrl } from "@/lib/tts/play-pronunciation";
import { speakText } from "@/lib/tts/speech";

const CHINESE_TTS_FALLBACK_RATE = 0.8;

/** Recorded cmn-{hanzi}.mp3 first; on 404/error fall back to zh-CN TTS (slower). */
export async function playChineseWordAudio(text: string): Promise<{ ok: boolean }> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false };

  // 1) Human recording (audio-cmn), 2) HSK 3.0 recording, 3) device TTS.
  const audioResult = await playAudioUrl(buildAudioCmnUrl(trimmed));
  if (audioResult.ok) return { ok: true };

  const hsk30Result = await playAudioUrl(buildHsk30AudioUrl(trimmed));
  if (hsk30Result.ok) return { ok: true };

  const tts = await speakText(trimmed, {
    lang: "zh-CN",
    rate: CHINESE_TTS_FALLBACK_RATE,
  });
  return { ok: tts.ok };
}
