"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ClassHomeCard } from "@/components/home/class-home-card";
import { PrefetchLink } from "@/components/navigation/prefetch-link";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { MobileCourseCatalogEntry } from "@/lib/mobile-course-options";
import type { StudyGroup, StudyGroupMember } from "@/lib/supabase/classrooms";

const FOCUS_KEY = "bs:homeFocus";
const GROUP_SNAPSHOT_KEY = "bs:homeGroup.v1";

type Focus = "group" | "own";

/** Өөрийн номын «одоо хийх зүйл». */
export type OwnBookFocus = {
  /** Номын богино нэр (жишээ нь «HSK 4»). */
  label: string;
  nextHref: string | null;
  nextTitle: string;
  completed: number;
  total: number;
  /** Үргэлжлүүлэх холбоос бодит утгаа авсан эсэх (prefetch). */
  resolved: boolean;
};

type Props = {
  loggedIn: boolean;
  own: OwnBookFocus;
  onChangeBook: () => void;
  catalog: MobileCourseCatalogEntry[];
  fazhanCatalog: MobileCourseCatalogEntry[];
  /** Өдрийн бүтэн төлөвлөгөө — «Өөрийн ном» талд хураалттай гарна. */
  todayPlan: ReactNode;
};

type GoalLine = {
  key: "words" | "lessons" | "tests";
  done: number;
  target: number;
  /** «Өнөөдөр 20 үг цээжлэх» */
  label: string;
  /** Том гарчигт: «20 үг цээжлэх» */
  short: string;
};

function goalLines(group: StudyGroup, me: StudyGroupMember | null, t: (s: string) => string): GoalLine[] {
  const lines: GoalLine[] = [];
  if (group.goalWordsPerDay) {
    lines.push({
      key: "words",
      done: me?.wordsToday ?? 0,
      target: group.goalWordsPerDay,
      label: `${t("Өнөөдөр")} ${group.goalWordsPerDay} ${t("үг цээжлэх")}`,
      short: `${group.goalWordsPerDay} ${t("үг цээжлэх")}`,
    });
  }
  if (group.goalLessonsPerWeek) {
    lines.push({
      key: "lessons",
      done: me?.lessonsWeek ?? 0,
      target: group.goalLessonsPerWeek,
      label: `${t("Энэ 7 хоногт")} ${group.goalLessonsPerWeek} ${t("хичээл үзэх")}`,
      short: `${group.goalLessonsPerWeek} ${t("хичээл үзэх")}`,
    });
  }
  if (group.goalTestsPerWeek) {
    lines.push({
      key: "tests",
      done: me?.testsWeek ?? 0,
      target: group.goalTestsPerWeek,
      label: `${t("Энэ 7 хоногт")} ${group.goalTestsPerWeek} ${t("тест ажиллах")}`,
      short: `${group.goalTestsPerWeek} ${t("тест ажиллах")}`,
    });
  }
  return lines;
}

const bigButton =
  "mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-4 text-base font-extrabold text-white active:bg-[var(--app-primary-dark)]";
const heroCard = "rounded-[22px] bg-[var(--app-primary-light)] p-5";
const kicker = "text-xs font-bold text-[var(--app-primary-dark)]";
const heroTitle = "mt-1 text-xl font-black leading-snug text-[var(--app-text)]";
const rowLink =
  "mt-3 flex min-h-[48px] w-full items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-2.5 text-left text-sm font-semibold text-[var(--app-text)]";
const smallButton =
  "flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 text-sm font-bold text-[var(--app-text)]";

function Bar({ done, target }: { done: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  return (
    <span className="mt-3 block h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--app-primary)_22%,transparent)]">
      <span className="block h-full rounded-full bg-[var(--app-primary)]" style={{ width: `${pct}%` }} />
    </span>
  );
}

/**
 * Нүүрийн төвлөрөл: «Бүлэг / Өөрийн ном» сэлгэгч. Сонгосон тал нь нэг том «одоо хийх зүйл»-тэй
 * гарч, нөгөө тал нь нэг мөр болж хураагдана. Бүлэггүй хүнд сэлгэгч харагдахгүй.
 */
export function HomeFocus({ loggedIn, own, onChangeBook, catalog, fazhanCatalog, todayPlan }: Props) {
  const locale = useUiLocale();
  const t = (text: string) => tr(locale, text);
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [focus, setFocus] = useState<Focus>("group");

  // Сүүлийн харагдацыг шууд үзүүлээд (анивчихгүй), дараа нь серверээс шинэчилнэ.
  useEffect(() => {
    if (!loggedIn) {
      setGroup(null);
      return;
    }
    try {
      if (window.localStorage.getItem(FOCUS_KEY) === "own") setFocus("own");
      const raw = window.localStorage.getItem(GROUP_SNAPSHOT_KEY);
      if (raw) setGroup(JSON.parse(raw) as StudyGroup);
    } catch {
      // ignore
    }
    let alive = true;
    const load = async () => {
      try {
        const { getMyStudyGroup } = await import("@/lib/supabase/classrooms");
        const mine = await getMyStudyGroup();
        if (!alive) return;
        setGroup(mine);
        try {
          if (mine) window.localStorage.setItem(GROUP_SNAPSHOT_KEY, JSON.stringify(mine));
          else window.localStorage.removeItem(GROUP_SNAPSHOT_KEY);
        } catch {
          // ignore
        }
      } catch {
        // Уншиж чадаагүй бол сүүлийн харагдац үлдэнэ.
      }
    };
    void load();
    // Үг цээжлээд буцаж ирэхэд тоо шинэчлэгдэнэ.
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [loggedIn]);

  const pick = (next: Focus) => {
    setFocus(next);
    try {
      window.localStorage.setItem(FOCUS_KEY, next);
    } catch {
      // ignore
    }
  };

  const groupLabel = group?.kind === "class" ? t("Анги") : t("Бүлэг");
  const ownPercentText = own.total > 0 ? `${own.completed}/${own.total}` : "";

  const ownHero = (
    <section className="bs-page-in">
      <div className={heroCard}>
        <p className={kicker}>
          {t("Өөрийн ном")}
          {own.label ? ` · ${own.label}` : ""}
        </p>
        <p className="mt-3 text-sm font-semibold text-[var(--app-muted)]">{t("Одоо хийх зүйл")}</p>
        {own.nextHref ? (
          <>
            <p className={heroTitle} translate="no">
              {own.nextTitle}
            </p>
            {own.total > 0 ? (
              <>
                <Bar done={own.completed} target={own.total} />
                <p className="mt-2 text-xs font-semibold text-[var(--app-muted)]">
                  {own.completed}/{own.total} {t("хичээл дууссан")}
                </p>
              </>
            ) : null}
            <PrefetchLink href={own.nextHref} eager={own.resolved} className={bigButton}>
              {own.completed > 0 ? t("Үргэлжлүүлэх") : t("Эхлэх")} <span aria-hidden>→</span>
            </PrefetchLink>
          </>
        ) : (
          <>
            <p className={heroTitle}>{t("Номоо сонгоод эхэл")}</p>
            <button type="button" onClick={onChangeBook} className={bigButton}>
              {t("Ном сонгох")} <span aria-hidden>→</span>
            </button>
          </>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/review/daily" className={smallButton}>
          <span aria-hidden>🧠</span> {t("Өнөөдрийн үг")}
        </Link>
        <button type="button" onClick={onChangeBook} className={smallButton}>
          <span aria-hidden>📚</span> {t("Ном солих")}
        </button>
      </div>
      <details className="bs-home-plan mt-3">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between rounded-2xl px-1 text-sm font-semibold text-[var(--app-muted)] [&::-webkit-details-marker]:hidden">
          {t("Өнөөдрийн бүтэн төлөвлөгөө")}
          <span aria-hidden>▾</span>
        </summary>
        {todayPlan}
      </details>
    </section>
  );

  // --- Бүлэггүй хүн: зөвхөн өөрийн ном + нэг мөр ---
  if (!group) {
    return (
      <div className="mb-5">
        {ownHero}
        <Link href="/join" className={rowLink}>
          <span aria-hidden>👥</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{t("Хамт сурах бүлэг")}</span>
            <span className="block text-xs font-normal text-[var(--app-muted)]">
              {t("Найзуудтайгаа зорилго тавиад хамт сур")}
            </span>
          </span>
          <span className="text-[var(--app-muted)]" aria-hidden>›</span>
        </Link>
      </div>
    );
  }

  const me = group.members.find((m) => m.isMe) ?? null;
  const lines = goalLines(group, me, t);
  const hasGoals = lines.length > 0;
  const pending = lines.find((line) => line.done < line.target) ?? null;
  const primary = lines[0] ?? null;

  let action: { href: string; label: string } | null = null;
  if (!group.isStudyDay) {
    action = { href: own.nextHref ?? "/nom", label: t("Хүсвэл хичээлээ үзэх") };
  } else if (pending?.key === "words") {
    action = {
      href: "/review/daily",
      label:
        pending.done > 0
          ? `${t("Үлдсэн")} ${pending.target - pending.done} ${t("үгээ цээжлэх")}`
          : t("Үгээ цээжилж эхлэх"),
    };
  } else if (pending?.key === "lessons") {
    action = { href: own.nextHref ?? "/nom", label: t("Дараагийн хичээлээ үзэх") };
  } else if (pending?.key === "tests") {
    action = { href: "/mock-tests", label: t("Тест ажиллах") };
  } else {
    action = { href: own.nextHref ?? "/nom", label: t("Цааш үргэлжлүүлэх") };
  }

  const memberValue = (m: StudyGroupMember) => {
    if (!primary) return "";
    const value = primary.key === "words" ? m.wordsToday : primary.key === "lessons" ? m.lessonsWeek : m.testsWeek;
    return `${value}/${primary.target}`;
  };
  const memberDone = (m: StudyGroupMember) => {
    if (!primary) return false;
    const value = primary.key === "words" ? m.wordsToday : primary.key === "lessons" ? m.lessonsWeek : m.testsWeek;
    return value >= primary.target;
  };

  const groupHero = hasGoals ? (
    <section className="bs-page-in">
      <div className={heroCard}>
        <p className={kicker}>
          <span translate="no">{group.name}</span> · {group.memberCount} {t("хүн")}
        </p>
        {!group.isStudyDay ? (
          <>
            <p className="mt-3 text-sm font-semibold text-[var(--app-muted)]">{t("Өнөөдөр")}</p>
            <p className={heroTitle}>{t("Амралтын өдөр. Хүсвэл үргэлжлүүл.")}</p>
          </>
        ) : pending ? (
          <>
            <p className="mt-3 text-sm font-semibold text-[var(--app-muted)]">
              {pending.key === "words" ? t("Өнөөдрийн зорилго") : t("Энэ 7 хоногийн зорилго")}
            </p>
            <p className={heroTitle}>
              {pending.short} · {pending.done}/{pending.target}
            </p>
            <Bar done={pending.done} target={pending.target} />
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-semibold text-[var(--app-muted)]">{t("Бүлгийн зорилго")}</p>
            <p className={heroTitle}>{t("Зорилгоо биелүүллээ. Сайн байна!")} 🎉</p>
          </>
        )}
        {lines.filter((line) => line !== pending || !group.isStudyDay).length > 0 ? (
          <ul className="mt-3 space-y-1">
            {lines
              .filter((line) => line !== pending || !group.isStudyDay)
              .map((line) => (
                <li key={line.key} className="flex justify-between gap-2 text-xs font-semibold text-[var(--app-muted)]">
                  <span>{line.label}</span>
                  <span className={line.done >= line.target ? "text-[var(--app-primary-dark)]" : ""}>
                    {line.done >= line.target ? "✓ " : ""}
                    {line.done}/{line.target}
                  </span>
                </li>
              ))}
          </ul>
        ) : null}
        {action ? (
          <PrefetchLink href={action.href} className={bigButton}>
            {action.label} <span aria-hidden>→</span>
          </PrefetchLink>
        ) : null}
      </div>

      {group.members.length > 0 && primary ? (
        <div className="mt-3 rounded-[22px] border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-2 shadow-[var(--app-shadow)]">
          <p className="pt-2 text-xs font-bold text-[var(--app-muted)]">
            {primary.key === "words" ? t("Өнөөдөр хэн хийсэн бэ") : t("Энэ 7 хоногт хэн хийсэн бэ")}
          </p>
          <ul>
            {group.members.slice(0, 8).map((m, index) => (
              <li
                key={`${m.name}-${index}`}
                className="flex items-center gap-2 border-t border-[var(--app-border)] py-2.5 text-sm first:border-t-0"
              >
                <span className={`min-w-0 flex-1 truncate ${m.isMe ? "font-extrabold" : "font-semibold"} text-[var(--app-text)]`}>
                  {m.isMe ? t("Чи") : <span translate="no">{m.name}</span>}
                </span>
                {m.streak > 1 ? (
                  <span className="shrink-0 text-xs font-semibold text-[var(--app-muted)]">
                    🔥 {m.streak}
                  </span>
                ) : null}
                <span
                  className={`shrink-0 text-sm font-extrabold ${
                    memberDone(m) ? "text-[var(--app-primary-dark)]" : "text-[var(--app-muted)]"
                  }`}
                >
                  {memberDone(m) ? "✓ " : ""}
                  {memberValue(m)}
                </span>
              </li>
            ))}
          </ul>
          {group.memberCount > 8 ? (
            <p className="border-t border-[var(--app-border)] py-2 text-xs font-semibold text-[var(--app-muted)]">
              {t("Нийт")} {group.memberCount} {t("хүн")}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  ) : group.hskLevel != null ? (
    // Зорилгогүй (багшийн) анги: түвшиндээ тохирсон жагсаалт.
    <ClassHomeCard
      loggedIn={loggedIn}
      catalog={catalog}
      fazhanCatalog={fazhanCatalog}
      classroom={{ id: group.id, name: group.name, hskLevel: group.hskLevel }}
    />
  ) : (
    <section className="bs-page-in">
      <div className={heroCard}>
        <p className={kicker}>{group.kind === "class" ? t("Миний анги") : t("Миний бүлэг")}</p>
        <p className={heroTitle} translate="no">
          {group.name}
        </p>
        <PrefetchLink href={own.nextHref ?? "/nom"} className={bigButton}>
          {t("Дараагийн хичээлээ үзэх")} <span aria-hidden>→</span>
        </PrefetchLink>
      </div>
    </section>
  );

  return (
    <div className="mb-5">
      <div
        role="tablist"
        aria-label={t("Нүүрийн төвлөрөл")}
        className="mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-[color-mix(in_srgb,var(--app-primary)_10%,transparent)] p-1"
      >
        {(["group", "own"] as const).map((key) => {
          const on = focus === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => pick(key)}
              className={`min-h-[44px] rounded-xl text-sm font-extrabold transition-colors ${
                on
                  ? "bg-[var(--app-card)] text-[var(--app-primary-dark)] shadow-sm"
                  : "text-[var(--app-muted)]"
              }`}
            >
              {key === "group" ? groupLabel : t("Өөрийн ном")}
            </button>
          );
        })}
      </div>

      {focus === "group" ? (
        <>
          {groupHero}
          <button type="button" onClick={() => pick("own")} className={rowLink}>
            <span aria-hidden>📖</span>
            <span className="min-w-0 flex-1 truncate">
              {t("Өөрийн ном")}
              {own.label ? `: ${own.label}` : ""}
              {ownPercentText ? ` · ${ownPercentText}` : ""}
            </span>
            <span className="text-[var(--app-muted)]" aria-hidden>›</span>
          </button>
          <Link
            href="/join"
            className="mt-2 flex min-h-[44px] items-center justify-center text-xs font-semibold text-[var(--app-muted)] underline underline-offset-2"
          >
            {group.kind === "class" ? t("Ангийн тохиргоо, гарах") : t("Бүлгийн тохиргоо, урих код, гарах")}
          </Link>
        </>
      ) : (
        <>
          {ownHero}
          <button type="button" onClick={() => pick("group")} className={rowLink}>
            <span aria-hidden>👥</span>
            <span className="min-w-0 flex-1 truncate">
              {group.kind === "class" ? t("Миний анги") : t("Миний бүлэг")}: <span translate="no">{group.name}</span>
              {pending ? ` · ${pending.done}/${pending.target}` : hasGoals ? " · ✓" : ""}
            </span>
            <span className="text-[var(--app-muted)]" aria-hidden>›</span>
          </button>
        </>
      )}
    </div>
  );
}
