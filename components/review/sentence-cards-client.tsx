"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WordSrsRatingButtons } from "@/components/review/word-srs-rating-buttons";
import { SpeakerButton } from "@/components/tts/speaker-button";
import {
  getDueSentenceCards,
  listSentenceCards,
  rateSentenceCard,
  removeSentenceCard,
  sentenceCardHref,
  subscribeSentenceCards,
  type SentenceCard,
} from "@/lib/bichleg/sentence-cards";
import { formatSubtitleClock } from "@/lib/bichleg/player-seek";
import type { WordSrsRating } from "@/lib/srs/word-srs-types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import "./sentence-cards.css";

type Tab = "review" | "all";

/**
 * Өгүүлбэрийн карт — бичлэгээс хадгалсан бүтэн өгүүлбэрүүд.
 * Давтах: өгүүлбэр (ханз) → таах → орчуулга харах → үнэлэх. Карт бүр бичлэг рүүгээ цагтай холбоостой.
 */
export function SentenceCardsClient() {
  const locale = useUiLocale();
  const [cards, setCards] = useState<SentenceCard[]>([]);
  const [queue, setQueue] = useState<SentenceCard[]>([]);
  const [tab, setTab] = useState<Tab>("review");
  const [revealed, setRevealed] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [doneCount, setDoneCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  function reload(resetQueue: boolean) {
    setCards(listSentenceCards());
    if (resetQueue) setQueue(getDueSentenceCards());
    setLoaded(true);
  }

  useEffect(() => {
    reload(true);
    return subscribeSentenceCards(() => reload(false));
  }, []);

  const current = queue[0] ?? null;

  function rate(rating: WordSrsRating) {
    if (!current) return;
    rateSentenceCard(current.id, rating);
    setDoneCount((n) => n + 1);
    setRevealed(false);
    setQueue((q) => {
      const rest = q.slice(1);
      // Мартсан бол дараалалын сүүлд дахин ирнэ
      return rating === "forgot" ? [...rest, { ...current, lastRating: "forgot" }] : rest;
    });
  }

  function remove(id: string) {
    removeSentenceCard(id);
    setQueue((q) => q.filter((c) => c.id !== id));
    reload(false);
  }

  // Гарын товч: Space/Enter харах, 1/2/3 үнэлэх
  useEffect(() => {
    if (tab !== "review" || !current) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.key === " " || e.key === "Enter") && !revealed) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && e.key === "1") rate("forgot");
      else if (revealed && e.key === "2") rate("hard");
      else if (revealed && e.key === "3") rate("known");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const dueTotal = useMemo(() => getDueSentenceCards().length, [cards]);
  const byVideo = useMemo(() => {
    const map = new Map<string, { title: string; cards: SentenceCard[] }>();
    for (const c of cards) {
      const key = c.videoId;
      if (!map.has(key)) map.set(key, { title: c.videoTitle ?? c.videoId, cards: [] });
      map.get(key)!.cards.push(c);
    }
    for (const v of map.values()) v.cards.sort((a, b) => a.startSec - b.startSec);
    return [...map.values()];
  }, [cards]);

  return (
    <div className="bs-sc">
      <h1 className="bs-srs-words-title">{tr(locale, "Өгүүлбэрийн карт")}</h1>
      <p className="bs-srs-words-sub">
        {cards.length} {tr(locale, "өгүүлбэр")} · {dueTotal} {tr(locale, "давтахаар хүлээж байна")}
      </p>

      <div className="bs-srs-words-filters">
        <button type="button" className={`bs-srs-words-filter${tab === "review" ? " bs-srs-words-filter--on" : ""}`} onClick={() => setTab("review")}>
          {tr(locale, "Давтах")}{queue.length > 0 ? ` · ${queue.length}` : ""}
        </button>
        <button type="button" className={`bs-srs-words-filter${tab === "all" ? " bs-srs-words-filter--on" : ""}`} onClick={() => setTab("all")}>
          {tr(locale, "Бүгд")} · {cards.length}
        </button>
      </div>

      {!loaded ? null : cards.length === 0 ? (
        <div className="bs-sc-empty">
          <p className="bs-sc-empty-ic" aria-hidden>🔖</p>
          <p>{tr(locale, "Бичлэг үзэж байхдаа өгүүлбэрийн хажуугийн 🔖 товчийг (эсвэл B) дарвал энд цуглана. Дараа нь бичлэг дээрээ буцаж сонсож, орчуулгыг нь давтана.")}</p>
          <Link href="/bichleg" className="app-btn-primary bs-sc-cta">{tr(locale, "Бичлэг үзэх")}</Link>
        </div>
      ) : tab === "review" ? (
        current ? (
          <div className="bs-sc-card">
            <div className="bs-sc-card-top">
              <span className="bs-sc-src">
                🎬 {current.videoTitle ?? tr(locale, "Бичлэг")} · {formatSubtitleClock(current.startSec)}
              </span>
              <span className="bs-sc-left">{queue.length} {tr(locale, "үлдсэн")}</span>
            </div>
            <p className="bs-sc-zh hanzi" translate="no">{current.zh}</p>
            {showPinyin && current.pinyin ? <p className="bs-sc-py">{current.pinyin}</p> : null}
            <div className="bs-sc-row">
              <SpeakerButton text={current.zh} lang="zh-CN" size="sm" />
              <button type="button" className={`bs-sc-chip${showPinyin ? " bs-sc-chip--on" : ""}`} onClick={() => setShowPinyin((v) => !v)}>
                {tr(locale, "Пиньинь")}
              </button>
              <Link href={sentenceCardHref(current)} className="bs-sc-chip">
                ▶ {tr(locale, "Бичлэг дээр сонсох")}
              </Link>
            </div>
            {revealed ? (
              <>
                <p className="bs-sc-mn" translate="no">{current.mn ?? tr(locale, "(орчуулга байхгүй)")}</p>
                <WordSrsRatingButtons onRate={rate} />
                <p className="bs-sc-keys"><kbd>1</kbd> {tr(locale, "Мартсан")} · <kbd>2</kbd> {tr(locale, "Эргэлзсэн")} · <kbd>3</kbd> {tr(locale, "Мэдсэн")}</p>
              </>
            ) : (
              <>
                <p className="bs-sc-ask">{tr(locale, "Энэ өгүүлбэр юу гэсэн үг вэ? Бодоод дараа нь харна уу.")}</p>
                <button type="button" className="app-btn-primary bs-sc-reveal" onClick={() => setRevealed(true)}>
                  {tr(locale, "Орчуулгыг харах")} <kbd>Space</kbd>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bs-sc-empty">
            <p className="bs-sc-empty-ic" aria-hidden>{doneCount > 0 ? "🎉" : "✅"}</p>
            <p>
              {doneCount > 0
                ? `${doneCount} ${tr(locale, "өгүүлбэр давтлаа. Маргааш дахин ирээрэй!")}`
                : tr(locale, "Одоогоор давтах өгүүлбэр алга. Бичлэг үзээд шинээр хадгалаарай.")}
            </p>
            <button type="button" className="bs-srs-words-filter" onClick={() => setTab("all")}>{tr(locale, "Бүх картыг харах")}</button>
          </div>
        )
      ) : (
        <div className="bs-sc-groups">
          {byVideo.map((g) => (
            <section key={g.title + g.cards[0].videoId} className="bs-sc-group">
              <h2 className="bs-sc-group-title" translate="no">🎬 {g.title}</h2>
              <ul className="bs-sc-list">
                {g.cards.map((c) => {
                  const due = new Date(c.dueAt).getTime() <= Date.now();
                  return (
                    <li key={c.id} className="bs-sc-item">
                      <Link href={sentenceCardHref(c)} className="bs-sc-item-time" title={tr(locale, "Бичлэг дээр сонсох")}>
                        ▶ {formatSubtitleClock(c.startSec)}
                      </Link>
                      <div className="bs-sc-item-body">
                        <p className="bs-sc-item-zh hanzi" translate="no">{c.zh}</p>
                        {c.mn ? <p className="bs-sc-item-mn" translate="no">{c.mn}</p> : null}
                        <p className="bs-sc-item-meta">
                          {due ? tr(locale, "давтах цаг болсон") : `${tr(locale, "дараагийн давталт")}: ${new Date(c.dueAt).toLocaleDateString("mn-MN")}`}
                          {c.reps > 0 ? ` · ${c.reps}× ${tr(locale, "давтсан")}` : ""}
                        </p>
                      </div>
                      <button type="button" className="bs-sc-del" onClick={() => remove(c.id)} aria-label={tr(locale, "Устгах")} title={tr(locale, "Устгах")}>
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
