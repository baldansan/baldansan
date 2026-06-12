"use client";

import { useEffect, useRef } from "react";
import {
  createYouTubePlayer,
  destroyYouTubeMount,
  type YtPlayer,
} from "@/lib/bichleg/youtube-api";

type Props = {
  youtubeId: string;
  onPlayerChange: (player: YtPlayer | null) => void;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
};

/** YouTube mount node lives outside React's tree to avoid iframe replace/unmount conflicts. */
export function BichlegYouTubePlayer({
  youtubeId,
  onPlayerChange,
  onReady,
  onStateChange,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mountNodeRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const generationRef = useRef(0);

  const onPlayerChangeRef = useRef(onPlayerChange);
  const onReadyRef = useRef(onReady);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onPlayerChangeRef.current = onPlayerChange;
    onReadyRef.current = onReady;
    onStateChangeRef.current = onStateChange;
  });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const generation = ++generationRef.current;
    let cancelled = false;

    const mountNode = document.createElement("div");
    mountNode.className = "bs-bichleg-player-mount-inner";
    mountNode.style.width = "100%";
    mountNode.style.height = "100%";
    wrapper.appendChild(mountNode);
    mountNodeRef.current = mountNode;

    const teardown = () => {
      const player = playerRef.current;
      playerRef.current = null;
      onPlayerChangeRef.current(null);
      destroyYouTubeMount(player, mountNode, wrapper);
      mountNodeRef.current = null;
    };

    void createYouTubePlayer(mountNode, youtubeId, {
      muted: true,
      onReady: () => {
        if (cancelled || generation !== generationRef.current) return;
        onReadyRef.current?.();
      },
      onStateChange: (state) => {
        if (cancelled || generation !== generationRef.current) return;
        onStateChangeRef.current?.(state);
      },
    })
      .then((player) => {
        if (cancelled || generation !== generationRef.current) {
          destroyYouTubeMount(player, mountNode, wrapper);
          return;
        }
        playerRef.current = player;
        onPlayerChangeRef.current(player);
      })
      .catch(() => {
        if (!cancelled && generation === generationRef.current) {
          teardown();
        }
      });

    return () => {
      cancelled = true;
      teardown();
    };
  }, [youtubeId]);

  return <div ref={wrapperRef} className="bs-bichleg-player-mount" />;
}
