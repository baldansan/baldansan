"use client";

import { useEffect, useState } from "react";

export const DESKTOP_MEDIA_QUERY = "(min-width: 920px)";

/** PC (≥920px) эсэх — SSR/эхний render дээр false, mount-ын дараа бодит утга. */
export function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return desktop;
}
