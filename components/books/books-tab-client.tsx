"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readLocalSnapshot } from "@/lib/cache/local-snapshot";
import { CourseCover } from "@/components/courses/course-cover";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";

export type BooksTabEntry = {
  key: string;
  chipId: string;
  series: "standard" | "fazhan" | "yct";
  label: string;
  title: string;
  coverUrl: string | null;
  available: boolean;
  lessonCount: number;
  href: string;
};

type Props = {
  standard: BooksTabEntry[];
  fazhan: BooksTabEntry[];
  yct: BooksTabEntry[];
};

const SECTIONS: { key: keyof Props; title: string; sub: string }[] = [
  { key: "standard", title: "HSK", sub: "HSK шалгалтын стандарт сурах бичиг — 1-ээс 6-р түвшин" },
  { key: "fazhan", title: "发展汉语", sub: "Хятадын их сургуулийн бэлтгэл ангид үздэг ном" },
  { key: "yct", title: "YCT · хүүхдэд", sub: "Бага насны хүүхдэд зориулсан хятад хэл" },
];

/** «Ном» таб: бүх ном хавтастайгаа нэг дор. Дарахад тэр номын хичээлийн жагсаалт нээгдэнэ. */
export function BooksTabClient(props: Props) {
  const router = useRouter();
  // Нүүр хуудасны хадгалсан төлөв: одоо үзэж буй ном, үргэлжлүүлэх хичээл.
  const [current, setCurrent] = useState<{ key: string; href: string; title: string } | null>(null);
  useEffect(() => {
    try {
      const series = window.localStorage.getItem("bs:homeSeries") ?? "standard";
      const chip = window.localStorage.getItem("bs:homeChip");
      const snap = readLocalSnapshot<{ continueHref?: string; continueTitle?: string }>("home:v1");
      if (chip && snap?.continueHref && snap.continueTitle) {
        setCurrent({ key: `${series}:${chip}`, href: snap.continueHref, title: snap.continueTitle });
      } else if (chip) {
        setCurrent({ key: `${series}:${chip}`, href: "", title: "" });
      }
    } catch {
      /* ignore */
    }
  }, []);
  const all = [...props.standard, ...props.fazhan, ...props.yct];
  const currentBook = current ? all.find((entry) => entry.key === current.key) : null;

  const open = (entry: BooksTabEntry) => {
    if (!entry.available) return;
    // Нүүр хуудас ч мөн энэ номыг «миний ном» болгож харуулна.
    try {
      window.localStorage.setItem("bs:homeSeries", entry.series);
      window.localStorage.setItem("bs:homeChip", entry.chipId);
    } catch {
      /* ignore */
    }
    router.push(entry.href);
  };

  return (
    <MobileAppShell activeTab="books" desktopWidth="wide">
      <MobilePageHeader title="Ном" subtitle="Сурах номоо сонго. Бүх ном, бүх хичээл үнэгүй." />
      {currentBook && current?.href ? (
        <Link href={current.href} className="bs-tm-continue bs-tm-continue--main">
          <span className="bs-tm-continue-ic" aria-hidden>
            ▶
          </span>
          <span className="min-w-0 flex-1">
            <p className="bs-tm-continue-kicker">
              {currentBook.label} · Үргэлжлүүлэх
            </p>
            <p className="bs-tm-continue-title" translate="no">
              {current.title}
            </p>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>
            ›
          </span>
        </Link>
      ) : null}
      {SECTIONS.map((section) => {
        const entries = [...props[section.key]].sort(
          (a, b) => Number(b.available) - Number(a.available)
        );
        if (entries.length === 0) return null;
        return (
          <section key={section.key} className="mb-6">
            <h2 className="text-base font-extrabold text-[var(--app-text)]" translate="no">
              {section.title}
            </h2>
            <p className="mb-3 mt-0.5 text-xs text-[var(--app-muted)]">{section.sub}</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {entries.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  disabled={!entry.available}
                  onClick={() => open(entry)}
                  className={`flex flex-col items-stretch text-left transition-transform ${
                    entry.available ? "active:scale-[0.97]" : "opacity-45 saturate-50"
                  }`}
                >
                  <span
                    className="relative block w-full overflow-hidden rounded-[14px] shadow-[0_6px_16px_rgba(15,27,20,0.14)]"
                    style={{ aspectRatio: "300 / 420" }}
                  >
                    <CourseCover
                      src={entry.coverUrl ?? ""}
                      alt={entry.title}
                      label={entry.label}
                      className="h-full w-full object-cover"
                    />
                    {current?.key === entry.key ? (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 shadow-sm">
                        ✓ Миний ном
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="truncate px-0.5 pt-2 text-[12px] font-extrabold leading-tight text-[var(--app-text)]"
                    translate="no"
                  >
                    {entry.label}
                  </span>
                  <span className="px-0.5 text-[11px] font-semibold text-[var(--app-muted)]">
                    {entry.available ? `${entry.lessonCount} хичээл` : "Удахгүй"}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </MobileAppShell>
  );
}
