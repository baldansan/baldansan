"use client";

import { useEffect, useState } from "react";
import { BichlegDesktopClient } from "@/components/bichleg/bichleg-desktop-client";
import { BichlegFeedClient } from "@/components/bichleg/bichleg-feed-client";
import type { UserVideoProgress, VideoRow } from "@/lib/bichleg/types";

type Props = {
  videos: VideoRow[];
  backHref: string;
  feedTitle?: string;
  progressByVideoId?: Record<string, UserVideoProgress>;
  initialActiveIndex?: number;
};

const DESKTOP_QUERY = "(min-width: 920px)";

/**
 * Утас (<920px): TikTok маягийн босоо feed (өмнөхөөс өөрчлөлтгүй).
 * PC (≥920px): тоглуулагч + хадмал + үгийн самбар (BichlegDesktopClient).
 * YouTube player нэг л удаа mount хийхийн тулд дэлгэцийн өргөн мэдэгдтэл юу ч зурахгүй.
 */
export function BichlegPlayerSwitch(props: Props) {
  const [desktop, setDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (desktop === null) {
    return <div style={{ minHeight: "100vh", background: "#0a0f0c" }} aria-busy="true" />;
  }
  return desktop ? <BichlegDesktopClient {...props} /> : <BichlegFeedClient {...props} />;
}
