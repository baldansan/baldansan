"use client";

/**
 * Ханзны дэвтрийн НЭГДСЭН САМБАР: нийт сурсан ханз, сул ханзууд, өнөөдөр бичих нь,
 * ханз бүрийн түүх. Өгөгдөл: lib/writing/hanzi-history (гурван системийн нэг бүртгэл).
 */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MobileCard } from "@/components/mobile/mobile-card";
import { HanziGlyph } from "@/components/writing/hanzi-glyph";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { UiLocale } from "@/lib/i18n/locale-types";
import {
  buildHanziDashboard,
  getReviewHanzi,
  dayKey,
  daysBetween,
  HANZI_HISTORY_EVENT,
  hanziStage,
  nextRefreshDay,
  setHanziInReview,
  syncHanziHistory,
  type HanziDashboard as Dashboard,
  type HanziHistory,
  type HanziStage,
} from "@/lib/writing/hanzi-history";
import { readStrokeLessonState } from "@/lib/writing/stroke-lesson";

const STAGE_LABEL: Record<HanziStage, string> = {
  new: "Шинэ",
  weak: "Сул",
  learning: "Сурч буй",
  learned: "Сурсан",
  solid: "Бат тогтсон",
};

function agoLabel(locale: UiLocale, iso: string): string {
  const d = daysBetween(dayKey(new Date(iso)), dayKey());
  if (d <= 0) return tr(locale, "өнөөдөр");
  if (d === 1) return tr(locale, "өчигдөр");
  return `${d} ${tr(locale, "хоногийн өмнө")}`;
}

function refreshLabel(locale: UiLocale, h: HanziHistory): string | null {
  const stage = hanziStage(h);
  if (stage === "weak" || stage === "new") return tr(locale, "өнөөдөр дахин бичээрэй");
  const next = nextRefreshDay(h);
  if (!next) return null;
  const d = daysBetween(dayKey(), next);
  if (d <= 0) return tr(locale, "өнөөдөр");
  if (d === 1) return tr(locale, "маргааш");
  return `${d} ${tr(locale, "хоногийн дараа")}`;
}

function HistoryCard({
  h,
  locale,
  onClose,
}: {
  h: HanziHistory;
  locale: UiLocale;
  onClose: () => void;
}) {
  const stage = hanziStage(h);
  const sources = [
    h.bySource.book > 0 ? `${tr(locale, "Дэвтэр")} ${h.bySource.book}` : null,
    h.bySource.review > 0 ? `${tr(locale, "Давтах")} ${h.bySource.review}` : null,
    h.bySource.hsk > 0 ? `${tr(locale, "HSK ханз")} ${h.bySource.hsk}` : null,
  ].filter(Boolean);
  const refresh = refreshLabel(locale, h);
  return (
    <div className="wn-hd-history">
      <button type="button" className="wn-hd-close" onClick={onClose} aria-label={tr(locale, "Хаах")}>
        ×
      </button>
      <div className="flex items-start gap-3">
        <span className="wn-hd-big" translate="no">
          {h.ch}
        </span>
        <div className="min-w-0 flex-1">
          <p className="pr-6 text-[15px] font-bold leading-snug text-[var(--app-text)]">
            <span translate="no">{h.pinyin ?? ""}</span>
            {h.pinyin && h.meaning ? " · " : ""}
            {h.meaning ?? ""}
          </p>
          <span className={`wn-hd-stage is-${stage}`}>{tr(locale, STAGE_LABEL[stage])}</span>
        </div>
      </div>
      <dl className="wn-hd-facts">
        <div>
          <dt>{tr(locale, "Бичсэн")}</dt>
          <dd>
            {h.writes} {tr(locale, "удаа")}
          </dd>
        </div>
        <div>
          <dt>{tr(locale, "Алдсан")}</dt>
          <dd>
            {h.mistakes} {tr(locale, "зураас")}
          </dd>
        </div>
        <div>
          <dt>{tr(locale, "Санаж зөв бичсэн")}</dt>
          <dd>
            {h.recallDays.length} {tr(locale, "өдөр")}
          </dd>
        </div>
        <div>
          <dt>{tr(locale, "Сүүлд")}</dt>
          <dd>{agoLabel(locale, h.lastAt)}</dd>
        </div>
      </dl>
      {sources.length > 0 ? (
        <p className="mt-2 text-xs text-[var(--app-muted)]">{sources.join(" · ")}</p>
      ) : null}
      {refresh && stage !== "solid" ? (
        <p className="mt-1 text-xs font-semibold text-[var(--app-text)]">
          {tr(locale, "Дараагийн сэргээлт")}: {refresh}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <Link href={`/writing/today?ch=${encodeURIComponent(h.ch)}`} className="wn-btn-ghost flex-1 text-center">
          ✍️ {tr(locale, "Одоо бичих")}
        </Link>
        {h.inReview ? (
          <button
            type="button"
            className="wn-btn-ghost flex-1"
            onClick={() => setHanziInReview([h.ch], false)}
          >
            ✓ {tr(locale, "Давталтад байгаа")} · <u>{tr(locale, "хасах")}</u>
          </button>
        ) : (
          <button
            type="button"
            className="wn-btn-ghost flex-1 !text-[var(--app-primary)]"
            onClick={() => setHanziInReview([h.ch], true)}
          >
            ＋ {tr(locale, "Давталтад нэмэх")}
          </button>
        )}
      </div>
    </div>
  );
}

export function HanziDashboard() {
  const locale = useUiLocale();
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [selected, setSelected] = useState<{ ch: string; from: "weak" | "all" } | null>(null);
  const [showHow, setShowHow] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [strokesDone, setStrokesDone] = useState(true);

  const [inReview, setInReview] = useState<HanziHistory[]>([]);
  const refresh = useCallback(() => {
    setDash(buildHanziDashboard());
    setInReview(getReviewHanzi());
  }, []);

  useEffect(() => {
    refresh();
    setStrokesDone(readStrokeLessonState().finished);
    void syncHanziHistory().then(refresh);
    window.addEventListener(HANZI_HISTORY_EVENT, refresh);
    return () => window.removeEventListener(HANZI_HISTORY_EVENT, refresh);
  }, [refresh]);

  const strokesCard = (
    <Link href="/writing/strokes" className="mb-4 block">
      <MobileCard className="flex items-center gap-3">
        <span className="wn-hd-strokes-ico" aria-hidden>
          <HanziGlyph ch="人" only={0} size={38} />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[15px] text-[var(--app-text)]">{tr(locale, "Зурлагын үндэс")}</b>
          <small className="block text-xs text-[var(--app-muted)]">
            {tr(locale, "8 үндсэн зурлага ба бичих дараалал · 5 минут")}
          </small>
        </span>
        {strokesDone ? (
          <span className="text-sm font-bold text-[var(--app-primary)]">✓</span>
        ) : (
          <span className="wn-hd-new">{tr(locale, "Шинэ")}</span>
        )}
      </MobileCard>
    </Link>
  );

  if (!dash) return strokesCard;

  if (dash.total === 0) {
    return (
      <>
        <MobileCard className="mb-4">
          <p className="text-sm font-bold text-[var(--app-text)]">{tr(locale, "Миний ханз")}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--app-muted)]">
            {tr(locale, "Ханз бичиж эхлэхэд сурсан ханз, сул ханз, өнөөдөр сэргээх ханз чинь энд гарч ирнэ.")}
          </p>
        </MobileCard>
        {strokesCard}
      </>
    );
  }

  const sel = selected ? dash.all.find((h) => h.ch === selected.ch) ?? null : null;
  const stageOf = (h: HanziHistory) => hanziStage(h);

  return (
    <>
      <div className="wn-hd-stats">
        <div>
          <b>{dash.learned}</b>
          <small>{tr(locale, "сурсан ханз")}</small>
        </div>
        <div>
          <b className={dash.weak.length > 0 ? "is-weak" : ""}>{dash.weak.length}</b>
          <small>{tr(locale, "сул ханз")}</small>
        </div>
        <div>
          <b>{dash.today.length}</b>
          <small>{tr(locale, "өнөөдөр бичих")}</small>
        </div>
      </div>
      <button type="button" className="wn-hd-how" aria-expanded={showHow} onClick={() => setShowHow((v) => !v)}>
        ⓘ {tr(locale, "Яаж тоолдог вэ?")} {showHow ? "▴" : "▾"}
      </button>
      {showHow ? (
        <MobileCard className="mb-3 !py-3">
          <ul className="space-y-2 text-[13px] leading-snug text-[var(--app-text)]">
            <li>
              <b>{tr(locale, "Сурсан ханз")}</b> —{" "}
              {tr(locale, "загвар харахгүйгээр хоёр өөр өдөр санаж зөв бичсэн ханз. Нэг суултаар хэдэн ч удаа бичсэн, маргааш нь санаж чадаж байж сурсанд тооцно.")}
            </li>
            <li>
              <b>{tr(locale, "Сул ханз")}</b> —{" "}
              {tr(locale, "хамгийн сүүлд санаж бичихдээ сануулга авсан эсвэл 3-аас олон зураас алдсан ханз.")}
            </li>
            <li>
              <b>{tr(locale, "Өнөөдөр бичих")}</b> —{" "}
              {tr(locale, "сул ханз ба сэргээх өдөр нь болсон ханз.")}
            </li>
          </ul>
          <p className="mt-3 rounded-xl bg-[var(--app-primary-light)] px-3 py-2 text-xs leading-relaxed text-[var(--app-text)]">
            {tr(locale, "Яагаад ингэдэг вэ: шинээр цээжилсэн зүйл эхний хоногтоо хамгийн хурдан мартагддаг. Мартахын өмнөхөн сэргээн санавал дараагийн удаа илүү удаан тогтдог. Тиймээс завсрыг уртасгана:")}{" "}
            <b>{tr(locale, "маргааш → 3 хоног → 7 хоног → 21 хоног")}</b>.
          </p>
        </MobileCard>
      ) : null}

      <div className="app-course-card mb-4 p-4">
        {dash.today.length > 0 ? (
          <>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-white/85">
              {tr(locale, "Өнөөдөр бичих")}
            </p>
            <p className="mt-0.5 text-xl font-black text-white">
              {dash.today.length} {tr(locale, "ханз")}
            </p>
            <p className="text-xs font-semibold text-white/90">
              {[
                dash.todayWeak > 0 ? `${tr(locale, "сул")} ${dash.todayWeak}` : null,
                dash.todayRefresh > 0 ? `${tr(locale, "сэргээх")} ${dash.todayRefresh}` : null,
                `${tr(locale, "ойролцоогоор")} ${Math.max(1, Math.round((dash.todayWeak * 60 + dash.todayRefresh * 25) / 60))} ${tr(locale, "минут")}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <Link href="/writing/today" className="wn-hd-go">
              ▶ {tr(locale, "Бичиж эхлэх")}
            </Link>
          </>
        ) : (
          <>
            <p className="text-lg font-black text-white">✓ {tr(locale, "Өнөөдөр сэргээх ханз алга")}</p>
            <p className="mt-0.5 text-xs font-semibold text-white/90">
              {tr(locale, "Шинэ ханз бичих үү? Доороос ханзаа сонгоорой.")}
            </p>
          </>
        )}
      </div>

      {dash.weak.length > 0 ? (
        <section className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--app-text)]">{tr(locale, "Сул ханзууд")}</h2>
            <span className="text-xs text-[var(--app-muted)]">{tr(locale, "дарж түүхийг нь үз")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dash.weak.slice(0, 12).map((h) => (
              <button
                key={h.ch}
                type="button"
                translate="no"
                className={`wn-hd-chip is-weak ${sel?.ch === h.ch ? "is-sel" : ""}`}
                onClick={() => setSelected(sel?.ch === h.ch ? null : { ch: h.ch, from: "weak" })}
              >
                <i>{h.ch}</i>
                <small>
                  {h.mistakes} {tr(locale, "алдаа")}
                </small>
              </button>
            ))}
          </div>
          {sel && selected?.from === "weak" ? (
            <HistoryCard h={sel} locale={locale} onClose={() => setSelected(null)} />
          ) : null}
        </section>
      ) : null}

      {inReview.length > 0 ? (
        <section className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--app-text)]">
              {tr(locale, "Давталтад нэмсэн")} · {inReview.length}
            </h2>
            <Link href="/review/writing" className="text-xs font-semibold text-[var(--app-primary)]">
              {tr(locale, "Давтах → Бичих")} ›
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {inReview.map((h) => (
              <span key={h.ch} className="wn-hd-pill" translate="no">
                {h.ch}
                <button
                  type="button"
                  aria-label={tr(locale, "Давталтаас хасах")}
                  onClick={() => setHanziInReview([h.ch], false)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {strokesCard}

      <section className="mb-5">
        <button
          type="button"
          className="mb-2 flex w-full items-center justify-between"
          aria-expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
        >
          <h2 className="text-sm font-bold text-[var(--app-text)]">
            {tr(locale, "Бичсэн бүх ханз")} · {dash.total}
          </h2>
          <span className="text-xs font-semibold text-[var(--app-primary)]">
            {showAll ? tr(locale, "Хураах") : tr(locale, "Харах")} {showAll ? "▴" : "▾"}
          </span>
        </button>
        {showAll ? (
          <MobileCard className="!p-3">
            <div className="wn-hd-all">
              {dash.all.map((h) => (
                <button
                  key={h.ch}
                  type="button"
                  translate="no"
                  className={`is-${stageOf(h)} ${sel?.ch === h.ch ? "is-sel" : ""}`}
                  onClick={() => setSelected(sel?.ch === h.ch ? null : { ch: h.ch, from: "all" })}
                >
                  {h.ch}
                </button>
              ))}
            </div>
            <p className="wn-hd-legend">
              <span className="is-learned" /> {tr(locale, "сурсан")}
              <span className="is-learning" /> {tr(locale, "сурч буй")}
              <span className="is-weak" /> {tr(locale, "сул")}
            </p>
            {sel && selected?.from === "all" ? (
              <HistoryCard h={sel} locale={locale} onClose={() => setSelected(null)} />
            ) : null}
          </MobileCard>
        ) : null}
      </section>
    </>
  );
}
