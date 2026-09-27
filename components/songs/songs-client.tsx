"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SONGS, SONG_YEAR_MAX, SONG_YEAR_MIN, type Song, type SongKind } from "@/lib/songs/catalog";
import { songDecade, type SongDecade, type SongGroup } from "@/lib/songs/song-groups";
import type { VideoRow } from "@/lib/bichleg/types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

const YEARS: number[] = [];
for (let y = SONG_YEAR_MAX; y >= SONG_YEAR_MIN; y--) YEARS.push(y);

const chip = (on: boolean) =>
  `shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
    on ? "bg-emerald-500 text-white ring-emerald-500" : "bg-white text-slate-600 ring-slate-200"
  }`;

/** Static catalog card (Supabase-д дуу байхгүй үеийн нөөц). */
function SongCard({ song, locale }: { song: Song; locale: "mn" | "zh" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-card p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
          {song.kind === "kids" ? "🧸" : "🎵"}
        </div>
        <div className="min-w-0 flex-1" translate="no">
          <p className="hanzi text-base font-bold text-[var(--app-text)]">{song.titleZh}</p>
          <p className="text-xs text-[var(--app-muted)]">
            {song.titlePinyin}
            {song.artistZh ? ` · ${song.artistZh}` : ""} · {song.year}
            {song.level ? ` · HSK${song.level}` : ""}
          </p>
        </div>
        <span className="text-[var(--app-muted)]">{open ? "▾" : "›"}</span>
      </button>
      {open ? (
        <div className="mt-3 space-y-2 text-sm">
          {song.noteZh ? (
            <p className="text-[var(--app-muted)]" translate="no">
              {locale === "zh" ? song.noteZh : song.noteMn ?? song.noteZh}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {song.videoUrl ? (
              <a href={song.videoUrl} target="_blank" rel="noreferrer" className="app-btn-primary inline-flex text-sm">
                ▶ {tr(locale, "Видео үзэх")}
              </a>
            ) : null}
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song.titleZh + (song.artistZh ? ` ${song.artistZh}` : ""))}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
            >
              ↗ YouTube
            </a>
            {song.id === "liang-zhi-laohu" && song.lyrics?.length ? (
              <Link
                href="/bichleg/song/demo?demo=1"
                className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
              >
                🎤 {tr(locale, "Karaoke үзүүлбэр")}
              </Link>
            ) : null}
          </div>
          {song.vocab?.length ? (
            <div>
              <p className="mb-1 text-xs font-bold text-[var(--app-muted)]">{tr(locale, "Шинэ үг")}</p>
              <ul className="grid grid-cols-2 gap-1" translate="no">
                {song.vocab.map((v) => (
                  <li key={v.zh} className="rounded-xl bg-slate-50 px-2 py-1">
                    <span className="hanzi font-bold">{v.zh}</span>{" "}
                    <span className="text-xs text-[var(--app-muted)]">{v.pinyin}</span>
                    <span className="block text-xs">{locale === "zh" ? v.zhGloss ?? v.mn : v.mn}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {song.lyrics?.length ? (
            <ol className="space-y-1" translate="no">
              {song.lyrics.map((l, i) => (
                <li key={i}>
                  <span className="hanzi block">{l.zh}</span>
                  {l.pinyin ? <span className="block text-xs text-[var(--app-muted)]">{l.pinyin}</span> : null}
                  {locale === "mn" && l.mn ? <span className="block text-xs">{l.mn}</span> : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Supabase дуу → karaoke хуудас руу карт. */
function DbSongCard({ song, locale }: { song: VideoRow; locale: "mn" | "zh" }) {
  const isKids = song.series_id === "songs-kids";
  const title = song.title_zh ?? song.title_mn ?? song.id;
  const sub = [
    song.artist,
    song.year ? String(song.year) : null,
    song.hsk_level ? `HSK${song.hsk_level}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link href={`/bichleg/song/${encodeURIComponent(song.id)}`} className="app-card flex items-center gap-3 p-4">
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${song.youtube_id}/mqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 text-[10px] font-bold text-white">
          {isKids ? "🧸" : "🎵"}
        </span>
      </div>
      <div className="min-w-0 flex-1" translate="no">
        <p className="hanzi truncate text-base font-bold text-[var(--app-text)]">{title}</p>
        {song.title_mn && song.title_zh && locale === "mn" ? (
          <p className="truncate text-xs text-[var(--app-text)]">{song.title_mn}</p>
        ) : null}
        {sub ? <p className="text-xs text-[var(--app-muted)]">{sub}</p> : null}
      </div>
      <span className="text-[var(--app-muted)]">🎤 ›</span>
    </Link>
  );
}

const DECADES: { key: SongDecade; mn: string }[] = [
  { key: "kids", mn: "Хүүхдийн дуу" },
  { key: "2000s", mn: "2000-аад" },
  { key: "2010s", mn: "2010-аад" },
  { key: "2020s", mn: "2020-иод" },
];

type Props = {
  /** Supabase-оос ирсэн дууны бүлгүүд (цуврал тус бүр). Хоосон бол static catalog. */
  groups?: SongGroup[];
};

export function SongsClient({ groups = [] }: Props) {
  const locale = useUiLocale();
  const [kind, setKind] = useState<SongKind | "all">("all");
  const [year, setYear] = useState<number | null>(null);
  const [decade, setDecade] = useState<SongDecade | null>(null);
  const [level, setLevel] = useState<number | null>(null);

  const hasDb = groups.some((g) => g.songs.length > 0);

  const list = useMemo(
    () => SONGS.filter((s) => (kind === "all" || s.kind === kind) && (year === null || s.year === year)),
    [kind, year]
  );

  const levels = useMemo(() => {
    const set = new Set<number>();
    for (const g of groups) for (const s of g.songs) if (s.hsk_level) set.add(s.hsk_level);
    return Array.from(set).sort((a, b) => a - b);
  }, [groups]);

  const filteredGroups = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          songs: g.songs.filter(
            (s) =>
              (decade === null || songDecade(s) === decade) &&
              (level === null || s.hsk_level === level)
          ),
        }))
        .filter((g) => g.songs.length > 0),
    [groups, decade, level]
  );

  if (hasDb) {
    return (
      <div className="space-y-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button type="button" className={chip(decade === null)} onClick={() => setDecade(null)}>
            {tr(locale, "Бүгд")}
          </button>
          {DECADES.map((d) => (
            <button key={d.key} type="button" className={chip(decade === d.key)} onClick={() => setDecade(d.key)}>
              {tr(locale, d.mn)}
            </button>
          ))}
        </div>
        {levels.length ? (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <button type="button" className={chip(level === null)} onClick={() => setLevel(null)}>
              {tr(locale, "Бүх түвшин")}
            </button>
            {levels.map((l) => (
              <button key={l} type="button" className={chip(level === l)} onClick={() => setLevel(l)}>
                HSK{l}
              </button>
            ))}
          </div>
        ) : null}
        {filteredGroups.length === 0 ? (
          <div className="app-card p-6 text-center">
            <p className="text-2xl">🎶</p>
            <p className="mt-2 text-sm font-bold text-[var(--app-text)]">{tr(locale, "Энэ шүүлтүүрт дуу алга")}</p>
          </div>
        ) : (
          filteredGroups.map((g) => (
            <section key={g.seriesId} className="space-y-2">
              <h2 className="flex items-baseline gap-2 px-1 text-sm font-bold text-[var(--app-text)]" translate="no">
                <span>{locale === "zh" ? (g.titleZh ?? g.titleMn ?? g.seriesId) : (g.titleMn ?? g.titleZh ?? g.seriesId)}</span>
                {g.titleZh && locale === "mn" ? (
                  <span className="hanzi text-xs font-semibold text-[var(--app-muted)]">{g.titleZh}</span>
                ) : null}
                <span className="text-xs text-[var(--app-muted)]">{g.songs.length}</span>
              </h2>
              {g.songs.map((s) => (
                <DbSongCard key={s.id} song={s} locale={locale} />
              ))}
            </section>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" className={chip(kind === "all")} onClick={() => setKind("all")}>
          {tr(locale, "Бүгд")}
        </button>
        <button type="button" className={chip(kind === "hit")} onClick={() => setKind("hit")}>
          {tr(locale, "Хит дуу")}
        </button>
        <button type="button" className={chip(kind === "kids")} onClick={() => setKind("kids")}>
          {tr(locale, "Хүүхдийн дуу")}
        </button>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" className={chip(year === null)} onClick={() => setYear(null)}>
          {tr(locale, "Бүх жил")}
        </button>
        {YEARS.map((y) => (
          <button key={y} type="button" className={chip(year === y)} onClick={() => setYear(y)}>
            {y}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="app-card p-6 text-center">
          <p className="text-2xl">🎶</p>
          <p className="mt-2 text-sm font-bold text-[var(--app-text)]">{tr(locale, "Энэ жилийн дуу удахгүй нэмэгдэнэ")}</p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {tr(locale, "2000–2026 оны жил бүрийн хит дууг үг, утгын тайлбартай нь оруулна.")}
          </p>
        </div>
      ) : (
        list.map((s) => <SongCard key={s.id} song={s} locale={locale} />)
      )}
    </div>
  );
}
