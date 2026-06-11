let apiReady: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  if (!apiReady) {
    apiReady = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };

      const existing = document.querySelector(
        'script[src*="youtube.com/iframe_api"]'
      );
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        document.head.appendChild(tag);
      }
    });
  }

  return apiReady;
}

export type YtPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
};

export function destroyYouTubeMount(
  player: YtPlayer | null,
  mountNode: HTMLElement | null,
  wrapper: HTMLElement | null
): void {
  if (player) {
    try {
      player.destroy();
    } catch {
      /* iframe may already be gone */
    }
  }

  if (mountNode && wrapper && mountNode.parentNode === wrapper) {
    try {
      wrapper.removeChild(mountNode);
    } catch {
      /* race with YouTube teardown */
    }
  }
}

export async function createYouTubePlayer(
  mount: string | HTMLElement,
  youtubeId: string,
  opts?: {
    muted?: boolean;
    onReady?: () => void;
    onStateChange?: (state: number) => void;
  }
): Promise<YtPlayer> {
  await loadYouTubeIframeApi();

  const origin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  return new Promise((resolve, reject) => {
    try {
      const player = new window.YT.Player(mount, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 0,
          autoplay: 1,
          mute: opts?.muted ? 1 : 0,
          ...(origin ? { origin } : {}),
        },
        events: {
          onReady: () => {
            opts?.onReady?.();
            resolve(player as unknown as YtPlayer);
          },
          onError: () => reject(new Error("YouTube player error")),
          onStateChange: (event: { data: number }) => {
            opts?.onStateChange?.(event.data);
          },
        },
      });
    } catch (err) {
      reject(err);
    }
  });
}

/** Safe read — player may be destroyed between interval ticks. */
export function safePlayerCurrentTime(player: YtPlayer): number | null {
  try {
    return player.getCurrentTime();
  } catch {
    return null;
  }
}

export function safePlayerDuration(player: YtPlayer): number | null {
  try {
    const duration = player.getDuration();
    return duration > 0 ? duration : null;
  } catch {
    return null;
  }
}
