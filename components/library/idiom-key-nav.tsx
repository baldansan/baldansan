"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  prevHref: string | null;
  nextHref: string | null;
};

/** PC: ↑/↓ (эсвэл ←/→) товчоор өмнөх/дараагийн хэлц рүү. Сонгосон картыг харагдуулна. */
export function IdiomKeyNav({ prevHref, nextHref }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (prevHref) router.prefetch(prevHref);
    if (nextHref) router.prefetch(nextHref);
    const el = document.querySelector<HTMLElement>(".bs-lib-card--on");
    el?.scrollIntoView({ block: "nearest" });
  }, [prevHref, nextHref, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.key === "ArrowUp" || e.key === "ArrowLeft") && prevHref) {
        e.preventDefault();
        router.push(prevHref);
      } else if ((e.key === "ArrowDown" || e.key === "ArrowRight") && nextHref) {
        e.preventDefault();
        router.push(nextHref);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref, router]);

  return null;
}
