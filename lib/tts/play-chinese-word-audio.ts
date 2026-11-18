import { buildAudioCmnUrl, buildHsk30AudioUrl } from "@/lib/tts/audio-cmn";
import { playAudioUrl } from "@/lib/tts/play-pronunciation";
import { primeSpeech, speakText } from "@/lib/tts/speech";

const CHINESE_TTS_FALLBACK_RATE = 0.8;

const SENTENCE_RE = /[，。！？、；：,.!?\s]/;

function isSentence(text: string): boolean {
  return text.length > 4 || SENTENCE_RE.test(text);
}

/** Recorded cmn-{hanzi}.mp3 first; on 404/error fall back to zh-CN TTS (slower). */
export async function playChineseWordAudio(text: string): Promise<{ ok: boolean }> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false };

  // Өгүүлбэр (урт текст, цэг таслалтай) бичлэгт байхгүй — шууд TTS.
  // Ингэснээр speak() хэрэглэгчийн дарсан gesture дотор дуудагдана (iOS-д заавал).
  if (isSentence(trimmed)) {
    const direct = await speakText(trimmed, {
      lang: "zh-CN",
      rate: CHINESE_TTS_FALLBACK_RATE,
    });
    return { ok: direct.ok };
  }

  // Үг: бичлэг олдохгүй бол дараа нь TTS рүү шилжинэ — түгжээг одоо тайлна.
  primeSpeech();

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
