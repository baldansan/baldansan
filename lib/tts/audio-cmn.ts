/** Hugo Lopez / Shtooka — audio-cmn (CC-by-sa). */
export const AUDIO_CMN_ATTRIBUTION =
  "Үгийн дуудлага: audio-cmn (Hugo Lopez / Shtooka), CC-by-sa";

export const AUDIO_CMN_PUBLIC_BASE =
  "https://cdn.jsdelivr.net/gh/hugolpz/audio-cmn@master/64k/hsk";

export function buildAudioCmnUrl(zh: string): string {
  const trimmed = zh.trim();
  return `${AUDIO_CMN_PUBLIC_BASE}/cmn-${encodeURIComponent(trimmed)}.mp3`;
}
