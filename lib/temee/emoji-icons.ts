/** Emoji circle presets (replaces Temee PNG assets temporarily). */

import type { TemeeAssetKey } from "@/lib/temee/assets";

export type TemeeEmojiVariant =
  | "greet"
  | "celebrate"
  | "featured"
  | "teach"
  | "think"
  | "bichleg"
  | "games"
  | "grammar"
  | "avatar";

export type TemeeEmojiConfig = {
  emoji: string;
  gradient: string;
  shadow: string;
};

export const TEMEE_EMOJI_CONFIG: Record<TemeeEmojiVariant, TemeeEmojiConfig> = {
  greet: {
    emoji: "👋",
    gradient: "linear-gradient(145deg, #e3f7eb 0%, #1fb85a 100%)",
    shadow: "0 4px 12px rgba(31, 184, 90, 0.35)",
  },
  celebrate: {
    emoji: "🎉",
    gradient: "linear-gradient(145deg, #fff4e0 0%, #ffd89b 100%)",
    shadow: "0 4px 12px rgba(255, 184, 90, 0.35)",
  },
  featured: {
    emoji: "🔥",
    gradient: "linear-gradient(145deg, #fff4e0 0%, #ff8a3d 100%)",
    shadow: "0 4px 12px rgba(255, 138, 61, 0.35)",
  },
  teach: {
    emoji: "📖",
    gradient: "linear-gradient(145deg, #e3f7eb 0%, #1fb85a 100%)",
    shadow: "0 4px 14px rgba(31, 184, 90, 0.3)",
  },
  think: {
    emoji: "💡",
    gradient: "linear-gradient(145deg, #e3f7eb 0%, #1fb85a 100%)",
    shadow: "0 4px 12px rgba(31, 184, 90, 0.28)",
  },
  bichleg: {
    emoji: "📺",
    gradient: "linear-gradient(145deg, #dbeafe 0%, #4d9fff 100%)",
    shadow: "0 4px 12px rgba(77, 159, 255, 0.35)",
  },
  games: {
    emoji: "🏆",
    gradient: "linear-gradient(145deg, #efe6ff 0%, #9b6bff 100%)",
    shadow: "0 4px 12px rgba(109, 40, 217, 0.32)",
  },
  grammar: {
    emoji: "📚",
    gradient: "linear-gradient(145deg, #ffe4e4 0%, #ff8a8a 100%)",
    shadow: "0 4px 12px rgba(255, 107, 107, 0.28)",
  },
  avatar: {
    emoji: "🐫",
    gradient: "linear-gradient(145deg, #ffffff 0%, #e3f7eb 100%)",
    shadow: "0 4px 12px rgba(31, 184, 90, 0.2)",
  },
};

export const LEGACY_TEMEE_ASSET_VARIANT: Record<TemeeAssetKey, TemeeEmojiVariant> =
  {
    thumbsup: "greet",
    point: "featured",
    teach: "teach",
    think: "think",
    chineseIcon: "grammar",
    avatar: "avatar",
    chinese: "grammar",
  };

export function resolveTemeeEmojiVariant(
  variant: TemeeEmojiVariant | TemeeAssetKey
): TemeeEmojiVariant {
  if (variant in TEMEE_EMOJI_CONFIG) {
    return variant as TemeeEmojiVariant;
  }
  return LEGACY_TEMEE_ASSET_VARIANT[variant as TemeeAssetKey] ?? "think";
}
