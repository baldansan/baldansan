/** Ангийн жагсаалтын гарчиг: «4-р анги: Тусч хүний зовлон». */
export function formatEpisodeListTitle(
  episodeNo: number | null,
  titleMn: string | null
): string {
  const name = titleMn?.trim();
  if (name && /^\d+-р анги\b/i.test(name)) return name;
  const ep =
    episodeNo != null && Number.isFinite(episodeNo)
      ? `${episodeNo}-р анги`
      : "Анги";
  if (!name) return ep;
  return `${ep}: ${name}`;
}

export function formatSeriesHeaderMeta(
  episodeCount: number,
  hskLevel: number | null
): string {
  const parts = [`${episodeCount} анги`];
  if (hskLevel != null) parts.push(`HSK ${hskLevel}`);
  return parts.join(" · ");
}
