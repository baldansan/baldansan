"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { getLocalRetentionSummary } from "@/lib/retention/daily-activity";
import "./temee-mascot.css";

export type TemeeMood = "happy" | "normal" | "sad" | "sleepy";

/** Сүүлд идэвхтэй байсан өдөр — гунигтай Тэмээ (3+ хоног ороогүй). */
export const TEMEE_LAST_ACTIVE_KEY = "buunduu-temee-last-active-v1";

const LINES: Record<TemeeMood, string[]> = {
  happy: [
    "Гайхалтай! Өнөөдөр бас нэг алхам урагшиллаа.",
    "Чи үнэхээр сайн байна! Тэмээ бахархаж байна 🎉",
    "Яг ийм л байх ёстой — үргэлжлүүл!",
    "Галаа унтраалгүй байгаа чинь сайхан байна 🔥",
    "Өнөөдрийн ажил бүтлээ. Маргааш уулзъя!",
    "Нэг хичээл = нэг алхам. Чи яваад л байна!",
    "加油! Чи чадна гэдгийг би мэднэ.",
  ],
  normal: [
    "Сайн уу! Өнөөдөр хэдэн үг сурах вэ?",
    "Өдөрт 10 минут ч гэсэн их хол аваачна.",
    "Давтах цаг боллоо — хурдан нэг тойрог хийх үү?",
    "Шинэ ханз нэгийг таньж аваад л өнөөдрийг ялж болно.",
    "Тэмээ хүлээж байна. Хаанаас эхлэх вэ?",
    "你好! Өнөөдрийн хичээлээ эхлүүлэх үү?",
    "Бага багаар, өдөр бүр — энэ л нууц.",
  ],
  sad: [
    "Чамайг санасан шүү… Хэд хоног уулзсангүй.",
    "Сурсан үгс мартагдаж эхлэв. Жаахан давтах уу?",
    "Буцаж ирсэнд баярлалаа. Богинохон давталтаас эхлэе?",
    "Тэмээ ганцаардаж байлаа. Хамт 5 минут суръя?",
    "Галыг дахин асаая — өнөөдрөөс!",
    "Зүгээр ээ, завсарлага хэрэгтэй байсан биз. Одоо үргэлжлүүлье.",
  ],
  sleepy: [
    "Zzz… Шөнө орой боллоо. Нэг л үг давтаад амрах уу?",
    "Тэмээ нойрмоглож байна. Чи ч бас сайхан амраарай.",
    "Оройн давталт сайн тогтдог гэдэг. Богинохон хийе?",
    "Zzz… Маргааш өглөө сэргэг уулзъя!",
    "Унтахын өмнө 3 ханз — тархи шөнө давтана.",
    "Шөнийн суралцагч уу? Нүдээ амраахаа мартуузай.",
  ],
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
 * Тэмээ багш — emoji + CSS анимейшнтэй дүр (зураг хэрэггүй).
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
          🐫
        </span>
        <span className="bs-mascot-eyes" aria-hidden />
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
