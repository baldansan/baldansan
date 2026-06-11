"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhoneFrame from "@/components/layout/PhoneFrame";
import { BottomNavChrome } from "@/components/mobile/bottom-nav-chrome";
import {
  SUBTITLE_MODE_CYCLE,
  SUBTITLE_MODE_LABELS,
  formatSeriesEpisodeBadge,
  type SubtitleDisplayMode,
  type SubtitleWord,
  type VideoRow,
  type VideoSeriesInfo,
  type VideoSubtitleRow,
} from "@/lib/bichleg/types";
import { BichlegYouTubePlayer } from "@/components/bichleg/bichleg-youtube-player";
import {
  safePlayerCurrentTime,
  safePlayerDuration,
  type YtPlayer,
} from "@/lib/bichleg/youtube-api";
import type { BichlegWordStatus } from "@/lib/supabase/saved-words";
import {
  fetchBichlegWordStatus,
  fetchVideoSubtitlesClient,
  saveWordFromVideo,
} from "@/lib/supabase/videos-client";

type Props = {
  videos: VideoRow[];
  seriesList?: VideoSeriesInfo[];
};

type PickedWord = SubtitleWord & { sourceVideoId: string };

function nextSubtitleMode(mode: SubtitleDisplayMode): SubtitleDisplayMode {
  const i = SUBTITLE_MODE_CYCLE.indexOf(mode);
  return SUBTITLE_MODE_CYCLE[(i + 1) % SUBTITLE_MODE_CYCLE.length];
}

function findActiveSubtitle(
  subtitles: VideoSubtitleRow[],
  time: number,
  offset: number
): VideoSubtitleRow | null {
  return (
    subtitles.find(
      (s) => time >= s.start_sec + offset && time < s.end_sec + offset
    ) ?? null
  );
}

function collectKeyWords(subtitles: VideoSubtitleRow[]): SubtitleWord[] {
  const seen = new Set<string>();
  const out: SubtitleWord[] = [];
  for (const sub of subtitles) {
    for (const w of sub.words ?? []) {
      if (!w.key || seen.has(w.zh)) continue;
      seen.add(w.zh);
      out.push(w);
    }
  }
  return out;
}

function BichlegIcon({
  name,
  className = "",
}: {
  name: "heart" | "bookmark" | "book" | "refresh" | "chevron-right";
  className?: string;
}) {
  const paths = {
    heart: (
      <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
    ),
    bookmark: (
      <>
        <path d="M9 5h6a2 2 0 0 1 2 2v14l-5-3l-5 3v-14a2 2 0 0 1 2-2" />
      </>
    ),
    book: (
      <>
        <path d="M3 19a9 9 0 0 1 9 0" />
        <path d="M12 19a9 9 0 0 0 9 0" />
        <path d="M12 5v14" />
        <path d="M5 7a7 7 0 0 1 14 0" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
      </>
    ),
    "chevron-right": <path d="M9 6l6 6l-6 6" />,
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

export function BichlegFeedClient({ videos, seriesList = [] }: Props) {
  const feedRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const subtitlesLoadedRef = useRef<Set<string>>(new Set());
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [activeIndex, setActiveIndex] = useState(0);

  const displayVideos = useMemo(() => {
    if (seriesFilter === "all") return videos;
    return videos.filter((v) => v.series_id === seriesFilter);
  }, [videos, seriesFilter]);
  const [subtitlesMap, setSubtitlesMap] = useState<
    Record<string, VideoSubtitleRow[]>
  >({});
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitleMode, setSubtitleMode] =
    useState<SubtitleDisplayMode>("all");
  const [speed, setSpeed] = useState<0.75 | 1>(1);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [showKeys, setShowKeys] = useState(false);
  const [pickedWord, setPickedWord] = useState<PickedWord | null>(null);
  const [wordStatus, setWordStatus] = useState<BichlegWordStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  const activeVideo = displayVideos[activeIndex] ?? null;
  const activeSubtitles = activeVideo
    ? (subtitlesMap[activeVideo.id] ?? [])
    : [];
  const syncOffset = activeVideo?.sync_offset_sec ?? 0;
  const activeSubtitle = findActiveSubtitle(
    activeSubtitles,
    currentTime,
    syncOffset
  );
  const keyWords = useMemo(
    () => collectKeyWords(activeSubtitles),
    [activeSubtitles]
  );

  useEffect(() => {
    if (!activeVideo) return;
    const videoId = activeVideo.id;
    if (subtitlesLoadedRef.current.has(videoId)) return;
    subtitlesLoadedRef.current.add(videoId);
    void fetchVideoSubtitlesClient(videoId).then((rows) => {
      setSubtitlesMap((prev) => ({ ...prev, [videoId]: rows }));
    });
  }, [activeVideo?.id]);

  const handlePlayerChange = useCallback((player: YtPlayer | null) => {
    playerRef.current = player;
    if (!player) {
      setPlayerReady(false);
    }
  }, []);

  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true);
    const player = playerRef.current;
    if (!player) return;
    const d = safePlayerDuration(player);
    if (d != null) setDuration(d);
    else if (activeVideo?.duration_sec) {
      setDuration(Number(activeVideo.duration_sec));
    }
  }, [activeVideo?.duration_sec]);

  useEffect(() => {
    setCurrentTime(0);
  }, [activeVideo?.id]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReady) return;
    try {
      player.setPlaybackRate(speed);
    } catch {
      /* player destroyed */
    }
  }, [speed, playerReady]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReady) return;
    try {
      if (muted) player.mute();
      else player.unMute();
    } catch {
      /* player destroyed */
    }
  }, [muted, playerReady]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReady) return;

    const tick = setInterval(() => {
      const t = safePlayerCurrentTime(player);
      if (t == null) return;
      setCurrentTime(t);
      const d = safePlayerDuration(player);
      if (d != null) setDuration(d);
    }, 150);

    return () => clearInterval(tick);
  }, [playerReady, activeVideo?.id]);

  useEffect(() => {
    setActiveIndex(0);
    setCurrentTime(0);
  }, [seriesFilter]);

  useEffect(() => {
    const root = feedRef.current;
    if (!root || displayVideos.length < 2) return;

    const slides = root.querySelectorAll<HTMLElement>("[data-slide-index]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue;
          const idx = Number(entry.target.getAttribute("data-slide-index"));
          if (Number.isFinite(idx)) setActiveIndex(idx);
        }
      },
      { root, threshold: [0.6] }
    );

    slides.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [displayVideos.length, seriesFilter]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function handleUnmuteTap() {
    if (muted) setMuted(false);
  }

  function runOnPlayer(fn: (player: YtPlayer) => void) {
    const player = playerRef.current;
    if (!player) return;
    try {
      fn(player);
    } catch {
      /* player destroyed */
    }
  }

  function handleWordPick(word: SubtitleWord) {
    if (!activeVideo) return;
    runOnPlayer((player) => player.pauseVideo());
    setWordStatus(null);
    setPickedWord({ ...word, sourceVideoId: activeVideo.id });
  }

  useEffect(() => {
    if (!pickedWord) {
      setWordStatus(null);
      return;
    }
    let cancelled = false;
    setStatusLoading(true);
    void fetchBichlegWordStatus(pickedWord.zh).then((status) => {
      if (!cancelled) {
        setWordStatus(status);
        setStatusLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pickedWord?.zh]);

  function handleContinue() {
    setPickedWord(null);
    setWordStatus(null);
    runOnPlayer((player) => player.playVideo());
  }

  async function handleSaveWord() {
    if (!pickedWord || wordStatus?.inSrs) return;
    const result = await saveWordFromVideo({
      zh: pickedWord.zh,
      pinyin: pickedWord.pinyin,
      mn: pickedWord.mn,
      sourceVideoId: pickedWord.sourceVideoId,
    });
    if (result.ok) {
      if (result.alreadyInSrs || (result.linkedToSrs && result.inCatalog)) {
        setToast("Давталтад нэмэгдсэн ✓");
      } else if (result.inCatalog === false) {
        setToast("Толь бичигт байхгүй — зөвхөн миний үгсэд хадгаллаа");
      } else if (result.duplicate) {
        setToast("Аль хэдийн хадгалсан");
      } else if (result.linkedToSrs) {
        setToast("Давталтад нэмлээ ✓");
      } else {
        setToast("Хадгаллаа ✓");
      }
      setPickedWord(null);
      setWordStatus(null);
      runOnPlayer((player) => player.playVideo());
    } else if (result.error) {
      setToast(result.error);
    }
  }

  function renderZh(sub: VideoSubtitleRow) {
    const words = sub.words?.length ? sub.words : [{ zh: sub.zh ?? "" }];
    return (
      <p className="bs-bl-zh hanzi">
        {words.map((w, i) => (
          <span key={`${sub.idx}-${i}`}>
            <button
              type="button"
              className={`bs-bl-word ${w.key ? "bs-bl-word--key" : ""}`}
              onClick={() => handleWordPick(w)}
            >
              {w.zh}
            </button>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </p>
    );
  }

  if (!displayVideos.length) {
    return (
      <PhoneFrame>
        <div className="bs-bichleg-empty">
          <p className="text-base font-bold">
            {videos.length ? "Энэ цувралд бичлэг байхгүй" : "Бичлэг олдсонгүй"}
          </p>
          <p className="mt-2 text-sm text-[var(--bs-muted)]">
            {videos.length ? (
              <>Өөр цуврал сонгоно уу.</>
            ) : (
              <>
                <code>data/videos/*.json</code> нэмээд{" "}
                <code>npm run load:videos</code> эсвэл админ импорт ашиглана уу.
              </>
            )}
          </p>
          {seriesList.length ? (
            <div className="bs-bichleg-series-filter !relative !top-0 mt-4 justify-center">
              <button
                type="button"
                className={`bs-bichleg-filter-chip ${seriesFilter === "all" ? "bs-bichleg-filter-chip--on" : ""}`}
                onClick={() => setSeriesFilter("all")}
              >
                Бүгд
              </button>
              {seriesList.map((series) => (
                <button
                  key={series.id}
                  type="button"
                  className={`bs-bichleg-filter-chip ${seriesFilter === series.id ? "bs-bichleg-filter-chip--on" : ""}`}
                  onClick={() => setSeriesFilter(series.id)}
                >
                  {series.title_mn ?? series.title_zh ?? series.id}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <BottomNavChrome active="clips" />
        </div>
      </PhoneFrame>
    );
  }

  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <PhoneFrame>
      <div className="bs-bichleg-shell">
        {seriesList.length ? (
          <div className="bs-bichleg-series-filter">
            <button
              type="button"
              className={`bs-bichleg-filter-chip ${seriesFilter === "all" ? "bs-bichleg-filter-chip--on" : ""}`}
              onClick={() => setSeriesFilter("all")}
            >
              Бүгд
            </button>
            {seriesList.map((series) => (
              <button
                key={series.id}
                type="button"
                className={`bs-bichleg-filter-chip ${seriesFilter === series.id ? "bs-bichleg-filter-chip--on" : ""}`}
                onClick={() => setSeriesFilter(series.id)}
              >
                {series.title_mn ?? series.title_zh ?? series.id}
              </button>
            ))}
          </div>
        ) : null}

        <div className="bs-bichleg-feed" ref={feedRef}>
          {displayVideos.map((video, index) => {
            const isActive = index === activeIndex;
            const seriesBadge = formatSeriesEpisodeBadge(
              video.series?.title_mn ?? null,
              video.episode_no
            );
            return (
              <section
                key={video.id}
                className="bs-bichleg-slide"
                data-slide-index={index}
              >
                <div
                  className="bs-bichleg-player-wrap"
                  onClick={handleUnmuteTap}
                  role="presentation"
                >
                  {isActive ? (
                    <BichlegYouTubePlayer
                      key={video.id}
                      youtubeId={video.youtube_id}
                      onPlayerChange={handlePlayerChange}
                      onReady={handlePlayerReady}
                    />
                  ) : (
                    <div className="bs-bichleg-player-placeholder" />
                  )}
                  <div
                    className="bs-bichleg-progress"
                    style={{ width: `${isActive ? progressPct : 0}%` }}
                  />
                  {isActive && seriesBadge ? (
                    <p className="bs-bichleg-series-badge">{seriesBadge}</p>
                  ) : null}
                </div>

                {isActive && subtitleMode !== "off" && activeSubtitle ? (
                  <div className="bs-bichleg-subs">
                    {(subtitleMode === "all" || subtitleMode === "study") &&
                    activeSubtitle.pinyin ? (
                      <p className="bs-bl-pinyin">{activeSubtitle.pinyin}</p>
                    ) : null}
                    {(subtitleMode === "all" ||
                      subtitleMode === "study" ||
                      subtitleMode === "zh") &&
                    activeSubtitle.zh ? (
                      renderZh(activeSubtitle)
                    ) : null}
                    {(subtitleMode === "all" || subtitleMode === "mn") &&
                    activeSubtitle.mn ? (
                      <p className="bs-bl-mn">{activeSubtitle.mn}</p>
                    ) : null}
                  </div>
                ) : null}

                {isActive ? (
                  <div className="bs-bichleg-actions">
                    <button
                      type="button"
                      className={`bs-bichleg-action ${liked[video.id] ? "bs-bichleg-action--on" : ""}`}
                      aria-label="Дуртай"
                      onClick={() =>
                        setLiked((p) => ({
                          ...p,
                          [video.id]: !p[video.id],
                        }))
                      }
                    >
                      <BichlegIcon name="heart" className="bs-bichleg-action-icon" />
                    </button>
                    <button
                      type="button"
                      className={`bs-bichleg-action ${bookmarked[video.id] ? "bs-bichleg-action--on" : ""}`}
                      aria-label="Хадгалах"
                      onClick={() =>
                        setBookmarked((p) => ({
                          ...p,
                          [video.id]: !p[video.id],
                        }))
                      }
                    >
                      <BichlegIcon name="bookmark" className="bs-bichleg-action-icon" />
                    </button>
                    <button
                      type="button"
                      className="bs-bichleg-action"
                      aria-label="Түлхүүр үгс"
                      onClick={() => setShowKeys(true)}
                    >
                      <BichlegIcon name="book" className="bs-bichleg-action-icon" />
                    </button>
                    <button
                      type="button"
                      className="bs-bichleg-action"
                      aria-label="Дахин эхлэх"
                      onClick={() => {
                        runOnPlayer((player) => {
                          player.seekTo(0, true);
                          player.playVideo();
                        });
                      }}
                    >
                      <BichlegIcon name="refresh" className="bs-bichleg-action-icon" />
                    </button>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <button
          type="button"
          className="bs-bichleg-mode-btn"
          onClick={() => setSubtitleMode((m) => nextSubtitleMode(m))}
        >
          {SUBTITLE_MODE_LABELS[subtitleMode]}
        </button>

        <div className="bs-bichleg-controls">
          <button
            type="button"
            className="bs-bichleg-ctrl-btn"
            onClick={() => setSpeed((s) => (s === 1 ? 0.75 : 1))}
          >
            {speed === 1 ? "1×" : "0.75×"}
          </button>
          {muted ? (
            <button
              type="button"
              className="bs-bichleg-ctrl-btn bs-bichleg-ctrl-btn--warn"
              onClick={() => setMuted(false)}
            >
              Дууг асаах
            </button>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <BottomNavChrome active="clips" />
        </div>

        {pickedWord ? (
          <div className="bs-bichleg-sheet-backdrop" onClick={handleContinue}>
            <div
              className="bs-bichleg-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="bs-bichleg-sheet-zh hanzi">{pickedWord.zh}</p>
              {pickedWord.pinyin ? (
                <p className="bs-bichleg-sheet-py">{pickedWord.pinyin}</p>
              ) : null}
              {pickedWord.mn ? (
                <p className="bs-bichleg-sheet-mn">{pickedWord.mn}</p>
              ) : null}
              {wordStatus?.saved &&
              !wordStatus.inCatalog &&
              !wordStatus.inSrs ? (
                <p className="bs-bichleg-sheet-note">
                  Толь бичигт байхгүй — зөвхөн миний үгсэд хадгалагдлаа
                </p>
              ) : null}
              <div className="bs-bichleg-sheet-actions">
                <button
                  type="button"
                  className="bs-bichleg-sheet-btn"
                  onClick={handleContinue}
                >
                  ▶ Үргэлжлүүлэх
                </button>
                {statusLoading ? (
                  <button
                    type="button"
                    className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--primary"
                    disabled
                  >
                    Шалгаж байна…
                  </button>
                ) : wordStatus?.inSrs ? (
                  <button
                    type="button"
                    className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--done"
                    disabled
                  >
                    Давталтад нэмэгдсэн ✓
                  </button>
                ) : (
                  <button
                    type="button"
                    className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--primary"
                    onClick={() => void handleSaveWord()}
                  >
                    ＋ Үгсэд нэмэх
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {showKeys ? (
          <div
            className="bs-bichleg-sheet-backdrop"
            onClick={() => setShowKeys(false)}
          >
            <div
              className="bs-bichleg-sheet bs-bichleg-sheet--keys"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="bs-bichleg-sheet-title">Түлхүүр үгс</p>
              <ul className="bs-bichleg-key-list">
                {keyWords.length ? (
                  keyWords.map((w) => (
                    <li key={w.zh}>
                      <button
                        type="button"
                        className="bs-bichleg-key-item"
                        onClick={() => {
                          setShowKeys(false);
                          handleWordPick(w);
                        }}
                      >
                        <span className="hanzi">{w.zh}</span>
                        <span>{w.pinyin}</span>
                        <span>{w.mn}</span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="bs-bichleg-key-empty">Түлхүүр үг байхгүй</li>
                )}
              </ul>
            </div>
          </div>
        ) : null}

        {toast ? <div className="bs-bichleg-toast">{toast}</div> : null}
      </div>
    </PhoneFrame>
  );
}
