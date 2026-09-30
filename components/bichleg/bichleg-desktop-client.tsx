"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { BichlegYouTubePlayer } from "@/components/bichleg/bichleg-youtube-player";
import { BichlegEpisodeQuiz } from "@/components/bichleg/bichleg-episode-quiz";
import { familiarityOf, fetchKnownWordSets, type KnownWordSets } from "@/lib/bichleg/known-words";
import {
  countSentenceCards,
  saveSentenceCard,
  savedSentenceIdxSet,
} from "@/lib/bichleg/sentence-cards";
import {
  formatEpisodeLabel,
  type SubtitleWord,
  type UserVideoProgress,
  type VideoRow,
  type VideoSubtitleRow,
} from "@/lib/bichleg/types";
import { upsertVideoWatchProgress } from "@/lib/supabase/video-progress-client";
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
  clampPlaybackTime,
  formatSubtitleClock,
} from "@/lib/bichleg/player-seek";
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
import "./bichleg-desktop.css";

type Props = {
  videos: VideoRow[];
  backHref: string;
  feedTitle?: string;
  progressByVideoId?: Record<string, UserVideoProgress>;
  initialActiveIndex?: number;
  /** Сервер дээр урьдчилан авсан хадмал (байвал client fetch хийхгүй). */
  initialSubtitles?: VideoSubtitleRow[];
};

/** Харах горим: Бүтэн (ханз+пиньинь+монгол) · Ханз (зөвхөн ханз) · Сонсгол (эхлээд нуугдана). */
type ViewMode = "full" | "zh" | "listen";

const WATCH_SAVE_INTERVAL_MS = 10_000;
const REPEAT_COUNT = 3;
const MAX_RECORD_MS = 12_000;

type PickedWord = SubtitleWord & { sourceVideoId: string };

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

function Icon({ name }: { name: "play" | "pause" | "prev" | "next" | "loop" | "mic" | "stop" | "sound" | "back" | "bookmark" }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 18,
    height: 18,
    "aria-hidden": true,
  } as const;
  switch (name) {
    case "play":
      return <svg {...common} fill="currentColor"><path d="M7 4v16l13-8z" /></svg>;
    case "pause":
      return <svg {...common} fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>;
    case "prev":
      return <svg {...common} fill="currentColor"><path d="M6 6h2v12H6zM20 6v12l-10-6z" /></svg>;
    case "next":
      return <svg {...common} fill="currentColor"><path d="M16 6h2v12h-2zM4 6v12l10-6z" /></svg>;
    case "loop":
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12a8 8 0 0 1 14-5.3" /><path d="M18 3v4h-4" /><path d="M20 12a8 8 0 0 1-14 5.3" /><path d="M6 21v-4h4" /></svg>;
    case "mic":
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>;
    case "stop":
      return <svg {...common} fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>;
    case "sound":
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6" /></svg>;
    case "back":
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-6 6 6 6" /></svg>;
    case "bookmark":
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M6 4h12v17l-6-4-6 4z" /></svg>;
  }
}

/**
 * PC (≥920px) бичлэгийн хуудас: том тоглуулагч + хадмал жагсаалт + үгийн самбар.
 * Утасны TikTok маягийн feed (bichleg-feed-client.tsx) хэвээрээ — BichlegPlayerSwitch сонгоно.
 */
export function BichlegDesktopClient({
  videos,
  backHref,
  feedTitle,
  progressByVideoId: initialProgress = {},
  initialActiveIndex = 0,
  initialSubtitles,
}: Props) {
  const locale = useUiLocale();
  const activeVideo = videos[initialActiveIndex] ?? videos[0] ?? null;
  useActivityTracker("video", activeVideo?.id ?? null, Boolean(activeVideo));

  const playerRef = useRef<YtPlayer | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const peakRef = useRef(0);
  const lastSubIdxRef = useRef<number | null>(null);
  const suppressPauseRef = useRef(false);
  const repeatRef = useRef<{ idx: number; remaining: number } | null>(null);
  const currentTimeRef = useRef(0);

  const [subtitles, setSubtitles] = useState<VideoSubtitleRow[]>(initialSubtitles ?? []);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(Number(activeVideo?.duration_sec ?? 0));
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [preferredSpeed, setPreferredSpeed] = useState<BichlegPreferredSpeed>(1);
  const [displaySpeed, setDisplaySpeed] = useState(1);
  const [userSubtitleOffset, setUserSubtitleOffset] = useState<UserSubtitleOffsetOption>(0);
  const [videoLayout, setVideoLayout] = useState<BichlegVideoLayout>("landscape");
  const [viewMode, setViewMode] = useState<ViewMode>("full");
  const [showPinyin, setShowPinyin] = useState(true);
  const [sentencePause, setSentencePause] = useState(false);
  const [pausedAtSentence, setPausedAtSentence] = useState(false);
  const [repeatLeft, setRepeatLeft] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [pickedWord, setPickedWord] = useState<PickedWord | null>(null);
  const [wordStatus, setWordStatus] = useState<BichlegWordStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savedSentences, setSavedSentences] = useState<Set<number>>(() => new Set());
  const [sentenceCount, setSentenceCount] = useState(0);
  const [knownSets, setKnownSets] = useState<KnownWordSets | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [ended, setEnded] = useState(false);
  const [progress, setProgress] = useState<UserVideoProgress | null>(
    activeVideo ? (initialProgress[activeVideo.id] ?? null) : null
  );
  // Дуурайж хэлэх (shadowing)
  const [recState, setRecState] = useState<"idle" | "recording" | "ready">("idle");
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<number | null>(null);
  const recAudioRef = useRef<HTMLAudioElement | null>(null);

  const totalOffset = useMemo(
    () => (activeVideo ? totalSubtitleOffsetSec(activeVideo, userSubtitleOffset) : 0),
    [activeVideo, userSubtitleOffset]
  );
  const activeSubtitle = useMemo(
    () => findActiveSubtitle(subtitles, currentTime, totalOffset),
    [subtitles, currentTime, totalOffset]
  );
  const activeIdx = activeSubtitle?.idx ?? null;
  const activePos = useMemo(
    () => (activeSubtitle ? subtitles.findIndex((s) => s.idx === activeSubtitle.idx) : -1),
    [subtitles, activeSubtitle]
  );
  const keyWords = useMemo(() => collectKeyWords(subtitles), [subtitles]);
  const sentenceWords = useMemo(() => {
    if (!activeSubtitle?.words) return [];
    const seen = new Set<string>();
    return activeSubtitle.words.filter((w) => {
      if (!w.zh || seen.has(w.zh)) return false;
      if (!w.pinyin && !w.mn) return false;
      seen.add(w.zh);
      return true;
    });
  }, [activeSubtitle]);

  /* ---------- дата ачаалах ---------- */
  useEffect(() => {
    if (!activeVideo) return;
    let cancelled = false;
    if (!initialSubtitles?.length) {
      void fetchVideoSubtitlesClient(activeVideo.id).then((rows) => {
        if (!cancelled) setSubtitles(rows);
      });
    }
    void detectYouTubeVideoLayout(activeVideo.youtube_id).then((layout) => {
      if (!cancelled) setVideoLayout(layout);
    });
    setUserSubtitleOffset(readUserSubtitleOffset(activeVideo.id));
    setSavedSentences(savedSentenceIdxSet(activeVideo.id));
    setSentenceCount(countSentenceCards().total);
    peakRef.current = initialProgress[activeVideo.id]?.watched_sec ?? 0;
    return () => {
      cancelled = true;
    };
  }, [activeVideo?.id]);

  useEffect(() => {
    let cancelled = false;
    void fetchKnownWordSets().then((sets) => {
      if (!cancelled) setKnownSets(sets);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Хадгалсан үг → «сурч байгаа» болно. */
  const fam = (zh: string) => (savedWords.has(zh) ? "learning" : familiarityOf(zh, knownSets));
  const allWords = useMemo(() => {
    const seen = new Set<string>();
    const out: SubtitleWord[] = [];
    for (const sub of subtitles) for (const w of sub.words ?? []) {
      if (!w.zh || !w.mn || seen.has(w.zh)) continue;
      seen.add(w.zh);
      out.push(w);
    }
    return out;
  }, [subtitles]);
  const keyStats = useMemo(() => {
    let known = 0;
    for (const w of keyWords) if (fam(w.zh) === "known") known += 1;
    return { known, fresh: keyWords.length - known };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyWords, knownSets, savedWords]);

  /* ---------- тоглуулагч ---------- */
  const runOnPlayer = useCallback((fn: (player: YtPlayer) => void) => {
    const player = playerRef.current;
    if (!player) return;
    try {
      fn(player);
    } catch {
      /* player destroyed */
    }
  }, []);

  const handlePlayerChange = useCallback((player: YtPlayer | null) => {
    playerRef.current = player;
    if (!player) setPlayerReady(false);
  }, []);

  // ?t=SEC — өгүүлбэрийн картаас ирэхэд яг тэр цагаас эхлүүлнэ (нэг л удаа)
  const initialSeekRef = useRef<number | null>(null);
  if (initialSeekRef.current === null && typeof window !== "undefined") {
    const t = Number(new URLSearchParams(window.location.search).get("t"));
    initialSeekRef.current = Number.isFinite(t) && t > 0 ? t : -1;
  }

  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true);
    runOnPlayer((player) => {
      setDisplaySpeed(applyPlaybackRate(player, preferredSpeed));
      const d = safePlayerDuration(player);
      if (d != null && d > 0) setDuration(d);
      const t = initialSeekRef.current;
      if (t != null && t > 0) {
        initialSeekRef.current = -1;
        player.seekTo(t, true);
        currentTimeRef.current = t;
        setCurrentTime(t);
      }
    });
  }, [preferredSpeed, runOnPlayer]);

  useEffect(() => {
    if (!playerReady) return;
    runOnPlayer((player) => setDisplaySpeed(applyPlaybackRate(player, preferredSpeed)));
  }, [preferredSpeed, playerReady, runOnPlayer]);

  useEffect(() => {
    if (!playerReady) return;
    runOnPlayer((player) => (muted ? player.mute() : player.unMute()));
  }, [muted, playerReady, runOnPlayer]);

  function handlePlayerStateChange(state: number) {
    if (state === YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      setEnded(false);
    } else if (state === YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (state === YT.PlayerState.ENDED) {
      setIsPlaying(false);
      setEnded(true);
    }
  }

  // 150мс тутам цаг унших: хадмал, давталт, өгүүлбэр бүрд зогсох
  useEffect(() => {
    if (!playerReady) return;
    const tick = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const t = safePlayerCurrentTime(player);
      if (t == null) return;
      currentTimeRef.current = t;
      setCurrentTime(t);
      const d = safePlayerDuration(player);
      if (d != null && d > 0) setDuration(d);
      if (t > peakRef.current) peakRef.current = t;

      // Давтах ×N
      const rep = repeatRef.current;
      if (rep) {
        const sub = subtitles.find((s) => s.idx === rep.idx);
        if (sub && t >= sub.end_sec + totalOffset - 0.05) {
          if (rep.remaining > 1) {
            rep.remaining -= 1;
            setRepeatLeft(rep.remaining);
            suppressPauseRef.current = true;
            player.seekTo(subtitlePlayerSeekSec(sub, totalOffset), true);
          } else {
            repeatRef.current = null;
            setRepeatLeft(0);
          }
        }
      }
    }, 150);
    return () => clearInterval(tick);
  }, [playerReady, subtitles, totalOffset]);

  // Өгүүлбэр бүрд зогсох: идэвхтэй мөр солигдох үед өмнөх мөрийн төгсгөлд зогсооно
  useEffect(() => {
    const prev = lastSubIdxRef.current;
    lastSubIdxRef.current = activeIdx;
    if (!sentencePause || repeatRef.current) return;
    if (prev == null || prev === activeIdx) return;
    if (suppressPauseRef.current) {
      suppressPauseRef.current = false;
      return;
    }
    runOnPlayer((player) => {
      const prevSub = subtitles.find((s) => s.idx === prev);
      if (prevSub) player.seekTo(Math.max(0, prevSub.end_sec + totalOffset - 0.1), true);
      player.pauseVideo();
    });
    setPausedAtSentence(true);
  }, [activeIdx, sentencePause, subtitles, totalOffset, runOnPlayer]);

  // Идэвхтэй мөрийг жагсаалтад харагдуулах
  useEffect(() => {
    if (activeIdx == null || !transcriptRef.current) return;
    const el = transcriptRef.current.querySelector<HTMLElement>(`[data-sub-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  // Явц хадгалах
  useEffect(() => {
    if (!activeVideo || !playerReady) return;
    const flush = () => {
      const player = playerRef.current;
      const d = (player && safePlayerDuration(player)) || duration || Number(activeVideo.duration_sec ?? 0);
      void upsertVideoWatchProgress({
        videoId: activeVideo.id,
        watchedSec: peakRef.current,
        durationSec: d,
      }).then((r) => {
        if (r.ok && r.progress) setProgress(r.progress);
      });
    };
    const interval = setInterval(flush, WATCH_SAVE_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      flush();
    };
  }, [activeVideo?.id, playerReady]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- удирдлага ---------- */
  function ensureUnmuted() {
    if (muted) setMuted(false);
  }
  function play() {
    ensureUnmuted();
    setPausedAtSentence(false);
    runOnPlayer((p) => p.playVideo());
  }
  function pause() {
    runOnPlayer((p) => p.pauseVideo());
  }
  function togglePlay() {
    if (isPlaying) pause();
    else play();
  }
  function seekTo(sec: number, autoplay = true) {
    ensureUnmuted();
    repeatRef.current = null;
    setRepeatLeft(0);
    suppressPauseRef.current = true;
    setPausedAtSentence(false);
    runOnPlayer((player) => {
      const max = safePlayerDuration(player) || duration;
      const next = clampPlaybackTime(sec, max);
      player.seekTo(next, true);
      setCurrentTime(next);
      currentTimeRef.current = next;
      if (autoplay) player.playVideo();
    });
  }
  function seekRelative(delta: number) {
    seekTo(currentTimeRef.current + delta, isPlaying);
  }
  function goToSubtitle(sub: VideoSubtitleRow) {
    setRevealed((prev) => new Set(prev).add(sub.idx));
    seekTo(subtitlePlayerSeekSec(sub, totalOffset));
  }
  function goPrevSentence() {
    if (!subtitles.length) return;
    const pos = activePos >= 0 ? activePos : subtitles.findIndex((s) => s.start_sec + totalOffset > currentTimeRef.current);
    const cur = subtitles[Math.max(0, pos)];
    // Мөрийн эхнээс 1.2с илүү явсан бол мөрийн эхлэл рүү, үгүй бол өмнөх мөр
    if (cur && currentTimeRef.current - (cur.start_sec + totalOffset) > 1.2) {
      goToSubtitle(cur);
      return;
    }
    const prev = subtitles[Math.max(0, pos - 1)];
    if (prev) goToSubtitle(prev);
  }
  function goNextSentence() {
    if (!subtitles.length) return;
    const next =
      activePos >= 0
        ? subtitles[activePos + 1]
        : subtitles.find((s) => s.start_sec + totalOffset > currentTimeRef.current);
    if (next) goToSubtitle(next);
  }
  function repeatCurrent(times = REPEAT_COUNT) {
    const sub = activeSubtitle ?? subtitles[Math.max(0, activePos)];
    if (!sub) return;
    ensureUnmuted();
    repeatRef.current = { idx: sub.idx, remaining: times };
    setRepeatLeft(times);
    setPausedAtSentence(false);
    suppressPauseRef.current = true;
    runOnPlayer((player) => {
      player.seekTo(subtitlePlayerSeekSec(sub, totalOffset), true);
      player.playVideo();
    });
  }
  function cycleOffset() {
    if (!activeVideo) return;
    const next = nextUserSubtitleOffset(userSubtitleOffset);
    setUserSubtitleOffset(next);
    writeUserSubtitleOffset(activeVideo.id, next);
  }
  function cycleMode() {
    setViewMode((m) => (m === "full" ? "zh" : m === "zh" ? "listen" : "full"));
  }

  // Гарын товч
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          if (e.shiftKey) seekRelative(-BICHLEG_SKIP_SECONDS);
          else goPrevSentence();
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          if (e.shiftKey) seekRelative(BICHLEG_SKIP_SECONDS);
          else goNextSentence();
          break;
        case "r":
        case "R":
          repeatCurrent(1);
          break;
        case "l":
        case "L":
          repeatCurrent(REPEAT_COUNT);
          break;
        case "p":
        case "P":
          setSentencePause((v) => !v);
          break;
        case "s":
        case "S":
          cycleMode();
          break;
        case "b":
        case "B":
          handleSaveSentence();
          break;
        case "Escape":
          setPickedWord(null);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---------- үг ---------- */
  function handleWordPick(word: SubtitleWord) {
    if (!activeVideo || !word.zh) return;
    setWordStatus(null);
    setPickedWord({ ...word, sourceVideoId: activeVideo.id });
  }
  useEffect(() => {
    if (!pickedWord) return;
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

  async function handleSaveWord(word?: PickedWord) {
    const w = word ?? pickedWord;
    if (!w) return;
    const result = await saveWordFromVideo({
      zh: w.zh,
      pinyin: w.pinyin,
      mn: w.mn,
      sourceVideoId: w.sourceVideoId,
    });
    if (result.ok) {
      if (result.isFunctionWord) setToast(tr(locale, "Дүрмийн үг тул давталтад оруулахгүй"));
      else if (result.alreadyInSrs || (result.linkedToSrs && result.inCatalog)) setToast(tr(locale, "Давталтад нэмэгдсэн ✓"));
      else if (result.inCatalog === false) setToast(tr(locale, "Толь бичигт байхгүй — зөвхөн миний үгсэд хадгаллаа"));
      else if (result.duplicate) setToast(tr(locale, "Аль хэдийн хадгалсан"));
      else if (result.linkedToSrs) setToast(tr(locale, "Давталтад нэмлээ ✓"));
      else setToast(tr(locale, "Хадгаллаа ✓"));
      setSavedWords((prev) => new Set(prev).add(w.zh));
      if (!word) setWordStatus((s) => (s ? { ...s, inSrs: true, saved: true } : s));
    } else if (result.error) {
      setToast(result.error);
    }
  }

  /** Бүтэн өгүүлбэрийг цагтай нь өгүүлбэрийн карт болгон хадгална (SRS). */
  function handleSaveSentence(sub?: VideoSubtitleRow | null) {
    const target = sub ?? activeSubtitle;
    if (!activeVideo || !target || !target.zh) return;
    const res = saveSentenceCard({
      videoId: activeVideo.id,
      seriesId: activeVideo.series_id,
      videoTitle: activeVideo.title_mn ?? activeVideo.title_zh,
      idx: target.idx,
      startSec: target.start_sec,
      endSec: target.end_sec,
      zh: target.zh,
      pinyin: target.pinyin,
      mn: target.mn,
    });
    setSavedSentences((prev) => new Set(prev).add(target.idx));
    setSentenceCount(countSentenceCards().total);
    setToast(res.duplicate ? tr(locale, "Энэ өгүүлбэр аль хэдийн хадгалагдсан") : tr(locale, "Өгүүлбэр хадгаллаа ✓ — Давтах › Өгүүлбэрийн карт"));
  }

  /* ---------- дуурайж хэлэх ---------- */
  async function startRecording() {
    if (recState === "recording") {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recChunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) recChunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recChunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (recUrl) URL.revokeObjectURL(recUrl);
        setRecUrl(URL.createObjectURL(blob));
        setRecState("ready");
        if (recTimerRef.current) window.clearTimeout(recTimerRef.current);
      };
      recorderRef.current = rec;
      pause();
      rec.start();
      setRecState("recording");
      recTimerRef.current = window.setTimeout(() => rec.state === "recording" && rec.stop(), MAX_RECORD_MS);
    } catch {
      setToast(tr(locale, "Микрофон нээгдсэнгүй — зөвшөөрөл өгнө үү"));
    }
  }
  function playRecording() {
    if (!recUrl) return;
    if (!recAudioRef.current) recAudioRef.current = new Audio();
    recAudioRef.current.src = recUrl;
    void recAudioRef.current.play();
  }
  useEffect(() => {
    return () => {
      if (recUrl) URL.revokeObjectURL(recUrl);
    };
  }, [recUrl]);

  /* ---------- render helpers ---------- */
  const hidden = (idx: number) => viewMode === "listen" && !revealed.has(idx) && activePos >= 0 && idx >= (subtitles[activePos]?.idx ?? 0);
  const reveal = (idx: number) => setRevealed((prev) => new Set(prev).add(idx));

  function renderWords(sub: VideoSubtitleRow, big: boolean) {
    const words = sub.words?.length ? sub.words : [{ zh: sub.zh ?? "" }];
    return (
      <div className={`bs-bd-words${big ? " bs-bd-words--big" : ""}`} translate="no">
        {words.map((w, i) => (
          <button
            key={`${sub.idx}-${i}`}
            type="button"
            className={`bs-bd-word bs-bd-word--${fam(w.zh)}${w.key ? " bs-bd-word--key" : ""}${pickedWord?.zh === w.zh ? " bs-bd-word--on" : ""}`}
            onClick={() => handleWordPick(w)}
            title={w.mn ?? undefined}
          >
            {big && showPinyin && viewMode !== "zh" ? <small>{w.pinyin ?? " "}</small> : null}
            <b className="hanzi">{w.zh}</b>
          </button>
        ))}
      </div>
    );
  }

  if (!activeVideo) {
    return (
      <AppShell activeTab="clips" desktopWidth="narrow">
        <Link href={backHref} className="mb-4 inline-flex text-sm font-bold text-[var(--app-muted)]">
          {tr(locale, "← Буцах")}
        </Link>
        <p className="text-base font-bold">{tr(locale, "Бичлэг олдсонгүй")}</p>
      </AppShell>
    );
  }

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const episodeLabel = formatEpisodeLabel(activeVideo.episode_no);
  const title = activeVideo.title_mn ?? activeVideo.title_zh ?? feedTitle ?? "";
  const modeLabel: Record<ViewMode, string> = {
    full: tr(locale, "Бүтэн"),
    zh: tr(locale, "Ханз"),
    listen: tr(locale, "Сонсгол"),
  };

  return (
    <AppShell activeTab="clips" showBottomNav={false} immersive>
      <div className="bs-bd">
        <div className="bs-bd-main">
          {/* Толгой: буцах · цуврал · ангиуд */}
          <div className="bs-bd-crumbs">
            <Link href="/bichleg" className="bs-bd-crumb">{tr(locale, "Бичлэг")}</Link>
            <span className="bs-bd-crumb-sep">/</span>
            <Link href={backHref} className="bs-bd-crumb">{feedTitle ?? tr(locale, "Цуврал")}</Link>
            {episodeLabel ? (
              <>
                <span className="bs-bd-crumb-sep">/</span>
                <span className="bs-bd-crumb bs-bd-crumb--on">{episodeLabel}</span>
              </>
            ) : null}
            <span className="bs-bd-spacer" />
            {videos.length > 1 ? (
              <div className="bs-bd-episodes" aria-label={tr(locale, "Ангиуд")}>
                {videos.map((v, i) => {
                  const done = Boolean(initialProgress[v.id]?.completed) || (v.id === activeVideo.id && Boolean(progress?.completed));
                  return (
                    <Link
                      key={v.id}
                      href={`${backHref}/${encodeURIComponent(v.id)}`}
                      className={`bs-bd-ep${v.id === activeVideo.id ? " bs-bd-ep--on" : ""}${done ? " bs-bd-ep--done" : ""}`}
                      title={v.title_mn ?? v.title_zh ?? undefined}
                    >
                      {v.episode_no ?? i + 1}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Тоглуулагч */}
          <div className={`bs-bd-player${videoLayout === "portrait" ? " bs-bd-player--portrait" : ""}`}>
            <div className="bs-bd-player-box">
              <BichlegYouTubePlayer
                key={activeVideo.id}
                youtubeId={activeVideo.youtube_id}
                onPlayerChange={handlePlayerChange}
                onReady={handlePlayerReady}
                onStateChange={handlePlayerStateChange}
              />
            </div>
            <button
              type="button"
              className="bs-bd-cover"
              aria-label={isPlaying ? tr(locale, "Зогсоох") : tr(locale, "Тоглуулах")}
              onClick={togglePlay}
              onDoubleClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const left = e.clientX - rect.left < rect.width / 2;
                seekRelative(left ? -BICHLEG_SKIP_SECONDS : BICHLEG_SKIP_SECONDS);
              }}
            >
              {!isPlaying && playerReady ? (
                <span className="bs-bd-cover-play">
                  <Icon name="play" />
                </span>
              ) : null}
            </button>
            {muted ? (
              <button type="button" className="bs-bd-unmute" onClick={() => setMuted(false)}>
                {tr(locale, "Дууг асаах")}
              </button>
            ) : null}
            {ended && !quizOpen && keyWords.length >= 4 ? (
              <button type="button" className="bs-bd-paused" onClick={() => setQuizOpen(true)}>
                🏁 {tr(locale, "Ангийн шалгалт өгөх")} · {Math.min(10, keyWords.length)} {tr(locale, "асуулт")}
              </button>
            ) : null}
            {pausedAtSentence ? (
              <button type="button" className="bs-bd-paused" onClick={play}>
                {tr(locale, "Дараагийн өгүүлбэр")} <kbd>Space</kbd>
              </button>
            ) : null}
            {repeatLeft > 0 ? (
              <span className="bs-bd-repeat-badge">{tr(locale, "Давтаж байна")} · {repeatLeft}</span>
            ) : null}
            {activeSubtitle && viewMode !== "listen" ? (
              <div className="bs-bd-caption" translate="no">
                <p className="bs-bd-caption-zh hanzi">{activeSubtitle.zh}</p>
                {viewMode === "full" && activeSubtitle.mn ? (
                  <p className="bs-bd-caption-mn">{activeSubtitle.mn}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Удирдлага */}
          <div className="bs-bd-transport">
            <span className="bs-bd-time">{formatSubtitleClock(currentTime)}</span>
            <button
              type="button"
              className="bs-bd-bar"
              aria-label={tr(locale, "Цаг сонгох")}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                if (duration > 0) seekTo(ratio * duration, isPlaying);
              }}
            >
              <span className="bs-bd-bar-fill" style={{ width: `${progressPct}%` }} />
            </button>
            <span className="bs-bd-time">{formatSubtitleClock(duration)}</span>
            <button type="button" className="bs-bd-btn" onClick={goPrevSentence} title={`${tr(locale, "Өмнөх өгүүлбэр")} (←)`}>
              <Icon name="prev" />
            </button>
            <button type="button" className="bs-bd-btn bs-bd-btn--play" onClick={togglePlay} title="Space">
              <Icon name={isPlaying ? "pause" : "play"} />
            </button>
            <button type="button" className="bs-bd-btn" onClick={goNextSentence} title={`${tr(locale, "Дараагийн өгүүлбэр")} (→)`}>
              <Icon name="next" />
            </button>
            <button type="button" className="bs-bd-btn bs-bd-btn--text" onClick={() => seekRelative(-BICHLEG_SKIP_SECONDS)} title="Shift+←">
              −{BICHLEG_SKIP_SECONDS}{tr(locale, "с")}
            </button>
            <button type="button" className="bs-bd-btn bs-bd-btn--text" onClick={() => seekRelative(BICHLEG_SKIP_SECONDS)} title="Shift+→">
              +{BICHLEG_SKIP_SECONDS}{tr(locale, "с")}
            </button>
            <button
              type="button"
              className={`bs-bd-btn bs-bd-btn--text${Math.abs(displaySpeed - 1) > 0.001 ? " bs-bd-btn--on" : ""}`}
              onClick={() => setPreferredSpeed((c) => nextBichlegSpeed(c))}
              title={tr(locale, "Хурд")}
            >
              {formatPlaybackRateLabel(displaySpeed)}
            </button>
            <button
              type="button"
              className={`bs-bd-btn bs-bd-btn--text${repeatLeft > 0 ? " bs-bd-btn--on" : ""}`}
              onClick={() => repeatCurrent(REPEAT_COUNT)}
              title="L"
            >
              <Icon name="loop" /> {tr(locale, "Давтах")} ×{REPEAT_COUNT}
            </button>
            <button
              type="button"
              className={`bs-bd-btn bs-bd-btn--text${sentencePause ? " bs-bd-btn--on" : ""}`}
              onClick={() => setSentencePause((v) => !v)}
              aria-pressed={sentencePause}
              title="P"
            >
              {tr(locale, "Өгүүлбэр бүрд зогсох")}: {sentencePause ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              className={`bs-bd-btn bs-bd-btn--text${userSubtitleOffset !== 0 ? " bs-bd-btn--on" : ""}`}
              onClick={cycleOffset}
              title={tr(locale, "Хадмалын цаг")}
            >
              {tr(locale, "Хадмал")} {formatUserSubtitleOffsetLabel(userSubtitleOffset)}
            </button>
          </div>

          {/* Хадмал жагсаалт */}
          <div className="bs-bd-transcript" ref={transcriptRef}>
            <div className="bs-bd-transcript-head">
              <span className="bs-bd-sec">{tr(locale, "Хадмал")} · {subtitles.length}</span>
              <span className="bs-bd-hint">{tr(locale, "мөр дээр дарвал тэр хэсэг дахин тоглоно")} · <kbd>↑</kbd> <kbd>↓</kbd></span>
            </div>
            {subtitles.length === 0 ? (
              <p className="bs-bd-hint" style={{ padding: "12px" }}>{tr(locale, "Хадмал ачаалж байна…")}</p>
            ) : null}
            {subtitles.map((sub) => {
              const on = sub.idx === activeIdx;
              const blur = hidden(sub.idx);
              return (
                <div key={sub.id} className={`bs-bd-line${on ? " bs-bd-line--on" : ""}`} data-sub-idx={sub.idx}>
                  <button type="button" className="bs-bd-line-main" onClick={() => goToSubtitle(sub)}>
                    <span className="bs-bd-line-time">{formatSubtitleClock(sub.start_sec)}</span>
                    <span className={`bs-bd-line-text${blur ? " bs-bd-blur" : ""}`} translate="no">
                      {sub.speaker ? <span className="bs-bd-line-speaker">{sub.speaker}</span> : null}
                      <span className="bs-bd-line-zh hanzi">{sub.zh}</span>
                      {viewMode === "full" && showPinyin && sub.pinyin ? <span className="bs-bd-line-py">{sub.pinyin}</span> : null}
                      {viewMode === "full" && sub.mn ? <span className="bs-bd-line-mn">{sub.mn}</span> : null}
                    </span>
                  </button>
                  {blur ? (
                    <button type="button" className="bs-bd-line-btn" onClick={() => reveal(sub.idx)} title={tr(locale, "Харах")}>
                      👁
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={`bs-bd-line-btn${savedSentences.has(sub.idx) ? " bs-bd-line-btn--on" : ""}`}
                    title={savedSentences.has(sub.idx) ? tr(locale, "Хадгалсан өгүүлбэр") : tr(locale, "Өгүүлбэр хадгалах")}
                    onClick={() => handleSaveSentence(sub)}
                  >
                    <Icon name="bookmark" />
                  </button>
                  <button
                    type="button"
                    className="bs-bd-line-btn"
                    title={`${tr(locale, "Давтах")} ×${REPEAT_COUNT}`}
                    onClick={() => {
                      goToSubtitle(sub);
                      window.setTimeout(() => repeatCurrent(REPEAT_COUNT), 250);
                    }}
                  >
                    <Icon name="loop" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Баруун самбар */}
        <aside className="bs-bd-side">
          <div className="bs-bd-side-head">
            <div>
              <h1 className="bs-bd-title" translate="no">{title}</h1>
              <p className="bs-bd-sub">
                {episodeLabel ? `${episodeLabel} · ` : ""}
                {duration > 0 ? `${formatSubtitleClock(duration)} · ` : ""}
                {keyWords.length} {tr(locale, "түлхүүр үг")}
                {keyWords.length > 0 ? ` · ${keyStats.fresh} ${tr(locale, "шинэ")} · ${keyStats.known} ${tr(locale, "мэдэх")}` : ""}
                {progress?.completed ? ` · ${tr(locale, "үзсэн")} ✓` : ""}
              </p>
            </div>
            <div className="bs-bd-seg" role="group" aria-label={tr(locale, "Харах горим")}>
              {(["full", "zh", "listen"] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={viewMode === m ? "bs-on" : ""}
                  onClick={() => setViewMode(m)}
                >
                  {modeLabel[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Идэвхтэй өгүүлбэр */}
          <div className="bs-bd-card bs-bd-card--sentence">
            {activeSubtitle ? (
              <>
                <div className="bs-bd-card-top">
                  <span className="bs-bd-speaker">{activeSubtitle.speaker ?? formatSubtitleClock(activeSubtitle.start_sec)}</span>
                  <span className="bs-bd-hint bs-bd-legend">
                    <i className="bs-bd-dot bs-bd-dot--known" /> {tr(locale, "мэдэх")}
                    <i className="bs-bd-dot bs-bd-dot--learning" /> {tr(locale, "сурч байгаа")}
                    <i className="bs-bd-dot bs-bd-dot--key" /> {tr(locale, "шинэ")}
                    <button type="button" className={`bs-bd-chip${showPinyin ? " bs-bd-chip--on" : ""}`} onClick={() => setShowPinyin((v) => !v)}>
                      {tr(locale, "Пиньинь")}
                    </button>
                  </span>
                </div>
                {hidden(activeSubtitle.idx) ? (
                  <div className="bs-bd-listen">
                    <p>{tr(locale, "Сонсоод таа — дараа нь харна")}</p>
                    <button type="button" className="bs-bd-chip bs-bd-chip--on" onClick={() => reveal(activeSubtitle.idx)}>
                      {tr(locale, "Харах")}
                    </button>
                  </div>
                ) : (
                  <>
                    {renderWords(activeSubtitle, true)}
                    {viewMode === "full" && activeSubtitle.mn ? (
                      <p className="bs-bd-mn" translate="no">{activeSubtitle.mn}</p>
                    ) : null}
                  </>
                )}
                <div className="bs-bd-tools">
                  <button type="button" className="bs-bd-chip" onClick={() => repeatCurrent(1)} title="R">
                    <Icon name="sound" /> {tr(locale, "Дахин сонс")}
                  </button>
                  <button
                    type="button"
                    className={`bs-bd-chip${recState === "recording" ? " bs-bd-chip--rec" : ""}`}
                    onClick={() => void startRecording()}
                  >
                    <Icon name={recState === "recording" ? "stop" : "mic"} />{" "}
                    {recState === "recording" ? tr(locale, "Зогсоох") : tr(locale, "Дуурайж хэлэх")}
                  </button>
                  {recState === "ready" ? (
                    <button type="button" className="bs-bd-chip bs-bd-chip--on" onClick={playRecording}>
                      <Icon name="play" /> {tr(locale, "Миний дуу")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={`bs-bd-chip${savedSentences.has(activeSubtitle.idx) ? " bs-bd-chip--on" : ""}`}
                    onClick={() => handleSaveSentence()}
                    title="B"
                  >
                    <Icon name="bookmark" />{" "}
                    {savedSentences.has(activeSubtitle.idx) ? tr(locale, "Хадгалсан") : tr(locale, "Өгүүлбэр хадгалах")}
                  </button>
                  {activeSubtitle.slang_note ? (
                    <span className="bs-bd-chip bs-bd-chip--slang">💬 {tr(locale, "Залуусын хэллэг")}</span>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="bs-bd-hint">{tr(locale, "Тоглуулбал энд өгүүлбэр үг үгээр гарна")}</p>
            )}
          </div>

          {quizOpen ? (
            <BichlegEpisodeQuiz
              videoId={activeVideo.id}
              keyWords={keyWords}
              allWords={allWords}
              onClose={() => setQuizOpen(false)}
              onSaveWord={(w) => void handleSaveWord({ ...w, sourceVideoId: activeVideo.id })}
            />
          ) : null}

          {/* Сонгосон үг */}
          {pickedWord ? (
            <div className="bs-bd-card bs-bd-card--word">
              <div className="bs-bd-word-head">
                <span className="bs-bd-word-zh hanzi" translate="no">{pickedWord.zh}</span>
                <span className="bs-bd-word-py" translate="no">{pickedWord.pinyin ?? ""}</span>
              </div>
              {pickedWord.mn ? <p className="bs-bd-word-mn" translate="no">{pickedWord.mn}</p> : null}
              {wordStatus?.saved && !wordStatus.inCatalog && !wordStatus.inSrs ? (
                <p className="bs-bd-hint">{tr(locale, "Толь бичигт байхгүй — зөвхөн миний үгсэд хадгалагдлаа")}</p>
              ) : null}
              <div className="bs-bd-tools">
                {statusLoading ? (
                  <button type="button" className="bs-bd-primary" disabled>{tr(locale, "Шалгаж байна…")}</button>
                ) : wordStatus?.inSrs ? (
                  <button type="button" className="bs-bd-primary bs-bd-primary--done" disabled>{tr(locale, "Давталтад нэмэгдсэн ✓")}</button>
                ) : (
                  <button type="button" className="bs-bd-primary" onClick={() => void handleSaveWord()}>{tr(locale, "＋ Үгсэд нэмэх")}</button>
                )}
                <Link href={`/dictionary?q=${encodeURIComponent(pickedWord.zh)}`} className="bs-bd-chip">
                  {tr(locale, "Толь бичиг")} ↗
                </Link>
                <button type="button" className="bs-bd-chip" onClick={() => setPickedWord(null)}>✕</button>
              </div>
            </div>
          ) : null}

          {/* Энэ өгүүлбэрийн үгс */}
          {sentenceWords.length > 0 ? (
            <div className="bs-bd-card">
              <div className="bs-bd-card-top">
                <span className="bs-bd-sec">{tr(locale, "Энэ өгүүлбэрийн үгс")}</span>
                <span className="bs-bd-hint">{sentenceWords.length}</span>
              </div>
              <ul className="bs-bd-wlist">
                {sentenceWords.map((w) => (
                  <li key={w.zh}>
                    <button type="button" className="bs-bd-wrow" onClick={() => handleWordPick(w)} translate="no">
                      <span className={`bs-bd-dot bs-bd-dot--${fam(w.zh)}`} />
                      <span className="bs-bd-wrow-zh hanzi">{w.zh}</span>
                      <span className="bs-bd-wrow-py">{w.pinyin}</span>
                      <span className="bs-bd-wrow-mn">{w.mn}</span>
                    </button>
                    <button
                      type="button"
                      className={`bs-bd-line-btn${savedWords.has(w.zh) ? " bs-bd-line-btn--on" : ""}`}
                      title={tr(locale, "＋ Үгсэд нэмэх")}
                      onClick={() => activeVideo && void handleSaveWord({ ...w, sourceVideoId: activeVideo.id })}
                    >
                      {savedWords.has(w.zh) ? "✓" : "＋"}
                    </button>
                  </li>
                ))}
              </ul>
              {activeSubtitle?.slang_note ? (
                <div className="bs-bd-slang" translate="no">
                  <b>💬 {activeSubtitle.slang_note.term}</b> — {activeSubtitle.slang_note.meaning}
                  {activeSubtitle.slang_note.usage ? <span> · {activeSubtitle.slang_note.usage}</span> : null}
                  {activeSubtitle.slang_note.register ? <em> ({activeSubtitle.slang_note.register})</em> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Энэ ангийн түлхүүр үгс */}
          {keyWords.length > 0 ? (
            <div className="bs-bd-card bs-bd-card--keys">
              <div className="bs-bd-card-top">
                <span className="bs-bd-sec">{tr(locale, "Энэ ангийн түлхүүр үгс")}</span>
                {keyWords.length >= 4 && !quizOpen ? (
                  <button type="button" className="bs-bd-chip" onClick={() => { pause(); setQuizOpen(true); }}>
                    🏁 {tr(locale, "Шалгалт")}
                  </button>
                ) : (
                  <span className="bs-bd-hint">{keyWords.length}</span>
                )}
              </div>
              <div className="bs-bd-keychips" translate="no">
                {keyWords.map((w) => (
                  <button
                    key={w.zh}
                    type="button"
                    className={`bs-bd-keychip${savedWords.has(w.zh) ? " bs-bd-keychip--saved" : ""}`}
                    onClick={() => handleWordPick(w)}
                    title={`${w.pinyin ?? ""} · ${w.mn ?? ""}`}
                  >
                    <b className="hanzi">{w.zh}</b>
                    <span>{w.mn}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="bs-bd-keys-help">
            <kbd>Space</kbd> {tr(locale, "тоглуулах")} · <kbd>←</kbd><kbd>→</kbd> {tr(locale, "өгүүлбэр")} · <kbd>Shift</kbd>+<kbd>←→</kbd> 3{tr(locale, "с")} · <kbd>R</kbd> {tr(locale, "дахин")} · <kbd>L</kbd> ×3 · <kbd>P</kbd> {tr(locale, "зогсох")} · <kbd>S</kbd> {tr(locale, "горим")} · <kbd>B</kbd> {tr(locale, "өгүүлбэр хадгалах")}
          </p>
          {sentenceCount > 0 ? (
            <Link href="/review/sentences" className="bs-bd-sent-link">
              <Icon name="bookmark" /> {tr(locale, "Өгүүлбэрийн карт")} · {sentenceCount} →
            </Link>
          ) : null}
        </aside>

        {toast ? <div className="bs-bd-toast">{toast}</div> : null}
      </div>
    </AppShell>
  );
}
