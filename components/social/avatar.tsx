import { profileInitial } from "@/lib/social/profile";

/** Emoji эсвэл нэрийн эхний үсэг. */
export function SocialAvatar({
  name,
  avatar,
  size = 36,
}: {
  name: string | null | undefined;
  avatar?: string | null;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--app-primary-light)] font-bold text-[var(--app-primary-dark)]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {avatar ? avatar : profileInitial(name)}
    </span>
  );
}
