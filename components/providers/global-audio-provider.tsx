"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  globalAudio,
  type GlobalAudioState,
  type GlobalAudioTrack,
} from "@/lib/audio/global-audio-store";

type GlobalAudioContextValue = {
  state: GlobalAudioState;
  play: typeof globalAudio.play;
  toggle: typeof globalAudio.toggle;
  resume: typeof globalAudio.resume;
  pause: typeof globalAudio.pause;
  stop: typeof globalAudio.stop;
  stopIf: typeof globalAudio.stopIf;
  seek: typeof globalAudio.seek;
  setRate: typeof globalAudio.setRate;
  /** Тухайн id тоглож (эсвэл ачаалж) байна уу. */
  isActive: (trackId: string) => boolean;
  /** Тухайн id одоогийн track мөн үү (тоглож/зогссон аль ч байсан). */
  isCurrent: (trackId: string) => boolean;
};

const GlobalAudioContext = createContext<GlobalAudioContextValue | null>(null);

const SERVER_STATE: GlobalAudioState = {
  track: null,
  status: "idle",
  currentTime: 0,
  duration: 0,
  rate: 1,
};

function getServerSnapshot() {
  return SERVER_STATE;
}

/**
 * Глобал аудио контекст — AppProviders түвшинд нэг л удаа. Хичээлийн аудио
 * хуудас солиход тасрахгүй; доод талын mini-player энэ төлвийг харуулна.
 */
export function GlobalAudioProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    globalAudio.subscribe,
    globalAudio.getState,
    getServerSnapshot
  );

  const value = useMemo<GlobalAudioContextValue>(
    () => ({
      state,
      play: globalAudio.play,
      toggle: globalAudio.toggle,
      resume: globalAudio.resume,
      pause: globalAudio.pause,
      stop: globalAudio.stop,
      stopIf: globalAudio.stopIf,
      seek: globalAudio.seek,
      setRate: globalAudio.setRate,
      isActive: (id) =>
        state.track?.id === id &&
        (state.status === "playing" || state.status === "loading"),
      isCurrent: (id) => state.track?.id === id,
    }),
    [state]
  );

  return (
    <GlobalAudioContext.Provider value={value}>
      {children}
    </GlobalAudioContext.Provider>
  );
}

export function useGlobalAudio(): GlobalAudioContextValue {
  const ctx = useContext(GlobalAudioContext);
  if (ctx) return ctx;
  // Provider-гүй газар (тест, тусгаарлагдсан render) — store-оос шууд.
  return {
    state: globalAudio.getState(),
    play: globalAudio.play,
    toggle: globalAudio.toggle,
    resume: globalAudio.resume,
    pause: globalAudio.pause,
    stop: globalAudio.stop,
    stopIf: globalAudio.stopIf,
    seek: globalAudio.seek,
    setRate: globalAudio.setRate,
    isActive: globalAudio.isActive,
    isCurrent: (id) => globalAudio.getState().track?.id === id,
  };
}

export type { GlobalAudioTrack };
