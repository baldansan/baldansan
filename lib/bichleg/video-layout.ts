export type BichlegVideoLayout = "landscape" | "portrait";

const THUMB_CANDIDATES = (youtubeId: string) => [
  `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`,
  `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
];

function loadImageSize(
  url: string
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth < 2 || img.naturalHeight < 2) {
        resolve(null);
        return;
      }
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** YouTube thumbnail-аар хэвтээ/босоо тодорхойлно — DB багана шаарддаггүй. */
export async function detectYouTubeVideoLayout(
  youtubeId: string
): Promise<BichlegVideoLayout> {
  for (const url of THUMB_CANDIDATES(youtubeId)) {
    const size = await loadImageSize(url);
    if (!size) continue;
    return size.width >= size.height ? "landscape" : "portrait";
  }
  return "portrait";
}
