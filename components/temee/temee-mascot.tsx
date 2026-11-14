"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { getLocalRetentionSummary } from "@/lib/retention/daily-activity";
import { temeePoseSrc, type TemeePose } from "@/lib/temee/poses";
import "./temee-mascot.css";

export type TemeeMood = "happy" | "normal" | "sad" | "sleepy";

/** Сүүлд идэвхтэй байсан өдөр — гунигтай Тэмээ (3+ хоног ороогүй). */
export const TEMEE_LAST_ACTIVE_KEY = "buunduu-temee-last-active-v1";

const LINES: Record<TemeeMood, string[]> = {
  happy: [
    "Сайхан байна! Өнөөдөр дахиад нэг алхам урагшиллаа.",
    "Маш сайн! Тэмээ чамаар бахархаж байна 🎉",
    "Яг ингээд л яв. Бүү зогс!",
    "Дараалсан өдрөө тасалдуулаагүй чинь гоё байна 🔥",
    "Өнөөдрийнхөө хувийг хийчихлээ. Маргааш уулзъя!",
    "Хичээл бүр нэг алхам. Чи зогсолтгүй явж байна!",
    "加油! Чи чадна гэдэгт би итгэж байна.",
  ],
  normal: [
    "Сайн уу! Өнөөдөр хэдэн шинэ үг сурах вэ?",
    "Өдөрт ердөө 10 минут — тасралтгүй хийвэл их хол явна.",
    "Давтах цаг боллоо. Нэг хурдан давталт хийх үү?",
    "Өнөөдөр ганц шинэ ханз сурахад л хангалттай.",
    "Тэмээ бэлэн байна. Юунаас эхлэх вэ?",
    "你好! Өнөөдрийн хичээлээ эхлэх үү?",
    "Бага багаар, гэхдээ өдөр бүр. Нууц нь энэ л дээ.",
  ],
  sad: [
    "Чамайг санаж байна шүү… Хэд хоног уулзсангүй.",
    "Сурсан үгс чинь мартагдаж эхэллээ. Жаахан давтах уу?",
    "Эргээд ирсэнд баяртай байна. Богино давталтаар эхлэх үү?",
    "Тэмээ чамгүйгээр уйдчихлаа. 5 минут хамт сурах уу?",
    "Өнөөдрөөс дахин эхэлье!",
    "Зүгээр ээ, амрах ч хэрэгтэй. Одоо үргэлжлүүлье.",
  ],
  sleepy: [
    "Zzz… Орой болжээ. Ганц үг давтаад амрах уу?",
    "Тэмээ нойр хүрч байна. Чи ч бас сайхан амраарай.",
    "Унтахын өмнө давтвал сайн тогтдог гэдэг. Богинохон давталт хийх үү?",
    "Zzz… Маргааш өглөө сэргэг сайхан уулзъя!",
    "Унтахын өмнө 3 ханз сур — шөнө тархи чинь өөрөө давтана.",
    "Шөнөөр хичээллэдэг юм уу? Нүдээ амраахаа бүү мартаарай.",
  ],
};

/** Сэтгэл санаа бүрт тохирох зураг. */
const MOOD_POSE: Record<TemeeMood, TemeePose> = {
  happy: "celebrate",
  normal: "wave",
  sad: "encourage",
  sleepy: "sleep",
};

export function recordTemeeActive(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEMEE_LAST_ACTIVE_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

/** Нэг session-д нэг л удаа тооцоолно — recordTemeeActive() дуудсаны дараа ч дүр солигдож анивчихгүй. */
let cachedAwayDays: number | null = null;

function daysSinceLastActive(): number {
  if (typeof window === "undefined") return 0;
  if (cachedAwayDays !== null) return cachedAwayDays;
  cachedAwayDays = computeAwayDays();
  return cachedAwayDays;
}

function computeAwayDays(): number {
  try {
    const raw = localStorage.getItem(TEMEE_LAST_ACTIVE_KEY);
    if (raw) {
      const t = Date.parse(raw);
      if (Number.isFinite(t)) return Math.floor((Date.now() - t) / 86_400_000);
    }
    const last = getLocalRetentionSummary().lastActiveDate;
    if (last) {
      const t = Date.parse(last);
      if (Number.isFinite(t)) return Math.floor((Date.now() - t) / 86_400_000);
    }
  } catch {
    // ignore
  }
  return 0;
}

/** Тэмээний сэтгэл санааг автоматаар тодорхойлно (шөнө / 3+ хоног ороогүй / streak). */
export function resolveTemeeMood(opts: { streak?: number; celebrate?: boolean } = {}): TemeeMood {
  if (opts.celebrate) return "happy";
  if (typeof window === "undefined") return "normal";
  const hour = new Date().getHours();
  const away = daysSinceLastActive();
  if (away >= 3) return "sad";
  if (hour >= 23 || hour < 5) return "sleepy";
  if ((opts.streak ?? 0) >= 3) return "happy";
  return "normal";
}

function subscribeNoop() {
  return () => {};
}

function dayNumber(): number {
  return Math.floor(Date.now() / 86_400_000);
}

type Props = {
  /** Тодорхой заавал өгвөл автомат тодорхойлолтыг дарна. */
  mood?: TemeeMood;
  /** Streak (өдөр) — 3+ бол баяртай. */
  streak?: number;
  /** Хичээл/сорил дууссаны дараа — үргэлж баяртай. */
  celebrate?: boolean;
  /** Реплик нуух (зөвхөн дүр). */
  hideLine?: boolean;
  /** Өөрийн реплик — LINES-ийн оронд. */
  line?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Идэвхтэй гэж тэмдэглэх (localStorage last-active). Өгөгдмөл true. */
  touch?: boolean;
};

/**
 * Тэмээ багш — зурагтай дүр + CSS анимейшн (сэтгэл санаа бүрт өөр зураг).
 * Нүүр, хичээлийн дүгнэлт, давтах хуудсанд хэрэглэнэ.
 * state: happy (bounce+wave), normal (float+blink), sad (droop), sleepy (zzz).
 */
export function TemeeMascot({
  mood,
  streak = 0,
  celebrate = false,
  hideLine = false,
  line,
  size = "md",
  className = "",
  touch = true,
}: Props) {
  const locale = useUiLocale();
  // Клиент дээр localStorage/цагаас тооцоолно; SSR-д "normal" (hydration алдаагүй).
  const autoMood = useSyncExternalStore(
    subscribeNoop,
    () => resolveTemeeMood({ streak, celebrate }),
    () => "normal" as TemeeMood
  );
  const resolved: TemeeMood = mood ?? autoMood;
  // Реплик: өдөр бүр өөр, дарахад дараагийнх.
  const daySeed = useSyncExternalStore(subscribeNoop, dayNumber, () => 0);
  const [clicks, setClicks] = useState(0);
  const seed = daySeed + clicks;

  useEffect(() => {
    if (touch) recordTemeeActive();
  }, [touch]);

  const text = useMemo(() => {
    if (line) return line;
    const pool = LINES[resolved];
    return pool[seed % pool.length];
  }, [line, resolved, seed]);

  const badge =
    resolved === "happy" ? "✨" : resolved === "sad" ? "💧" : resolved === "sleepy" ? "💤" : "👋";

  return (
    <div
      className={`bs-mascot bs-mascot--${resolved} bs-mascot--${size} ${className}`.trim()}
      data-mood={resolved}
    >
      <button
        type="button"
        className="bs-mascot-figure"
        onClick={() => setClicks((c) => c + 1)}
        aria-label="Тэмээ багш"
        title="Тэмээ"
      >
        <span className="bs-mascot-body" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={temeePoseSrc(MOOD_POSE[resolved], size === "lg" ? "lg" : "sm")} alt="" draggable={false} />
        </span>
        <span className="bs-mascot-badge" aria-hidden>
          {badge}
        </span>
      </button>
      {!hideLine ? (
        <p className="bs-mascot-line" key={`${resolved}-${seed}`}>
          {tr(locale, text)}
        </p>
      ) : null}
    </div>
  );
}
