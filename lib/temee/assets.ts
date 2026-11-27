/** Балдан (Тэмээ багш)-гийн зургийн замууд. Хуучин шилтэй тэмээний PNG-үүд 2026-11-28-нд устгагдсан. */
export const TEMEE_ASSETS = {
  thumbsup: "/temee/v3/thumbsup.webp",
  point: "/temee/v3/point.webp",
  chineseIcon: "/temee/v3/teach-sm.webp",
  avatar: "/temee/v3/wave.webp",
  teach: "/temee/v3/teach.webp",
  think: "/temee/v3/think.webp",
  chinese: "/temee/v3/teach.webp",
} as const;

export type TemeeAssetKey = keyof typeof TEMEE_ASSETS;
