import Link from "next/link";
import {
  defaultGameLinksForContext,
  gameLinkLabel,
  resolveGameLabels,
  type GameLinkSlug,
} from "@/lib/games/game-lesson-meta";

type Props = {
  lessonId: string;
  compact?: boolean;
  include?: GameLinkSlug[];
  isKorean?: boolean;
  isPrelesson?: boolean;
};

const LINK_COLORS: Record<GameLinkSlug, string> = {
  match: "bg-violet-100 text-violet-800",
  translate: "bg-blue-100 text-blue-800",
  "missing-word": "bg-amber-100 text-amber-800",
  arrange: "bg-emerald-100 text-emerald-800",
  stroke: "bg-rose-100 text-rose-800",
  meaning: "bg-teal-100 text-teal-800",
  radical: "bg-orange-100 text-orange-800",
};

export function GamePracticeLinks({
  lessonId,
  compact = false,
  include,
  isKorean = false,
  isPrelesson = false,
}: Props) {
  const labels = resolveGameLabels(isKorean, isPrelesson);
  const slugs =
    include ?? defaultGameLinksForContext({ isKorean, isPrelesson });

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-2"}`}>
      {slugs.map((slug) => (
        <Link
          key={slug}
          href={`/games/${slug}?lessonId=${lessonId}`}
          className={`min-h-[36px] rounded-full px-3 py-2 text-xs font-semibold ${LINK_COLORS[slug]}`}
        >
          {gameLinkLabel(slug, labels)}
        </Link>
      ))}
    </div>
  );
}
