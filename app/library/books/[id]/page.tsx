import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { StoryReader } from "@/components/library/story-reader";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getStory } from "@/lib/library/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const story = await getStory(id);
  return { title: story ? `${story.title} — Бөөндөө Сурцгаая` : "绘本 — Бөөндөө Сурцгаая" };
}

export default async function StoryPage({ params }: Props) {
  const { id } = await params;
  const [locale, story] = await Promise.all([getServerUiLocale(), getStory(id)]);
  if (!story) notFound();

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs
        items={[
          { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
          { href: "/library/books", label: L(locale, "绘本", "Зурагт ном") },
          { label: `L${story.level}` },
        ]}
      />

      <StoryReader
        locale={locale}
        story={{
          id: story.id,
          title: story.title,
          title_pinyin: story.title_pinyin,
          title_en: story.title_en,
          cover: story.cover,
          authors: story.authors,
          illustrators: story.illustrators,
          narrator: story.narrator,
          audio_full: story.audio_full,
          pages: story.pages.map((p) => ({
            id: p.id,
            page: p.page,
            zh: p.zh,
            pinyin: p.pinyin,
            image: p.image,
            audio: p.audio,
            en: p.en,
          })),
        }}
      />

      <details className="app-card mt-4 p-3 text-xs text-[var(--app-muted)]">
        <summary className="cursor-pointer font-semibold text-[var(--app-text)]">
          {L(locale, "版权与署名", "Лиценз, зохиогч")}
        </summary>
        <div className="mt-2 space-y-2" translate="no">
          <p className="leading-5">{story.attribution}</p>
          <p>
            {story.license_url ? (
              <a href={story.license_url} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 underline">
                {story.license}
              </a>
            ) : (
              story.license
            )}
            {" · "}
            <span>{story.source}</span>
          </p>
          <p>
            <a href={story.url} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 underline">
              {L(locale, "原文", "Эх хуудас")} ↗
            </a>
          </p>
        </div>
      </details>

      <p className="mt-3 text-center text-xs">
        <Link href="/library/books" className="font-semibold text-emerald-700">
          ‹ {L(locale, "返回书库", "Номын сан руу буцах")}
        </Link>
      </p>
    </MobileAppShell>
  );
}
