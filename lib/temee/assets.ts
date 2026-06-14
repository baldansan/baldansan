/** PNG paths kept for future Temee artwork — UI uses TemeeEmojiIcon for now. */
export const TEMEE_ASSETS = {
  thumbsup: "/temee/temee-thumbsup.png",
  point: "/temee/temee-point.png",
  chineseIcon: "/temee/temee-chinese-icon.png",
  avatar: "/temee/temee-avatar.png",
  teach: "/temee/temee-teach.png",
  think: "/temee/temee-think.png",
  chinese: "/temee/temee-chinese.png",
} as const;

export type TemeeAssetKey = keyof typeof TEMEE_ASSETS;
