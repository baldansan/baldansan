import Link from "next/link";

type Props = {
  lessonId: string;
  compact?: boolean;
  include?: Array<(typeof LINKS)[number]["href"]>;
};

const LINKS = [
  { href: "match", label: "Холбох", color: "bg-violet-100 text-violet-800" },
  { href: "translate", label: "Орчуулах", color: "bg-blue-100 text-blue-800" },
  { href: "missing-word", label: "Дутуу үг", color: "bg-amber-100 text-amber-800" },
  { href: "arrange", label: "Дараалал", color: "bg-emerald-100 text-emerald-800" },
  { href: "stroke", label: "Дутуу зураас", color: "bg-rose-100 text-rose-800" },
] as const;

export function GamePracticeLinks({
  lessonId,
  compact = false,
  include,
}: Props) {
  const links = include
    ? LINKS.filter((link) => include.includes(link.href))
    : LINKS;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-2"}`}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={`/games/${link.href}?lessonId=${lessonId}`}
          className={`min-h-[36px] rounded-full px-3 py-2 text-xs font-semibold ${link.color}`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
