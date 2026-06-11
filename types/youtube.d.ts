declare namespace YT {
  const Player: new (
    elementId: string | HTMLElement,
    options: {
      videoId?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: unknown) => void;
        onError?: (event: unknown) => void;
        onStateChange?: (event: { data: number }) => void;
      };
    }
  ) => {
    playVideo: () => void;
    pauseVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    setPlaybackRate: (rate: number) => void;
    mute: () => void;
    unMute: () => void;
    destroy: () => void;
    loadVideoById: (videoId: string) => void;
  };

  const PlayerState: {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
  };
}

interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
