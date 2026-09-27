"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { BichlegYouTubePlayer } from "@/components/bichleg/bichleg-youtube-player";
import { PronunciationPractice } from "@/components/speech/pronunciation-practice";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import type { SubtitleWord, VideoRow, VideoSubtitleRow } from "@/lib/bichleg/types";
import { formatSubtitleClock } from "@/lib/bichleg/player-seek";
import {
  adminSubtitleOffsetSec,
  subtitlePlayerSeekSec,
} from "@/lib/bichleg/subtitle-offset";
import {
  applyPlaybackRate,
  safePlayerCurrentTime,
  type YtPlayer,
} from "@/lib/bichleg/youtube-api";
import { KID_MODE_STORAGE_KEY } from "@/lib/kids/types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  fetchBichlegWordStatus,
  saveWordFromVideo,
  type BichlegWordStatus,
} from "@/lib/supabase/videos-client";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import type { WritingItem } from "@/lib/writing/types";

type Props = {
  video: VideoRow | null;
  subtitles: VideoSubtitleRow[];
  backHref?: string;
  isDemo?: boolean;
};

type PickedWord = SubtitleWord & { sourceVideoId: string };

const TICK_MS = 200;
const SCROLL_THROTTLE_MS = 350;
type Speed = 1 | 0.75;

const HAN_CHAR = /\p{Script=Han}/u;

/** /api/writing/lookup хариу — мөр бүрд нэг удаа (module cache, mount хооронд хадгална). */
const lookupCache = new Map<string, WritingItem[]>();
/** Үгийн статус хүсэлтийн дараалал — хоцорсон хариуг хаяна. */
let wordStatusReq = 0;

function readKidMode(): boolean {
  try {
    return Boolean(window.localStorage.getItem(KID_MODE_STORAGE_KEY));
  } catch {
    return false;
  }
}
const subscribeNoop = () => () => {};
const serverKidMode = () => false;

/** Одоогийн мөр: эхэлсэн сүүлийн мөр (мөр хоорондын завсарт өмнөх мөр хэвээр). */
function findCurrentLineIndex(
  lines: VideoSubtitleRow[],
  t: number,
  offset: number
): number {
  let idx = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (t >= lines[i].start_sec + offset) idx = i;
    else break;
  }
  return idx;
}

export function SongKaraokeClient({
  video,
  subtitles,
  backHref = "/bichleg?tab=songs",
  isDemo = false,
}: Props) {
  const locale = useUiLocale();
  const [player, setPlayer] = useState<YtPlayer | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lastScrollRef = useRef(0);
  const loopRef = useRef(false);
  const currentIndexRef = useRef(-1);

  // Хүүхдийн горим (localStorage) — SSR дээр false, client дээр уншина.
  const kidMode = useSyncExternalStore(subscribeNoop, readKidMode, serverKidMode);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  // null = үндсэн (хүүхдийн горимд монгол унтраалттай, бусдад асаалттай)
  const [showMnPref, setShowMnPref] = useState<boolean | null>(null);
  const showMn = showMnPref ?? !kidMode;
  const [loopLine, setLoopLine] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [displaySpeed, setDisplaySpeed] = useState(1);
  const [showSing, setShowSing] = useState(false);
  const [pickedWord, setPickedWord] = useState<PickedWord | null>(null);
  const [wordStatus, setWordStatus] = useState<BichlegWordStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useActivityTracker("video", video?.id ?? null, Boolean(video));

  const offset = useMemo(
    () => (video ? adminSubtitleOffsetSec(video) : 0),
    [video]
  );

  const currentIndex = useMemo(
    () => findCurrentLineIndex(subtitles, currentTime, offset),
    [subtitles, currentTime, offset]
  );
  const currentLine = currentIndex >= 0 ? subtitles[currentIndex] : null;

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    loopRef.current = loopLine;
  }, [currentIndex, loopLine]);

  const runOnPlayer = useCallback(
    (fn: (p: YtPlayer) => void) => {
      if (!player) return;
      try {
        fn(player);
      } catch {
        /* player destroyed */
      }
    },
    [player]
  );

  const handlePlayerChange = useCallback((next: YtPlayer | null) => {
    setPlayer(next);
    if (!next) setPlayerReady(false);
  }, []);

  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true);
    runOnPlayer((player) => {
      setDisplaySpeed(applyPlaybackRate(player, speed));
    });
  }, [runOnPlayer, speed]);

  const handlePlayerStateChange = useCallback((state: number) => {
    if (typeof YT === "undefined") return;
    if (state === YT.PlayerState.PLAYING) setIsPlaying(true);
    else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED) {
      setIsPlaying(false);
    }
  }, []);

  // Хурд
  useEffect(() => {
    if (!playerReady) return;
    runOnPlayer((player) => setDisplaySpeed(applyPlaybackRate(player, speed)));
  }, [speed, playerReady, runOnPlayer]);

  // Дуу (mute)
  useEffect(() => {
    if (!playerReady) return;
    runOnPlayer((player) => {
      if (muted) player.mute();
      else player.unMute();
    });
  }, [muted, playerReady, runOnPlayer]);

  // 200 мс тутам цаг унших + «Мөр давтах»
  useEffect(() => {
    if (!playerReady || !player) return;
    const tick = setInterval(() => {
      const t = safePlayerCurrentTime(player);
      if (t == null) return;
      const idx = currentIndexRef.current;
      if (loopRef.current && idx >= 0) {
        const line = subtitles[idx];
        if (line && t >= line.end_sec + offset) {
          try {
            player.seekTo(subtitlePlayerSeekSec(line, offset), true);
          } catch {
            /* destroyed */
          }
          setCurrentTime(subtitlePlayerSeekSec(line, offset));
          return;
        }
      }
      setCurrentTime(t);
    }, TICK_MS);
    return () => clearInterval(tick);
  }, [playerReady, player, subtitles, offset]);

  // Одоогийн мөрийг дээд гуравны нэгд байлгах (throttled)
  useEffect(() => {
    if (currentIndex < 0) return;
    const now = Date.now();
    if (now - lastScrollRef.current < SCROLL_THROTTLE_MS) return;
    const sheet = sheetRef.current;
    const el = sheet?.querySelector<HTMLElement>(
      `[data-line-index="${currentIndex}"]`
    );
    if (!sheet || !el) return;
    lastScrollRef.current = now;
    const top = el.offsetTop - sheet.clientHeight / 3;
    sheet.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [currentIndex]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const openWord = useCallback((word: PickedWord) => {
    setPickedWord(word);
    setWordStatus(null);
    setStatusLoading(true);
    const req = ++wordStatusReq;
    void fetchBichlegWordStatus(word.zh).then((status) => {
      if (req !== wordStatusReq) return;
      setWordStatus(status);
      setStatusLoading(false);
    });
  }, []);

  const lookupLine = useCallback(async (line: VideoSubtitleRow): Promise<WritingItem[]> => {
    const cacheKey = `${line.video_id}:${line.idx}`;
    const cached = lookupCache.get(cacheKey);
    if (cached) return cached;
    setLookupBusy(true);
    try {
      const res = await fetch("/api/writing/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: line.zh ?? "" }),
      });
      const data = (await res.json()) as { items?: WritingItem[] };
      const items = data.items ?? [];
      lookupCache.set(cacheKey, items);
      return items;
    } catch {
      return [];
    } finally {
      setLookupBusy(false);
    }
  }, []);

  function ensureUnmuted() {
    if (muted) setMuted(false);
  }

  function play() {
    ensureUnmuted();
    runOnPlayer((p) => p.playVideo());
  }

  function pause() {
    runOnPlayer((p) => p.pauseVideo());
  }

  function togglePlay() {
    if (isPlaying) pause();
    else play();
  }

  function seekToLine(line: VideoSubtitleRow) {
    ensureUnmuted();
    const target = subtitlePlayerSeekSec(line, offset);
    runOnPlayer((p) => {
      p.seekTo(target, true);
      p.playVideo();
    });
    setCurrentTime(target);
  }

  const handleCharPick = useCallback(
    (line: VideoSubtitleRow, ch: string) => {
      if (!video) return;
      const videoId = video.id;
      runOnPlayer((p) => p.pauseVideo());
      void lookupLine(line).then((items) => {
        const hit = items.find((it) => it.ch === ch) ?? null;
        if (hit?.word) {
          const word = hit.word;
          const parts = items.filter((it) => it.word === word);
          openWord({
            zh: word,
            pinyin: parts.map((it) => it.pinyin ?? "").filter(Boolean).join(" ") || undefined,
            mn: hit.meaning_mn ?? undefined,
            sourceVideoId: videoId,
          });
          return;
        }
        openWord({
          zh: ch,
          pinyin: hit?.pinyin ?? undefined,
          mn: hit?.meaning_mn ?? undefined,
          sourceVideoId: videoId,
        });
      });
    },
    [video, runOnPlayer, lookupLine, openWord]
  );

  const handleWordPick = useCallback(
    (word: SubtitleWord) => {
      if (!video) return;
      runOnPlayer((p) => p.pauseVideo());
      openWord({ ...word, sourceVideoId: video.id });
    },
    [video, runOnPlayer, openWord]
  );

  function handleContinue() {
    setPickedWord(null);
    setWordStatus(null);
    play();
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
      setPickedWord(null);
      setWordStatus(null);
      play();
    } else if (result.error) {
      setToast(result.error);
    }
  }

  const renderZh = useCallback((line: VideoSubtitleRow) => {
    if (line.words?.length) {
      return line.words.map((w, i) => (
        <button
          key={`${line.idx}-w${i}`}
          type="button"
          className={`bs-song-word ${w.key ? "bs-song-word--key" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleWordPick(w);
          }}
        >
          {w.zh}
        </button>
      ));
    }
    const chars: string[] = Array.from(line.zh ?? "");
    return chars.map((hanzi, i) => {
      if (!HAN_CHAR.test(hanzi)) {
        return <span key={`${line.idx}-c${i}`}>{hanzi}</span>;
      }
      return (
        <button
          key={`${line.idx}-c${i}`}
          type="button"
          className="bs-song-word"
          onClick={(e) => {
            e.stopPropagation();
            handleCharPick(line, hanzi);
          }}
        >
          {hanzi}
        </button>
      );
    });
  }, [handleCharPick, handleWordPick]);

  const title = video?.title_zh ?? video?.title_mn ?? tr(locale, "Дуу");
  const seriesTitle =
    video?.series
      ? locale === "zh"
        ? (video.series.title_zh ?? video.series.title_mn)
        : (video.series.title_mn ?? video.series.title_zh)
      : null;

  return (
    <MobileAppShell activeTab="clips" mainClassName={SHELL_MAIN_NARROW}>
      <div className={`bs-song ${kidMode ? "bs-song--kid" : ""}`}>
        <Link href={backHref} className="bs-song-back">
          {tr(locale, "← Дуу")}
        </Link>

        <header className="bs-song-head" translate="no">
          <h1 className="bs-song-title hanzi">{title}</h1>
          <p className="bs-song-meta">
            {video?.artist ? <span>🎤 {video.artist}</span> : null}
            {video?.year ? <span>{video.year}</span> : null}
            {seriesTitle ? <span>{seriesTitle}</span> : null}
            {video?.hsk_level ? (
              <span className="bs-song-chip">HSK{video.hsk_level}</span>
            ) : null}
            {isDemo ? <span className="bs-song-chip bs-song-chip--demo">demo</span> : null}
          </p>
        </header>

        {video ? (
          <div className="bs-song-player">
            <BichlegYouTubePlayer
              key={video.youtube_id}
              youtubeId={video.youtube_id}
              onPlayerChange={handlePlayerChange}
              onReady={handlePlayerReady}
              onStateChange={handlePlayerStateChange}
            />
          </div>
        ) : null}

        {video ? (
          <div className="bs-song-controls">
            <button
              type="button"
              className="bs-song-ctrl bs-song-ctrl--play"
              aria-label={isPlaying ? tr(locale, "Зогсоох") : tr(locale, "Тоглуулах")}
              onClick={togglePlay}
              disabled={!playerReady}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              className={`bs-song-ctrl ${loopLine ? "bs-song-ctrl--on" : ""}`}
              aria-pressed={loopLine}
              onClick={() => setLoopLine((v) => !v)}
            >
              🔁 {tr(locale, "Мөр давтах")}
            </button>
            <button
              type="button"
              className={`bs-song-ctrl ${speed !== 1 ? "bs-song-ctrl--on" : ""}`}
              aria-label={tr(locale, "Хурд")}
              onClick={() => setSpeed((s) => (s === 1 ? 0.75 : 1))}
            >
              {Math.abs(displaySpeed - 1) < 0.001 ? "1×" : `${displaySpeed}×`}
            </button>
            <button
              type="button"
              className={`bs-song-ctrl ${showPinyin ? "bs-song-ctrl--on" : ""}`}
              aria-pressed={showPinyin}
              onClick={() => setShowPinyin((v) => !v)}
            >
              拼音
            </button>
            <button
              type="button"
              className={`bs-song-ctrl ${showMn ? "bs-song-ctrl--on" : ""}`}
              aria-pressed={showMn}
              onClick={() => setShowMnPref(!showMn)}
            >
              蒙文
            </button>
            {muted && playerReady ? (
              <button
                type="button"
                className="bs-song-ctrl bs-song-ctrl--warn"
                onClick={() => setMuted(false)}
              >
                {tr(locale, "Дууг асаах")}
              </button>
            ) : null}
            <span className="bs-song-progress" aria-live="polite">
              {subtitles.length
                ? `${Math.max(0, currentIndex + 1)} / ${subtitles.length}`
                : "0 / 0"}
            </span>
          </div>
        ) : null}

        {!video || subtitles.length === 0 ? (
          <div className="bs-song-empty">
            <p className="bs-song-empty-title">🎶 {tr(locale, "Үг хараахан ороогүй")}</p>
            <p className="bs-song-empty-sub">
              {video
                ? tr(locale, "Админ LRC-ээр дууны үгийг оруулсны дараа энд мөр бүр дуутай хамт гүйнэ.")
                : tr(locale, "Дуу олдсонгүй.")}
            </p>
            <Link href={backHref} className="bs-bichleg-back-link mt-4">
              {tr(locale, "← Дуу")}
            </Link>
          </div>
        ) : (
          <div className="bs-song-sheet" ref={sheetRef} translate="no">
            {subtitles.map((line, i) => {
              const state =
                i === currentIndex ? "current" : i < currentIndex ? "past" : "next";
              return (
                <button
                  key={line.id}
                  type="button"
                  data-line-index={i}
                  className={`bs-song-line bs-song-line--${state}`}
                  onClick={() => seekToLine(line)}
                  aria-current={state === "current" ? "true" : undefined}
                >
                  <span className="bs-song-line-time">
                    {formatSubtitleClock(line.start_sec)}
                  </span>
                  {showPinyin && line.pinyin ? (
                    <span className="bs-song-line-py">{line.pinyin}</span>
                  ) : null}
                  <span className="bs-song-line-zh hanzi">{renderZh(line)}</span>
                  {showMn && line.mn ? (
                    <span className="bs-song-line-mn">{line.mn}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {video && currentLine?.zh ? (
          <div className="bs-song-sing">
            <button
              type="button"
              className={`bs-song-ctrl bs-song-ctrl--sing ${showSing ? "bs-song-ctrl--on" : ""}`}
              onClick={() => {
                setShowSing((v) => !v);
                if (!showSing) pause();
              }}
            >
              🎤 {tr(locale, "Дуулж үзэх")}
            </button>
            {showSing ? (
              <PronunciationPractice
                key={currentLine.id}
                text={currentLine.zh}
                pinyin={currentLine.pinyin}
                mode="pitch"
                sectionLink={false}
                className="mt-2"
              />
            ) : null}
          </div>
        ) : null}

        {lookupBusy ? <div className="bs-bichleg-toast bs-song-toast">{tr(locale, "Шалгаж байна…")}</div> : null}

        {pickedWord ? (
          <div className="bs-bichleg-sheet-backdrop bs-song-sheet-backdrop" onClick={handleContinue}>
            <div className="bs-bichleg-sheet" onClick={(e) => e.stopPropagation()}>
              <p className="bs-bichleg-sheet-zh hanzi" translate="no">{pickedWord.zh}</p>
              {pickedWord.pinyin ? (
                <p className="bs-bichleg-sheet-py" translate="no">{pickedWord.pinyin}</p>
              ) : null}
              {pickedWord.mn ? (
                <p className="bs-bichleg-sheet-mn" translate="no">{pickedWord.mn}</p>
              ) : null}
              {wordStatus?.saved && !wordStatus.inCatalog && !wordStatus.inSrs ? (
                <p className="bs-bichleg-sheet-note">
                  {tr(locale, "Толь бичигт байхгүй — зөвхөн миний үгсэд хадгалагдлаа")}
                </p>
              ) : null}
              <div className="bs-bichleg-sheet-actions">
                <button type="button" className="bs-bichleg-sheet-btn" onClick={handleContinue}>
                  {tr(locale, "▶ Үргэлжлүүлэх")}
                </button>
                {statusLoading ? (
                  <button type="button" className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--primary" disabled>
                    {tr(locale, "Шалгаж байна…")}
                  </button>
                ) : wordStatus?.inSrs ? (
                  <button type="button" className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--done" disabled>
                    {tr(locale, "Давталтад нэмэгдсэн ✓")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--primary"
                    onClick={() => void handleSaveWord()}
                  >
                    {tr(locale, "＋ Үгсэд нэмэх")}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className="bs-bichleg-toast bs-song-toast">{toast}</div> : null}
      </div>
    </MobileAppShell>
  );
}
