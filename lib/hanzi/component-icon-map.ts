/** Fallback emoji when characters.json component rows omit `icon`. */
const COMPONENT_ICONS: Record<string, string> = {
  宀: "🏠",
  亻: "🧍",
  人: "👤",
  女: "👩",
  子: "🧒",
  日: "☀️",
  月: "🌙",
  木: "🌳",
  豕: "🐖",
  田: "🌾",
  力: "💪",
  手: "✋",
  目: "👁️",
  舌: "👅",
  口: "👄",
  壴: "🥁",
  百: "🛏️",
  鱼: "🐟",
  羊: "🐑",
  小: "🤏",
  大: "🙆",
  囗: "⬜",
  门: "🚪",
  火: "🔥",
  土: "🟫",
  不: "⛔",
  正: "📏",
  水: "💧",
  心: "❤️",
  马: "🐴",
  山: "⛰️",
  讠: "💬",
  钅: "⚙️",
  扌: "✋",
  氵: "💧",
  艹: "🌿",
  辶: "🚶",
  阝: "🏘️",
};

export function resolveComponentIcon(glyph: string, explicit?: string): string {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;
  return COMPONENT_ICONS[glyph] ?? "🔹";
}
