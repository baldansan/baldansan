/** Hugo Lopez / Shtooka — audio-cmn (CC-by-sa) + krmanik/HSK-3.0 (CC BY-SA 4.0). */
export const AUDIO_CMN_ATTRIBUTION =
  "Үгийн дуудлага: audio-cmn (Hugo Lopez / Shtooka), HSK-3.0 (krmanik), CC BY-SA";

export const AUDIO_CMN_PUBLIC_BASE =
  "https://cdn.jsdelivr.net/gh/hugolpz/audio-cmn@master/64k/hsk";

export function buildAudioCmnUrl(zh: string): string {
  const trimmed = zh.trim();
  return `${AUDIO_CMN_PUBLIC_BASE}/cmn-${encodeURIComponent(trimmed)}.mp3`;
}

/** krmanik/HSK-3.0 — 10,900 word mp3s for the full HSK 3.0 list (CC BY-SA 4.0). */
export const HSK30_AUDIO_BASE =
  "https://cdn.jsdelivr.net/gh/krmanik/HSK-3.0@main/New%20HSK%20(2025)/Audio";

export function buildHsk30AudioUrl(zh: string): string {
  const trimmed = zh.trim();
  return `${HSK30_AUDIO_BASE}/cmn-${encodeURIComponent(trimmed)}.mp3`;
}
