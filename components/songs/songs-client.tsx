"use client";

import { useMemo, useState } from "react";
import { SONGS, SONG_YEAR_MAX, SONG_YEAR_MIN, type Song, type SongKind } from "@/lib/songs/catalog";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

const YEARS: number[] = [];
for (let y = SONG_YEAR_MAX; y >= SONG_YEAR_MIN; y--) YEARS.push(y);

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
          {song.videoUrl ? (
            <a href={song.videoUrl} target="_blank" rel="noreferrer" className="app-btn-primary inline-flex text-sm">
              ▶ {tr(locale, "Видео үзэх")}
            </a>
          ) : null}
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

export function SongsClient() {
  const locale = useUiLocale();
  const [kind, setKind] = useState<SongKind | "all">("all");
  const [year, setYear] = useState<number | null>(null);

  const list = useMemo(
    () => SONGS.filter((s) => (kind === "all" || s.kind === kind) && (year === null || s.year === year)),
    [kind, year]
  );

  const chip = (on: boolean) =>
    `shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
      on ? "bg-emerald-500 text-white ring-emerald-500" : "bg-white text-slate-600 ring-slate-200"
    }`;

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
