"use client";

import { MobileCard } from "@/components/mobile/mobile-card";
import {
  HANGUL_TEXT_DIAGRAMS,
  type TeachingImage,
} from "@/lib/lesson/teaching-media";

type Props = {
  teachingImages?: TeachingImage[];
  showFallbackDiagram?: boolean;
};

export function KoreanTeachingVisuals({
  teachingImages = [],
  showFallbackDiagram = true,
}: Props) {
  const hasImages = teachingImages.length > 0;

  if (!hasImages && !showFallbackDiagram) {
    return null;
  }

  return (
    <MobileCard padding="lg">
      <h2 className="text-sm font-bold text-[var(--app-text)]">
        {hasImages ? "Сургах зураг" : "한글 үеийн бүтэц"}
      </h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        {hasImages
          ? "Багшийн зааврын зураг — Hangul сургалтын туслах."
          : "Зураг байхгүй — текстэн жишээгээр үе бүтэхийг харуулна."}
      </p>

      {hasImages ? (
        <div className="mt-4 flex flex-col gap-4">
          {teachingImages.map((image) => (
            <figure
              key={`${image.url}-${image.title}`}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.title}
                className="w-full object-contain"
              />
              <figcaption className="border-t border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-[var(--app-text)]">
                  {image.title}
                </p>
                {image.caption ? (
                  <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                    {image.caption}
                  </p>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {HANGUL_TEXT_DIAGRAMS.map((item) => (
            <div
              key={item.equation}
              className="rounded-2xl bg-slate-50 px-4 py-4 text-center ring-1 ring-slate-200"
            >
              <p className="font-mono text-2xl font-bold tracking-wide text-slate-900">
                {item.equation}
              </p>
              <p className="mt-2 text-xs text-[var(--app-muted)]">{item.caption}</p>
            </div>
          ))}
        </div>
      )}
    </MobileCard>
  );
}
