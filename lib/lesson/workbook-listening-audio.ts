function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Resolve per-item listening audio; supports `shared_audio` as string or grouped array (q19_20, q21_22). */
export function resolveWorkbookListeningItemAudio(
  part: Record<string, unknown>,
  item: Record<string, unknown>
): string | undefined {
  const direct = trim(item.audio) || trim(item.audioFile);
  if (direct) return direct;

  const shared = part.shared_audio;
  if (typeof shared === "string") {
    const path = trim(shared);
    return path || undefined;
  }

  if (!Array.isArray(shared)) return undefined;

  const n = Number(item.n);
  if (!Number.isFinite(n)) return undefined;

  for (const entry of shared) {
    if (!isRecord(entry)) continue;
    const nums = entry.items;
    if (!Array.isArray(nums) || !nums.some((x) => Number(x) === n)) continue;
    const path = trim(entry.audio);
    if (path) return path;
  }

  return undefined;
}
