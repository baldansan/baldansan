"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { BottomNavChrome } from "@/components/mobile/bottom-nav-chrome";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { BichlegSlangSheet } from "@/components/bichleg/bichleg-slang-sheet";
import { BichlegSeekBar } from "@/components/bichleg/bichleg-seek-bar";
import { BichlegTranscriptSheet } from "@/components/bichleg/bichleg-transcript-sheet";
import { PronunciationCheck } from "@/components/pronunciation/pronunciation-check";
import {
  formatSeriesEpisodeBadge,
  type SubtitleSlangNote,
  type SubtitleWord,
  type UserVideoProgress,
  type VideoRow,
  type VideoSubtitleRow,
} from "@/lib/bichleg/types";
import { upsertVideoWatchProgress } from "@/lib/supabase/video-progress-client";
import { BichlegPlayerTouchLayer } from "@/components/bichleg/bichleg-player-touch-layer";
import { BichlegPlayerTransport } from "@/components/bichleg/bichleg-player-transport";
import { BichlegYouTubePlayer } from "@/components/bichleg/bichleg-youtube-player";
import {
  formatPlaybackRateLabel,
  nextBichlegSpeed,
  type BichlegPreferredSpeed,
} from "@/lib/bichleg/playback-rate";
import {
  applyPlaybackRate,
  safePlayerCurrentTime,
  safePlayerDuration,
  type YtPlayer,
} from "@/lib/bichleg/youtube-api";
import {
  BICHLEG_SKIP_SECONDS,
  BICHLEG_SWIPE_SEC_PER_PX,
  clampPlaybackTime,
  formatSubtitleClock,
  nextSentenceSeekSec,
  prevSentenceSeekSec,
  resolveResumeSeekSec,
} from "@/lib/bichleg/player-seek";
import {
  clearResumePosition,
  formatHanziSizeLabel,
  nextHanziSize,
  readHanziSize,
  readPreferredSpeed,
  readResumePosition,
  writeHanziSize,
  writePreferredSpeed,
  writeResumePosition,
  type BichlegHanziSize,
} from "@/lib/bichleg/player-prefs";
import {
  currentFullscreenElement,
  exitNativeFullscreen,
  isCoarsePointerLandscape,
  requestNativeFullscreen,
  subscribeOrientation,
  type BichlegFullscreenMode,
} from "@/lib/bichleg/fullscreen";
import {
  findActiveSubtitle,
  formatUserSubtitleOffsetLabel,
  nextUserSubtitleOffset,
  readUserSubtitleOffset,
  subtitlePlayerSeekSec,
  totalSubtitleOffsetSec,
  writeUserSubtitleOffset,
  type UserSubtitleOffsetOption,
} from "@/lib/bichleg/subtitle-offset";
import {
  detectYouTubeVideoLayout,
  type BichlegVideoLayout,
} from "@/lib/bichleg/video-layout";
import type { BichlegWordStatus } from "@/lib/supabase/saved-words";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";
import {
  fetchBichlegWordStatus,
  fetchVideoSubtitlesClient,
  saveWordFromVideo,
} from "@/lib/supabase/videos-client";

type Props = {
  videos: VideoRow[];
  backHref?: string;
  feedTitle?: string;
  progressByVideoId?: Record<string, UserVideoProgress>;
  initialActiveIndex?: number;
};

/** Сервер (оргил watched_sec) + localStorage (яг байрлал) хадгалах давтамж. */
const WATCH_SAVE_INTERVAL_MS = 5_000;
/** «⏮ … -өөс үргэлжилж байна» чип хэдэн мс харагдах вэ. */
const RESUME_CHIP_MS = 8_000;
/** Үг хадгалсны дараа «Нэмэгдсэн ✓» харуулж байж хуудсыг хаах хугацаа. */
const SAVE_DONE_CLOSE_MS = 650;

type PickedWord = SubtitleWord & { sourceVideoId: string };
type SaveState = "idle" | "saving" | "done";

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

function readInitialSeekQuery(): number {
  if (typeof window === "undefined") return 0;
  try {
    const t = Number(new URLSearchParams(window.location.search).get("t"));
    return Number.isFinite(t) && t > 0 ? t : 0;
  } catch {
    return 0;
  }
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

export function BichlegFeedClient({
  videos,
  backHref = "/bichleg",
  feedTitle,
  progressByVideoId: initialProgress = {},
  initialActiveIndex = 0,
}: Props) {
  const locale = useUiLocale();
  const shellRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const subtitlesLoadedRef = useRef<Set<string>>(new Set());
  const peakWatchedRef = useRef<Record<string, number>>({});
  const lastFlushedVideoIdRef = useRef<string | null>(null);
  const flushChainRef = useRef<Promise<void>>(Promise.resolve());
  const progressRef = useRef<Record<string, UserVideoProgress>>(initialProgress);
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);
  const [progressByVideoId, setProgressByVideoId] =
    useState<Record<string, UserVideoProgress>>(initialProgress);
  const [subtitlesMap, setSubtitlesMap] = useState<
    Record<string, VideoSubtitleRow[]>
  >({});
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMn, setShowMn] = useState(true);
  // Хурд — localStorage (PlayerSwitch зөвхөн клиент дээр mount хийдэг тул SSR зөрүү үгүй)
  const [preferredSpeed, setPreferredSpeed] = useState<BichlegPreferredSpeed>(() =>
    readPreferredSpeed()
  );
  const [displaySpeed, setDisplaySpeed] = useState(1);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [showKeys, setShowKeys] = useState(false);
  // 🎤 Дуудлага шалгах — идэвхтэй мөрийг микрофоноор хэлж үнэлүүлэх
  const [pronLine, setPronLine] = useState<{ zh: string; pinyin: string | null } | null>(null);
  const [pickedWord, setPickedWord] = useState<PickedWord | null>(null);
  const [pickedSlangNote, setPickedSlangNote] = useState<SubtitleSlangNote | null>(
    null
  );
  const [slangSubtitleIdx, setSlangSubtitleIdx] = useState<number | null>(null);
  const [wordStatus, setWordStatus] = useState<BichlegWordStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [toast, setToast] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [ended, setEnded] = useState(false);
  const [skipOverlay, setSkipOverlay] = useState<string | null>(null);
  const [userSubtitleOffset, setUserSubtitleOffset] =
    useState<UserSubtitleOffsetOption>(0);
  const [layoutByYoutubeId, setLayoutByYoutubeId] = useState<
    Record<string, BichlegVideoLayout>
  >({});

  // --- Шинэ: seek / үргэлжлүүлэх / өгүүлбэрийн дасгал / сонсгол / transcript / бүтэн дэлгэц ---
  const [resumeChip, setResumeChip] = useState<{ fromSec: number } | null>(null);
  const [scrubPreviewSec, setScrubPreviewSec] = useState<number | null>(null);
  const [loopIdx, setLoopIdx] = useState<number | null>(null);
  const [autoPause, setAutoPause] = useState(false);
  const [pausedAtSentence, setPausedAtSentence] = useState(false);
  const [listenMode, setListenMode] = useState(false);
  const [revealedIdx, setRevealedIdx] = useState<Set<number>>(() => new Set());
  const [hanziSize, setHanziSize] = useState<BichlegHanziSize>(() => readHanziSize());
  const [showTranscript, setShowTranscript] = useState(false);
  const [savedThisEpisode, setSavedThisEpisode] = useState<Record<string, string[]>>({});
  const [endCardDismissed, setEndCardDismissed] = useState(false);
  const [fsMode, setFsMode] = useState<BichlegFullscreenMode>("none");

  const isPlayingRef = useRef(true);
  const currentTimeRef = useRef(0);
  const loopIdxRef = useRef<number | null>(null);
  const autoPauseRef = useRef(false);
  const autoPausedIdxRef = useRef<number | null>(null);
  const lastActiveIdxRef = useRef<number | null>(null);
  const subsRef = useRef<VideoSubtitleRow[]>([]);
  const offsetRef = useRef(0);
  const scrubStartSecRef = useRef(0);
  const scrubPreviewRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const lastResumeWriteRef = useRef(0);
  const initialSeekQueryRef = useRef<number | null>(null);
  const resumeChipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fsModeRef = useRef<BichlegFullscreenMode>("none");

  const activeVideo = videos[activeIndex] ?? null;
  // Time-on-video (Оюу оноо): re-keys per active video in the feed.
  useActivityTracker("video", activeVideo?.id ?? null, Boolean(activeVideo));

  useEffect(() => {
    const ids = [...new Set(videos.map((v) => v.youtube_id))];
    for (const youtubeId of ids) {
      void detectYouTubeVideoLayout(youtubeId).then((layout) => {
        setLayoutByYoutubeId((prev) =>
          prev[youtubeId] ? prev : { ...prev, [youtubeId]: layout }
        );
      });
    }
  }, [videos]);

  const resolveDurationSec = useCallback(
    (video: VideoRow | null, playerDuration = 0) => {
      if (!video) return 0;
      const fromMeta = Number(video.duration_sec ?? 0);
      if (Number.isFinite(fromMeta) && fromMeta > 0) return fromMeta;
      return playerDuration > 0 ? playerDuration : 0;
    },
    []
  );

  const flushWatchProgress = useCallback(
    async (video: VideoRow, watchedSec: number, playerDuration = 0) => {
      const peak = Math.max(
        peakWatchedRef.current[video.id] ?? 0,
        watchedSec,
        progressRef.current[video.id]?.watched_sec ?? 0
      );
      peakWatchedRef.current[video.id] = peak;

      const result = await upsertVideoWatchProgress({
        videoId: video.id,
        watchedSec: peak,
        durationSec: resolveDurationSec(video, playerDuration),
      });

      if (result.ok && result.progress) {
        progressRef.current[video.id] = result.progress;
        setProgressByVideoId((prev) => ({
          ...prev,
          [video.id]: result.progress!,
        }));
      }
    },
    [resolveDurationSec]
  );

  const enqueueFlush = useCallback(
    (video: VideoRow, watchedSec: number, playerDuration = 0) => {
      flushChainRef.current = flushChainRef.current
        .then(() => flushWatchProgress(video, watchedSec, playerDuration))
        .catch(() => {});
      return flushChainRef.current;
    },
    [flushWatchProgress]
  );

  /** Яг зогссон байрлалыг localStorage-д (үргэлжлүүлэхэд) бичнэ. */
  const writeResumeNow = useCallback(
    (video: VideoRow | null, sec: number, dur: number) => {
      if (!video) return;
      writeResumePosition(video.id, sec, dur);
      lastResumeWriteRef.current = Date.now();
    },
    []
  );

  const activeSubtitles = activeVideo
    ? (subtitlesMap[activeVideo.id] ?? [])
    : [];
  const totalSubtitleOffset = useMemo(() => {
    if (!activeVideo) return userSubtitleOffset;
    return totalSubtitleOffsetSec(activeVideo, userSubtitleOffset);
  }, [activeVideo, userSubtitleOffset]);

  const activeSubtitle = useMemo(
    () =>
      findActiveSubtitle(activeSubtitles, currentTime, totalSubtitleOffset),
    [activeSubtitles, currentTime, totalSubtitleOffset]
  );
  const activeIdx = activeSubtitle?.idx ?? null;
  const keyWords = useMemo(
    () => collectKeyWords(activeSubtitles),
    [activeSubtitles]
  );

  useEffect(() => {
    subsRef.current = activeSubtitles;
    offsetRef.current = totalSubtitleOffset;
  }, [activeSubtitles, totalSubtitleOffset]);

  useEffect(() => {
    loopIdxRef.current = loopIdx;
  }, [loopIdx]);

  useEffect(() => {
    autoPauseRef.current = autoPause;
  }, [autoPause]);

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

  const syncPlaybackRate = useCallback(
    (player: YtPlayer) => {
      const actual = applyPlaybackRate(player, preferredSpeed);
      setDisplaySpeed(actual);
    },
    [preferredSpeed]
  );

  const showResumeChip = useCallback((fromSec: number) => {
    setResumeChip({ fromSec });
    if (resumeChipTimerRef.current) clearTimeout(resumeChipTimerRef.current);
    resumeChipTimerRef.current = setTimeout(() => setResumeChip(null), RESUME_CHIP_MS);
  }, []);

  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true);
    const player = playerRef.current;
    if (!player) return;
    syncPlaybackRate(player);
    const d = safePlayerDuration(player);
    const dur =
      d != null && d > 0
        ? d
        : activeVideo?.duration_sec
          ? Number(activeVideo.duration_sec)
          : 0;
    if (dur > 0) setDuration(dur);

    if (!activeVideo) return;

    // ?t=SEC — өгүүлбэрийн картаас (нэг л удаа, зөвхөн эхний ачааллын анги)
    if (initialSeekQueryRef.current === null) {
      initialSeekQueryRef.current = readInitialSeekQuery();
      const t = initialSeekQueryRef.current;
      if (t > 0) {
        try {
          player.seekTo(t, true);
        } catch {
          /* player destroyed */
        }
        currentTimeRef.current = t;
        setCurrentTime(t);
        return;
      }
    }

    // ⏮ Үргэлжлүүлэх: localStorage яг байрлал → серверийн watched_sec (оргил)
    const local = readResumePosition(activeVideo.id);
    const fromSec =
      local?.sec ?? progressRef.current[activeVideo.id]?.watched_sec ?? 0;
    const seek = resolveResumeSeekSec(fromSec, dur);
    if (seek != null) {
      try {
        player.seekTo(seek, true);
      } catch {
        /* player destroyed */
      }
      currentTimeRef.current = seek;
      setCurrentTime(seek);
      showResumeChip(fromSec);
    }
  }, [activeVideo, syncPlaybackRate, showResumeChip]);

  // Анги солигдоход тоглуулагчийн төлөв, өгүүлбэрийн дасгалын төлөв цэвэрлэх
  useEffect(() => {
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setIsPlaying(true);
    isPlayingRef.current = true;
    setEnded(false);
    setEndCardDismissed(false);
    setSkipOverlay(null);
    setResumeChip(null);
    setScrubPreviewSec(null);
    setLoopIdx(null);
    loopIdxRef.current = null;
    setPausedAtSentence(false);
    autoPausedIdxRef.current = null;
    lastActiveIdxRef.current = null;
    setRevealedIdx(new Set());
    setShowTranscript(false);
  }, [activeVideo?.id]);

  useEffect(() => {
    if (!activeVideo) return;
    setUserSubtitleOffset(readUserSubtitleOffset(activeVideo.id));
  }, [activeVideo?.id]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReady) return;
    syncPlaybackRate(player);
  }, [preferredSpeed, playerReady, syncPlaybackRate]);

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

  // 150мс тутам: цаг, оргил, 🔁 давталт, «Автомат зогсоох», localStorage байрлал
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReady) return;

    const tick = setInterval(() => {
      const t = safePlayerCurrentTime(player);
      if (t == null) return;
      currentTimeRef.current = t;
      setCurrentTime(t);
      const d = safePlayerDuration(player);
      if (d != null) {
        durationRef.current = d;
        setDuration(d);
      }
      if (!activeVideo) return;

      const prevPeak = peakWatchedRef.current[activeVideo.id] ?? 0;
      if (t > prevPeak) peakWatchedRef.current[activeVideo.id] = t;

      const subs = subsRef.current;
      const off = offsetRef.current;

      // 🔁 Нэг өгүүлбэр давтах
      const loop = loopIdxRef.current;
      if (loop != null) {
        const sub = subs.find((s) => s.idx === loop);
        if (sub) {
          const start = subtitlePlayerSeekSec(sub, off);
          const end = sub.end_sec + off;
          if (t >= end - 0.05 && t < end + 1.5) {
            try {
              player.seekTo(start, true);
            } catch {
              /* player destroyed */
            }
          } else if (t >= end + 1.5 || t < start - 1.5) {
            // Хэрэглэгч өөр тийш шилжсэн — давталтыг болиулна
            loopIdxRef.current = null;
            setLoopIdx(null);
          }
        } else {
          loopIdxRef.current = null;
          setLoopIdx(null);
        }
      }

      // ⏸ Өгүүлбэр бүрийн төгсгөлд зогсох
      const active = findActiveSubtitle(subs, t, off);
      const activeId = active?.idx ?? null;
      const prevId = lastActiveIdxRef.current;
      lastActiveIdxRef.current = activeId;
      if (autoPauseRef.current && loopIdxRef.current == null && isPlayingRef.current) {
        let pauseFor: VideoSubtitleRow | null = null;
        if (active && t >= active.end_sec + off - 0.12 && autoPausedIdxRef.current !== active.idx) {
          pauseFor = active;
        } else if (prevId != null && prevId !== activeId && autoPausedIdxRef.current !== prevId) {
          // Мөр хоорондын завсаргүй — өмнөх мөрийн төгсгөлийг алгассан
          pauseFor = subs.find((s) => s.idx === prevId) ?? null;
        }
        if (pauseFor) {
          autoPausedIdxRef.current = pauseFor.idx;
          try {
            player.seekTo(Math.max(0, pauseFor.end_sec + off - 0.05), true);
            player.pauseVideo();
          } catch {
            /* player destroyed */
          }
          setPausedAtSentence(true);
        }
      }

      // Байрлал (үргэлжлүүлэх) — тоглож байх үед ~5с тутам
      if (isPlayingRef.current && Date.now() - lastResumeWriteRef.current >= WATCH_SAVE_INTERVAL_MS) {
        writeResumeNow(activeVideo, t, d ?? 0);
      }
    }, 150);

    return () => clearInterval(tick);
  }, [playerReady, activeVideo?.id, writeResumeNow]);

  useEffect(() => {
    progressRef.current = initialProgress;
    setProgressByVideoId(initialProgress);
    peakWatchedRef.current = {};
    for (const [videoId, row] of Object.entries(initialProgress)) {
      peakWatchedRef.current[videoId] = row.watched_sec;
    }
  }, [initialProgress, videos]);

  useEffect(() => {
    setActiveIndex(initialActiveIndex);
    setCurrentTime(0);
  }, [videos, initialActiveIndex]);

  useEffect(() => {
    const root = feedRef.current;
    if (!root || initialActiveIndex <= 0) return;
    const slide = root.querySelector<HTMLElement>(
      `[data-slide-index="${initialActiveIndex}"]`
    );
    slide?.scrollIntoView({ block: "start" });
  }, [videos, initialActiveIndex]);

  // Сервер: тоглож байх үед 5с тутам оргил хадгална (peak семантик хэвээр)
  useEffect(() => {
    if (!activeVideo || !playerReady || !isPlaying) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const t = safePlayerCurrentTime(player);
      if (t == null) return;
      void enqueueFlush(
        activeVideo,
        t,
        safePlayerDuration(player) ?? duration
      );
    }, WATCH_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [activeVideo?.id, playerReady, isPlaying, duration, enqueueFlush]);

  useEffect(() => {
    const previousId = lastFlushedVideoIdRef.current;
    if (previousId && previousId !== activeVideo?.id) {
      const previousVideo = videos.find((v) => v.id === previousId);
      if (previousVideo) {
        const peak = peakWatchedRef.current[previousId] ?? 0;
        void enqueueFlush(previousVideo, peak, duration);
      }
    }
    lastFlushedVideoIdRef.current = activeVideo?.id ?? null;
  }, [activeVideo?.id, videos, duration, enqueueFlush]);

  useEffect(() => {
    return () => {
      const videoId = lastFlushedVideoIdRef.current;
      if (!videoId) return;
      const video = videos.find((v) => v.id === videoId);
      if (!video) return;
      const peak = peakWatchedRef.current[videoId] ?? 0;
      void enqueueFlush(video, peak, duration);
    };
  }, [videos, duration, enqueueFlush]);

  // Анги солигдох / компонент хаагдах үед яг байрлалыг хадгална
  useEffect(() => {
    if (!activeVideo) return;
    const video = activeVideo;
    return () => {
      const t = currentTimeRef.current;
      if (t > 0) writeResumeNow(video, t, durationRef.current);
    };
  }, [activeVideo?.id, writeResumeNow]);

  // Таб далд орох / хуудас хаагдах үед хадгална
  useEffect(() => {
    if (!activeVideo) return;
    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      const player = playerRef.current;
      const t = (player && safePlayerCurrentTime(player)) ?? currentTimeRef.current;
      writeResumeNow(activeVideo, t, duration);
      void enqueueFlush(activeVideo, t, duration);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [activeVideo, duration, enqueueFlush, writeResumeNow]);

  useEffect(() => {
    const root = feedRef.current;
    if (!root || videos.length < 2) return;

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
  }, [videos.length]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!skipOverlay) return;
    const t = setTimeout(() => setSkipOverlay(null), 500);
    return () => clearTimeout(t);
  }, [skipOverlay]);

  // --- Бүтэн дэлгэц: native fullscreenchange-тэй синк ---
  useEffect(() => {
    fsModeRef.current = fsMode;
  }, [fsMode]);

  useEffect(() => {
    const onChange = () => {
      const el = currentFullscreenElement();
      if (!el && fsModeRef.current === "native") setFsMode("none");
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Утсаа хэвтээ эргүүлэхэд автоматаар бүтэн дэлгэц, босоо болоход гарна
  useEffect(() => {
    return subscribeOrientation(() => {
      const landscape = isCoarsePointerLandscape();
      if (landscape && fsModeRef.current === "none") {
        setFsMode("fake");
      } else if (!landscape && fsModeRef.current !== "none") {
        void exitNativeFullscreen();
        setFsMode("none");
      }
    });
  }, []);

  useEffect(() => {
    if (fsMode === "none") return;
    document.documentElement.classList.add("bs-bichleg-fs-root");
    return () => document.documentElement.classList.remove("bs-bichleg-fs-root");
  }, [fsMode]);

  // Гар (PC-ийн нарийн цонх): ←/→ = ±10с, Space = тоглуулах/зогсоох
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.getAttribute("role") === "slider")
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekRelative(-BICHLEG_SKIP_SECONDS);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seekRelative(BICHLEG_SKIP_SECONDS);
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "Escape" && fsModeRef.current !== "none") {
        exitFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function ensureUnmuted() {
    if (muted) setMuted(false);
  }

  function handlePlayerStateChange(state: number) {
    if (state === YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      isPlayingRef.current = true;
      setEnded(false);
      setPausedAtSentence(false);
      return;
    }
    if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (activeVideo) {
        const player = playerRef.current;
        const t = (player && safePlayerCurrentTime(player)) ?? currentTimeRef.current;
        const d = (player && safePlayerDuration(player)) ?? duration;
        if (state === YT.PlayerState.ENDED) {
          setEnded(true);
          setLoopIdx(null);
          loopIdxRef.current = null;
          // Дуусгасан — дараа нь эхнээс
          clearResumePosition(activeVideo.id);
          void enqueueFlush(activeVideo, Math.max(t, d), d);
        } else {
          writeResumeNow(activeVideo, t, d);
          void enqueueFlush(activeVideo, t, d);
        }
      }
    }
  }

  function resolvePlayerDuration(player: YtPlayer): number {
    const fromPlayer = safePlayerDuration(player);
    if (fromPlayer != null && fromPlayer > 0) return fromPlayer;
    if (duration > 0) return duration;
    if (activeVideo?.duration_sec) return Number(activeVideo.duration_sec);
    return 0;
  }

  function seekToTime(targetSec: number, showSkipLabel?: string) {
    ensureUnmuted();
    autoPausedIdxRef.current = null;
    setPausedAtSentence(false);
    runOnPlayer((player) => {
      const max = resolvePlayerDuration(player);
      const next = clampPlaybackTime(targetSec, max);
      player.seekTo(next, true);
      currentTimeRef.current = next;
      setCurrentTime(next);
      if (max > 0) setDuration(max);
      lastActiveIdxRef.current =
        findActiveSubtitle(subsRef.current, next, offsetRef.current)?.idx ?? null;
    });
    if (showSkipLabel) setSkipOverlay(showSkipLabel);
  }

  function seekRelative(deltaSec: number) {
    const current = (() => {
      const player = playerRef.current;
      return (player && safePlayerCurrentTime(player)) ?? currentTimeRef.current;
    })();
    seekToTime(
      current + deltaSec,
      deltaSec < 0
        ? `-${BICHLEG_SKIP_SECONDS}${tr(locale, "с")}`
        : `+${BICHLEG_SKIP_SECONDS}${tr(locale, "с")}`
    );
  }

  function togglePlayPause() {
    ensureUnmuted();
    if (isPlayingRef.current) pausePlayback();
    else resumePlayback();
  }

  function seekToSubtitle(sub: VideoSubtitleRow) {
    seekToTime(subtitlePlayerSeekSec(sub, totalSubtitleOffset));
  }

  function goPrevSentence() {
    const t = currentTimeRef.current;
    const target = prevSentenceSeekSec(activeSubtitles, activeIdx, t, totalSubtitleOffset);
    if (target == null) return;
    if (loopIdx != null) {
      const sub = findActiveSubtitle(activeSubtitles, target + 0.01, totalSubtitleOffset);
      setLoopIdx(sub?.idx ?? null);
      loopIdxRef.current = sub?.idx ?? null;
    }
    seekToTime(target);
    runOnPlayer((p) => p.playVideo());
  }

  function goNextSentence() {
    const t = currentTimeRef.current;
    const target = nextSentenceSeekSec(activeSubtitles, activeIdx, t, totalSubtitleOffset);
    if (target == null) return;
    if (loopIdx != null) {
      const sub = findActiveSubtitle(activeSubtitles, target + 0.01, totalSubtitleOffset);
      setLoopIdx(sub?.idx ?? null);
      loopIdxRef.current = sub?.idx ?? null;
    }
    seekToTime(target);
    runOnPlayer((p) => p.playVideo());
  }

  function toggleLoop() {
    if (loopIdx != null) {
      setLoopIdx(null);
      loopIdxRef.current = null;
      return;
    }
    const sub =
      activeSubtitle ??
      activeSubtitles.find(
        (s) => s.start_sec + totalSubtitleOffset > currentTimeRef.current
      ) ??
      null;
    if (!sub) return;
    ensureUnmuted();
    setLoopIdx(sub.idx);
    loopIdxRef.current = sub.idx;
    setPausedAtSentence(false);
    if (!activeSubtitle) seekToTime(subtitlePlayerSeekSec(sub, totalSubtitleOffset));
    runOnPlayer((p) => p.playVideo());
  }

  function cycleUserSubtitleOffset() {
    if (!activeVideo) return;
    const next = nextUserSubtitleOffset(userSubtitleOffset);
    setUserSubtitleOffset(next);
    writeUserSubtitleOffset(activeVideo.id, next);
  }

  function cycleSpeed() {
    setPreferredSpeed((current) => {
      const next = nextBichlegSpeed(current);
      writePreferredSpeed(next);
      return next;
    });
  }

  function cycleHanziSize() {
    setHanziSize((cur) => {
      const next = nextHanziSize(cur);
      writeHanziSize(next);
      return next;
    });
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

  function resumePlayback() {
    setPausedAtSentence(false);
    runOnPlayer((player) => player.playVideo());
  }

  function pausePlayback() {
    runOnPlayer((player) => player.pauseVideo());
  }

  // --- Хэвтээ шудрах (видео дээр) ---
  function handleScrubStart() {
    const player = playerRef.current;
    const t = (player && safePlayerCurrentTime(player)) ?? currentTimeRef.current;
    scrubStartSecRef.current = t;
    scrubPreviewRef.current = t;
    setScrubPreviewSec(t);
  }

  function handleScrubMove(dxPx: number) {
    const max = durationRef.current > 0 ? durationRef.current : duration;
    const next = clampPlaybackTime(
      scrubStartSecRef.current + dxPx * BICHLEG_SWIPE_SEC_PER_PX,
      max
    );
    scrubPreviewRef.current = next;
    setScrubPreviewSec(next);
  }

  function handleScrubEnd(commit: boolean) {
    const target = scrubPreviewRef.current;
    scrubPreviewRef.current = null;
    setScrubPreviewSec(null);
    if (commit && target != null) seekToTime(target);
  }

  // --- Бүтэн дэлгэц ---
  async function enterFullscreen() {
    const el = shellRef.current;
    if (el && (await requestNativeFullscreen(el))) {
      setFsMode("native");
      return;
    }
    setFsMode("fake");
  }

  function exitFullscreen() {
    void exitNativeFullscreen();
    setFsMode("none");
  }

  function handleWordPick(word: SubtitleWord) {
    if (!activeVideo) return;
    pausePlayback();
    setPickedSlangNote(null);
    setSlangSubtitleIdx(null);
    setWordStatus(null);
    setSaveState("idle");
    setPickedWord({ ...word, sourceVideoId: activeVideo.id });
  }

  function handleSlangOpen(note: SubtitleSlangNote) {
    pausePlayback();
    setPickedWord(null);
    setWordStatus(null);
    setPickedSlangNote(note);
    setSlangSubtitleIdx(activeSubtitle?.idx ?? null);
  }

  function handleSlangClose() {
    setPickedSlangNote(null);
    setSlangSubtitleIdx(null);
    resumePlayback();
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
    setSaveState("idle");
    if (!ended) resumePlayback();
  }

  useEffect(() => {
    if (!pickedSlangNote || slangSubtitleIdx == null) return;
    if (activeSubtitle?.idx !== slangSubtitleIdx) {
      setPickedSlangNote(null);
      setSlangSubtitleIdx(null);
      resumePlayback();
    }
  }, [activeSubtitle?.idx, pickedSlangNote, slangSubtitleIdx]);

  async function handleSaveWord() {
    if (!pickedWord || wordStatus?.inSrs || saveState !== "idle") return;
    const word = pickedWord;
    setSaveState("saving");
    const result = await saveWordFromVideo({
      zh: word.zh,
      pinyin: word.pinyin,
      mn: word.mn,
      sourceVideoId: word.sourceVideoId,
    });
    if (result.ok) {
      if (result.isFunctionWord) {
        setToast(tr(locale, "Дүрмийн үг тул давталтад оруулахгүй"));
      } else if (result.alreadyInSrs || (result.linkedToSrs && result.inCatalog)) {
        setToast(tr(locale, "Давталтад нэмэгдсэн ✓"));
      } else if (result.inCatalog === false) {
        setToast(tr(locale, "Толь бичигт байхгүй — зөвхөн миний үгсэд хадгаллаа"));
      } else if (result.duplicate) {
        setToast(tr(locale, "Аль хэдийн хадгалсан"));
      } else if (result.linkedToSrs) {
        setToast(tr(locale, "Давталтад нэмлээ ✓"));
      } else {
        setToast(tr(locale, "Хадгаллаа ✓"));
      }
      if (!result.isFunctionWord) {
        setSavedThisEpisode((prev) => {
          const list = prev[word.sourceVideoId] ?? [];
          if (list.includes(word.zh)) return prev;
          return { ...prev, [word.sourceVideoId]: [...list, word.zh] };
        });
      }
      setSaveState("done");
      setTimeout(() => {
        setPickedWord((cur) => (cur === word ? null : cur));
        setWordStatus(null);
        setSaveState("idle");
        if (!ended) resumePlayback();
      }, SAVE_DONE_CLOSE_MS);
    } else {
      setSaveState("idle");
      if (result.error) setToast(result.error);
    }
  }

  function revealSubtitle(idx: number) {
    setRevealedIdx((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }

  function renderZh(sub: VideoSubtitleRow) {
    const hidden = listenMode && !revealedIdx.has(sub.idx);
    if (hidden) {
      const len = Math.min(14, Math.max(4, (sub.zh ?? "").replace(/\s/g, "").length));
      return (
        <button
          type="button"
          className="bs-bl-zh bs-bl-zh--hidden hanzi"
          translate="no"
          aria-label={tr(locale, "Дарж харах")}
          onClick={(event) => {
            event.stopPropagation();
            revealSubtitle(sub.idx);
          }}
        >
          <span className="bs-bl-zh-mask" aria-hidden>
            {"●".repeat(len)}
          </span>
          <span className="bs-bl-zh-mask-hint">👁 {tr(locale, "Дарж харах")}</span>
        </button>
      );
    }
    const words = sub.words?.length ? sub.words : [{ zh: sub.zh ?? "" }];
    return (
      <p className="bs-bl-zh hanzi" translate="no">
        {words.map((w, i) => (
          <span key={`${sub.idx}-${i}`}>
            <button
              type="button"
              className={`bs-bl-word ${w.key ? "bs-bl-word--key" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                handleWordPick(w);
              }}
            >
              {w.zh}
            </button>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </p>
    );
  }

  if (!videos.length) {
    return (
      <AppShell activeTab="clips" mainClassName={SHELL_MAIN_NARROW}>
        <Link
          href={backHref}
          className="mb-4 inline-flex text-sm font-bold text-[var(--app-muted)] hover:text-emerald-600"
        >
          {tr(locale, "← Буцах")}
        </Link>
        <div className="bs-bichleg-empty relative min-h-[50vh]">
          <p className="text-base font-bold">
            {feedTitle
              ? `${feedTitle} — ${tr(locale, "бичлэг байхгүй")}`
              : tr(locale, "Бичлэг олдсонгүй")}
          </p>
          <p className="mt-2 text-sm text-[var(--bs-muted)]">
            {tr(locale, "Өөр цуврал сонгоод дахин оролдоно уу.")}
          </p>
          <Link href={backHref} className="bs-bichleg-back-link mt-4">
            {tr(locale, "← Цуврал сонгох")}
          </Link>
        </div>
      </AppShell>
    );
  }

  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const activeWatchedSec = activeVideo
    ? Math.max(
        peakWatchedRef.current[activeVideo.id] ?? 0,
        progressByVideoId[activeVideo.id]?.watched_sec ?? 0
      )
    : 0;
  const savedCount = activeVideo ? (savedThisEpisode[activeVideo.id]?.length ?? 0) : 0;
  const isFs = fsMode !== "none";
  const hasSubs = activeSubtitles.length > 0;

  return (
    <AppShell activeTab="clips" showBottomNav={false} immersive>
      <div
        className={`bs-bichleg-shell${isFs ? " bs-bichleg-shell--fs" : ""}`}
        ref={shellRef}
        data-hanzi={hanziSize}
      >
        {isFs ? (
          <button
            type="button"
            className="bs-bichleg-back bs-bichleg-fs-exit"
            aria-label={tr(locale, "Бүтэн дэлгэцээс гарах")}
            onClick={exitFullscreen}
          >
            ✕
          </button>
        ) : (
          <Link
            href={backHref}
            className="bs-bichleg-back"
            aria-label={tr(locale, "Буцах")}
          >
            ←
          </Link>
        )}

        {resumeChip ? (
          <div className="bs-bichleg-resume" role="status">
            <span className="bs-bichleg-resume-text">
              ⏮ {formatSubtitleClock(resumeChip.fromSec)}
              {tr(locale, "-өөс үргэлжилж байна")}
            </span>
            <button
              type="button"
              className="bs-bichleg-resume-btn"
              onClick={() => {
                setResumeChip(null);
                seekToTime(0);
                runOnPlayer((p) => p.playVideo());
              }}
            >
              {tr(locale, "Эхнээс")}
            </button>
            <button
              type="button"
              className="bs-bichleg-resume-x"
              aria-label={tr(locale, "Хаах")}
              onClick={() => setResumeChip(null)}
            >
              ✕
            </button>
          </div>
        ) : null}

        <div className="bs-bichleg-feed" ref={feedRef}>
          {videos.map((video, index) => {
            const isActive = index === activeIndex;
            const completed = Boolean(progressByVideoId[video.id]?.completed);
            const seriesBadgeMn = formatSeriesEpisodeBadge(null, video.episode_no, {
              completed,
            });
            const seriesBadge =
              locale === "zh"
                ? (seriesBadgeMn?.replace(/(\d+)-р анги/, "第$1集") ?? null)
                : seriesBadgeMn;
            const videoLayout =
              layoutByYoutubeId[video.youtube_id] ?? "portrait";
            return (
              <section
                key={video.id}
                className={`bs-bichleg-slide${
                  videoLayout === "landscape"
                    ? " bs-bichleg-slide--landscape"
                    : ""
                }`}
                data-slide-index={index}
              >
                <div className="bs-bichleg-player-wrap" role="presentation">
                  {isActive ? (
                    <BichlegYouTubePlayer
                      key={video.id}
                      youtubeId={video.youtube_id}
                      onPlayerChange={handlePlayerChange}
                      onReady={handlePlayerReady}
                      onStateChange={handlePlayerStateChange}
                    />
                  ) : (
                    <div className="bs-bichleg-player-placeholder" />
                  )}
                  {isActive ? (
                    <>
                      <BichlegPlayerTouchLayer
                        onDoubleTapLeft={() =>
                          seekRelative(-BICHLEG_SKIP_SECONDS)
                        }
                        onDoubleTapRight={() =>
                          seekRelative(BICHLEG_SKIP_SECONDS)
                        }
                        onSingleTapCenter={togglePlayPause}
                        onScrubStart={handleScrubStart}
                        onScrubMove={handleScrubMove}
                        onScrubEnd={handleScrubEnd}
                      />
                      {skipOverlay ? (
                        <div className="bs-bichleg-skip-overlay">{skipOverlay}</div>
                      ) : null}
                      {scrubPreviewSec != null ? (
                        <div className="bs-bichleg-skip-overlay bs-bichleg-skip-overlay--scrub">
                          {formatSubtitleClock(scrubPreviewSec)}
                        </div>
                      ) : null}
                      <BichlegPlayerTransport
                        isPlaying={isPlaying}
                        onRewind={() => seekRelative(-BICHLEG_SKIP_SECONDS)}
                        onTogglePlay={togglePlayPause}
                        onForward={() => seekRelative(BICHLEG_SKIP_SECONDS)}
                        onPrevSentence={hasSubs ? goPrevSentence : undefined}
                        onNextSentence={hasSubs ? goNextSentence : undefined}
                      />
                      {loopIdx != null ? (
                        <button
                          type="button"
                          className="bs-bichleg-state-badge bs-bichleg-state-badge--loop"
                          onClick={toggleLoop}
                        >
                          🔁 {tr(locale, "Энэ өгүүлбэрийг давтаж байна")} · ✕
                        </button>
                      ) : pausedAtSentence ? (
                        <button
                          type="button"
                          className="bs-bichleg-state-badge bs-bichleg-state-badge--pause"
                          onClick={resumePlayback}
                        >
                          ⏸ {tr(locale, "Өгүүлбэр дууслаа — ▶ дараагийн")}
                        </button>
                      ) : null}
                      {ended && !endCardDismissed ? (
                        <div className="bs-bichleg-endcard" role="dialog">
                          <button
                            type="button"
                            className="bs-bichleg-endcard-x"
                            aria-label={tr(locale, "Хаах")}
                            onClick={() => setEndCardDismissed(true)}
                          >
                            ✕
                          </button>
                          <p className="bs-bichleg-endcard-title">
                            🏁 {tr(locale, "Анги дууслаа")}
                          </p>
                          {savedCount > 0 ? (
                            <Link href="/review/words" className="bs-bichleg-endcard-cta">
                              {tr(locale, "Энэ ангиас")} {savedCount} {tr(locale, "шинэ үг")} —{" "}
                              {tr(locale, "картаар давтах")} →
                            </Link>
                          ) : keyWords.length > 0 ? (
                            <button
                              type="button"
                              className="bs-bichleg-endcard-cta"
                              onClick={() => {
                                setEndCardDismissed(true);
                                setShowKeys(true);
                              }}
                            >
                              {keyWords.length} {tr(locale, "түлхүүр үг — харах")} →
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="bs-bichleg-endcard-secondary"
                            onClick={() => {
                              setEndCardDismissed(true);
                              seekToTime(0);
                              runOnPlayer((p) => p.playVideo());
                            }}
                          >
                            ↻ {tr(locale, "Дахин үзэх")}
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  <div
                    className="bs-bichleg-progress"
                    style={{ width: `${isActive ? progressPct : 0}%` }}
                  />
                  {isActive && seriesBadge ? (
                    <p className="bs-bichleg-series-badge">{seriesBadge}</p>
                  ) : null}
                </div>

                {isActive && activeSubtitle ? (
                  <div className="bs-bichleg-subs">
                    <div className="bs-bichleg-subs-row">
                      <button
                        type="button"
                        className="bs-bichleg-subs-panel"
                        aria-label={tr(locale, "Энэ мөрийн эхнээс сонсох")}
                        onClick={() => seekToSubtitle(activeSubtitle)}
                      >
                        <span className="bs-bl-time-badge">
                          {formatSubtitleClock(activeSubtitle.start_sec)}
                        </span>
                        {activeSubtitle.speaker ? (
                          <p className="bs-bl-speaker" translate="no">{activeSubtitle.speaker}</p>
                        ) : null}
                        {showPinyin && activeSubtitle.pinyin && !(listenMode && !revealedIdx.has(activeSubtitle.idx)) ? (
                          <p className="bs-bl-pinyin" translate="no">{activeSubtitle.pinyin}</p>
                        ) : null}
                        {activeSubtitle.zh ? renderZh(activeSubtitle) : null}
                        {showMn && activeSubtitle.mn ? (
                          <p className="bs-bl-mn" translate="no">{activeSubtitle.mn}</p>
                        ) : null}
                      </button>
                      {activeSubtitle.slang_note ? (
                        <button
                          type="button"
                          className="bs-bl-slang-badge"
                          aria-label={tr(locale, "Залуусын хэллэг")}
                          onClick={() => handleSlangOpen(activeSubtitle.slang_note!)}
                        >
                          💬
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {isActive ? (
                  <div className="bs-bichleg-seekwrap">
                    <BichlegSeekBar
                      currentTime={currentTime}
                      duration={duration}
                      watchedSec={activeWatchedSec}
                      subtitles={activeSubtitles}
                      totalOffsetSec={totalSubtitleOffset}
                      previewSec={scrubPreviewSec}
                      onSeek={(sec) => seekToTime(sec)}
                      keyStepSec={BICHLEG_SKIP_SECONDS}
                    />
                  </div>
                ) : null}

                {isActive ? (
                  <div className="bs-bichleg-actions">
                    <button
                      type="button"
                      className={`bs-bichleg-action ${liked[video.id] ? "bs-bichleg-action--on" : ""}`}
                      aria-label={tr(locale, "Дуртай")}
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
                      aria-label={tr(locale, "Хадгалах")}
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
                      aria-label={tr(locale, "Түлхүүр үгс")}
                      onClick={() => setShowKeys(true)}
                    >
                      <BichlegIcon name="book" className="bs-bichleg-action-icon" />
                    </button>
                    {activeSubtitle?.zh ? (
                      <button
                        type="button"
                        className="bs-bichleg-action"
                        aria-label={tr(locale, "Дуудлага шалгах")}
                        onClick={() => {
                          pausePlayback();
                          setPronLine({ zh: activeSubtitle.zh ?? "", pinyin: activeSubtitle.pinyin ?? null });
                        }}
                      >
                        <span className="bs-bichleg-action-icon" aria-hidden>🎤</span>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="bs-bichleg-action"
                      aria-label={tr(locale, "Дахин эхлэх")}
                      onClick={() => {
                        setEndCardDismissed(true);
                        seekToTime(0);
                        runOnPlayer((player) => player.playVideo());
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

        <div className="bs-bichleg-controls">
          {muted ? (
            <button
              type="button"
              className="bs-bichleg-ctrl-btn bs-bichleg-ctrl-btn--warn"
              onClick={() => setMuted(false)}
            >
              {tr(locale, "Дууг асаах")}
            </button>
          ) : null}
          <button
            type="button"
            className={`bs-bichleg-ctrl-btn ${showPinyin ? "bs-bichleg-ctrl-btn--on" : ""}`}
            aria-pressed={showPinyin}
            aria-label={tr(locale, "Пиньинь харуулах")}
            onClick={() => setShowPinyin((on) => !on)}
          >
            拼
          </button>
          <button
            type="button"
            className={`bs-bichleg-ctrl-btn ${showMn ? "bs-bichleg-ctrl-btn--on" : ""}`}
            aria-pressed={showMn}
            aria-label={tr(locale, "Монгол орчуулга харуулах")}
            onClick={() => setShowMn((on) => !on)}
          >
            MN
          </button>
          <button
            type="button"
            className={`bs-bichleg-ctrl-btn ${Math.abs(displaySpeed - 1) > 0.001 ? "bs-bichleg-ctrl-btn--speed" : ""}`}
            aria-label={tr(locale, "Хурд")}
            onClick={cycleSpeed}
          >
            {formatPlaybackRateLabel(displaySpeed)}
          </button>
          <button
            type="button"
            className={`bs-bichleg-ctrl-btn ${loopIdx != null ? "bs-bichleg-ctrl-btn--on" : ""}`}
            aria-pressed={loopIdx != null}
            aria-label={tr(locale, "Давталт")}
            title={tr(locale, "Давталт")}
            disabled={!hasSubs}
            onClick={toggleLoop}
          >
            🔁
          </button>
          <button
            type="button"
            className={`bs-bichleg-ctrl-btn ${autoPause ? "bs-bichleg-ctrl-btn--on" : ""}`}
            aria-pressed={autoPause}
            disabled={!hasSubs}
            onClick={() => {
              setAutoPause((v) => !v);
              setPausedAtSentence(false);
            }}
          >
            ⏸ {tr(locale, "Автомат зогсоох")}
          </button>
          <button
            type="button"
            className={`bs-bichleg-ctrl-btn ${listenMode ? "bs-bichleg-ctrl-btn--on" : ""}`}
            aria-pressed={listenMode}
            onClick={() => {
              setListenMode((v) => !v);
              setRevealedIdx(new Set());
            }}
          >
            👂 {tr(locale, "Хадмалгүй")}
          </button>
          <button
            type="button"
            className="bs-bichleg-ctrl-btn bs-bichleg-ctrl-btn--size"
            aria-label={tr(locale, "Ханзын хэмжээ")}
            title={tr(locale, "Ханзын хэмжээ")}
            onClick={cycleHanziSize}
          >
            {formatHanziSizeLabel(hanziSize)}
          </button>
          <button
            type="button"
            className="bs-bichleg-ctrl-btn"
            disabled={!hasSubs}
            onClick={() => {
              pausePlayback();
              setShowTranscript(true);
            }}
          >
            ☰ {tr(locale, "Бүх өгүүлбэр")}
          </button>
          <button
            type="button"
            className={`bs-bichleg-ctrl-btn ${isFs ? "bs-bichleg-ctrl-btn--on" : ""}`}
            aria-label={tr(locale, isFs ? "Бүтэн дэлгэцээс гарах" : "Бүтэн дэлгэц")}
            aria-pressed={isFs}
            onClick={() => (isFs ? exitFullscreen() : void enterFullscreen())}
          >
            ⛶
          </button>
          <button
            type="button"
            className={`bs-bichleg-ctrl-btn bs-bichleg-ctrl-btn--offset ${userSubtitleOffset !== 0 ? "bs-bichleg-ctrl-btn--on" : ""}`}
            aria-label={tr(locale, "Хадмалын цаг")}
            title={tr(locale, "Хадмалын цаг")}
            onClick={cycleUserSubtitleOffset}
          >
            ⏱ {formatUserSubtitleOffsetLabel(userSubtitleOffset)}
          </button>
        </div>

        {!isFs ? (
          <div className="absolute inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
            <BottomNavChrome active="clips" />
          </div>
        ) : null}

        {pickedSlangNote ? (
          <BichlegSlangSheet note={pickedSlangNote} onClose={handleSlangClose} />
        ) : null}

        {showTranscript ? (
          <BichlegTranscriptSheet
            subtitles={activeSubtitles}
            activeIdx={activeIdx}
            onPick={(sub) => {
              setShowTranscript(false);
              revealSubtitle(sub.idx);
              seekToSubtitle(sub);
              runOnPlayer((p) => p.playVideo());
            }}
            onClose={() => {
              setShowTranscript(false);
              resumePlayback();
            }}
          />
        ) : null}

        {pronLine ? (
          <div className="bs-bichleg-sheet-backdrop" onClick={() => setPronLine(null)}>
            <div className="bs-bichleg-sheet" onClick={(e) => e.stopPropagation()}>
              <p className="bs-bichleg-sheet-title">🎤 {tr(locale, "Дуудлага шалгах")}</p>
              <p className="bs-bichleg-sheet-zh hanzi" translate="no">{pronLine.zh}</p>
              {pronLine.pinyin ? (
                <p className="bs-bichleg-sheet-py" translate="no">{pronLine.pinyin}</p>
              ) : null}
              <PronunciationCheck text={pronLine.zh} pinyin={pronLine.pinyin} />
              <button
                type="button"
                className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--full"
                style={{ marginTop: 12 }}
                onClick={() => setPronLine(null)}
              >
                {tr(locale, "▶ Үргэлжлүүлэх")}
              </button>
            </div>
          </div>
        ) : null}

        {pickedWord ? (
          <div className="bs-bichleg-sheet-backdrop" onClick={handleContinue}>
            <div
              className="bs-bichleg-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="bs-bichleg-sheet-zh hanzi" translate="no">{pickedWord.zh}</p>
              {pickedWord.pinyin ? (
                <p className="bs-bichleg-sheet-py" translate="no">{pickedWord.pinyin}</p>
              ) : null}
              {pickedWord.mn ? (
                <p className="bs-bichleg-sheet-mn" translate="no">{pickedWord.mn}</p>
              ) : null}
              {wordStatus?.saved &&
              !wordStatus.inCatalog &&
              !wordStatus.inSrs ? (
                <p className="bs-bichleg-sheet-note">
                  {tr(locale, "Толь бичигт байхгүй — зөвхөн миний үгсэд хадгалагдлаа")}
                </p>
              ) : null}
              <div className="bs-bichleg-sheet-actions">
                <button
                  type="button"
                  className="bs-bichleg-sheet-btn"
                  onClick={handleContinue}
                >
                  {tr(locale, "▶ Үргэлжлүүлэх")}
                </button>
                {saveState === "done" ? (
                  <button
                    type="button"
                    className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--done bs-bichleg-sheet-btn--pop"
                    disabled
                  >
                    {tr(locale, "Нэмэгдсэн ✓")}
                  </button>
                ) : saveState === "saving" ? (
                  <button
                    type="button"
                    className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--primary"
                    disabled
                  >
                    {tr(locale, "Нэмж байна…")}
                  </button>
                ) : wordStatus?.inSrs ? (
                  <button
                    type="button"
                    className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--done"
                    disabled
                  >
                    {tr(locale, "Давталтад нэмэгдсэн ✓")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`bs-bichleg-sheet-btn bs-bichleg-sheet-btn--primary${statusLoading ? " bs-bichleg-sheet-btn--dim" : ""}`}
                    onClick={() => void handleSaveWord()}
                  >
                    {tr(locale, "＋ Миний үгс")}
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
              <p className="bs-bichleg-sheet-title">{tr(locale, "Түлхүүр үгс")}</p>
              <ul className="bs-bichleg-key-list">
                {keyWords.length ? (
                  keyWords.map((w) => (
                    <li key={w.zh}>
                      <button
                        type="button"
                        className="bs-bichleg-key-item"
                        translate="no"
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
                  <li className="bs-bichleg-key-empty">
                    {tr(locale, "Түлхүүр үг байхгүй")}
                  </li>
                )}
              </ul>
            </div>
          </div>
        ) : null}

        {toast ? <div className="bs-bichleg-toast">{toast}</div> : null}
      </div>
    </AppShell>
  );
}
