"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createReminderUnified,
  deleteReminderUnified,
  getRemindersUnified,
} from "@/lib/engagement/engagement-service";
import { WEEKDAY_KEYS, type StudyReminder, type WeekdayKey } from "@/lib/engagement/types";
import { getLessonProgressMapSmart } from "@/lib/progress";
import { enableNativePush, isNativeApp } from "@/lib/push/native-push-client";
import { getPushAvailability, subscribeToPush } from "@/lib/push/push-client";
import { getDailyGoalUnified, setDailyGoalUnified } from "@/lib/retention/retention-service";
import type { DailyGoal } from "@/lib/retention/types";
import {
  EXAM_GOAL_EVENT,
  daysBetween,
  fetchLevelLessonIds,
  formatMnDate,
  loadExamGoal,
  saveExamGoal,
  todayYmd,
  type ExamGoal,
} from "@/lib/study-plan/exam-goal";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

/**
 * «Миний сурах систем» — сурагч өөрөө тохируулна:
 * аль түвшинд, хэзээ гэхэд хүрэх · өдөрт хэдэн үг цээжлэх · хэдэн цагт сануулах.
 * Хадгалалт: user_exam_goals (095), user_daily_goals (009), user_study_reminders (010)
 * — шинэ хүснэгт хэрэггүй; нэвтрээгүй бол төхөөрөмж дээр.
 */

const SET_KEY = "bs.study.system.v1";
const REMINDER_TYPE = "daily_study";
const WORD_CHIPS = [5, 10, 15, 20, 30, 50];
const DATE_CHIPS: { label: string; days: number }[] = [
  { label: "1 сар", days: 30 },
  { label: "3 сар", days: 91 },
  { label: "6 сар", days: 182 },
  { label: "1 жил", days: 365 },
];
const DAY_MN: Record<WeekdayKey, string> = {
  mon: "Да",
  tue: "Мя",
  wed: "Лх",
  thu: "Пү",
  fri: "Ба",
  sat: "Бя",
  sun: "Ня",
};

type Level = ExamGoal["level"];
type WordStat = { total: number; mastered: number };

function addDaysYmd(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return todayYmd(d);
}

export function isStudySystemSet(): boolean {
  try {
    return window.localStorage.getItem(SET_KEY) === "1";
  } catch {
    return false;
  }
}

/** Тухайн түвшний нийт үг ба үүнээс сурагчийн «цээжилсэн» тоо. */
async function fetchWordStat(level: number): Promise<WordStat | null> {
  if (!supabase || !hasSupabaseConfig) return null;
  try {
    const { count } = await supabase
      .from("hsk_words")
      .select("id", { count: "exact", head: true })
      .eq("hsk_level", String(level))
      .eq("is_function_word", false);
    const total = count ?? 0;
    if (!total) return null;

    let mastered = 0;
    const { userId } = await getAuthenticatedUserId();
    if (userId) {
      const ids: number[] = [];
      for (let from = 0; from < 8000; from += 1000) {
        const { data, error } = await supabase
          .from("user_word_srs")
          .select("word_id")
          .eq("user_id", userId)
          .gte("interval_days", 21)
          .range(from, from + 999);
        if (error || !data?.length) break;
        ids.push(...data.map((r) => Number(r.word_id)));
        if (data.length < 1000) break;
      }
      for (let i = 0; i < ids.length; i += 300) {
        const { count: c } = await supabase
          .from("hsk_words")
          .select("id", { count: "exact", head: true })
          .eq("hsk_level", String(level))
          .eq("is_function_word", false)
          .in("id", ids.slice(i, i + 300));
        mastered += c ?? 0;
      }
    }
    return { total, mastered: Math.min(mastered, total) };
  } catch {
    return null;
  }
}

function daysText(days: WeekdayKey[]): string {
  if (days.length === 7) return "өдөр бүр";
  if (days.length === 5 && !days.includes("sat") && !days.includes("sun")) return "ажлын өдрүүдэд";
  return WEEKDAY_KEYS.filter((d) => days.includes(d))
    .map((d) => DAY_MN[d])
    .join(", ");
}

type Props = { variant?: "full" | "prompt" };

export function MyStudySystem({ variant = "full" }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isSet, setIsSet] = useState(false);
  const [goal, setGoal] = useState<ExamGoal | null>(null);
  const [daily, setDaily] = useState<DailyGoal | null>(null);
  const [reminder, setReminder] = useState<StudyReminder | null>(null);
  const [stats, setStats] = useState<Record<number, WordStat | null>>({});

  const [editing, setEditing] = useState(false);
  const [level, setLevel] = useState<Level>(3);
  const [date, setDate] = useState("");
  const [words, setWords] = useState(10);
  const [remindOn, setRemindOn] = useState(true);
  const [time, setTime] = useState("20:00");
  const [days, setDays] = useState<WeekdayKey[]>([...WEEKDAY_KEYS]);
  const [busy, setBusy] = useState(false);
  const [pushNote, setPushNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [g, d, rs] = await Promise.all([
      loadExamGoal().catch(() => null),
      getDailyGoalUnified().catch(() => null),
      getRemindersUnified().catch(() => [] as StudyReminder[]),
    ]);
    setGoal(g);
    setDaily(d);
    setReminder(rs.find((r) => r.reminderType === REMINDER_TYPE && r.enabled) ?? null);
    setIsSet(isStudySystemSet() || Boolean(g));
    setReady(true);
  }, []);

  useEffect(() => {
    const run = () => void refresh();
    run();
    window.addEventListener(EXAM_GOAL_EVENT, run);
    return () => window.removeEventListener(EXAM_GOAL_EVENT, run);
  }, [refresh]);

  const statLevel = editing ? level : goal?.level;
  useEffect(() => {
    if (!statLevel || variant === "prompt" || statLevel in stats) return;
    let alive = true;
    void fetchWordStat(statLevel).then((s) => {
      if (alive) setStats((prev) => ({ ...prev, [statLevel]: s }));
    });
    return () => {
      alive = false;
    };
  }, [statLevel, stats, variant]);

  const stat = statLevel ? stats[statLevel] : null;
  const remainingWords = stat ? Math.max(0, stat.total - stat.mastered) : null;

  const calc = useMemo(() => {
    const target = editing ? date : goal?.examDate;
    const perDay = editing ? words : daily?.wordsPerDay;
    if (!target || !perDay || remainingWords == null) return null;
    const daysLeft = Math.max(0, daysBetween(todayYmd(), target));
    const needDays = Math.ceil(remainingWords / perDay);
    const needPerDay = daysLeft > 0 ? Math.ceil(remainingWords / daysLeft) : remainingWords;
    return { daysLeft, needDays, needPerDay, ok: needDays <= daysLeft };
  }, [editing, date, words, goal, daily, remainingWords]);

  if (!ready) return null;

  const openEditor = () => {
    setLevel(goal?.level ?? 3);
    setDate(goal?.examDate ?? addDaysYmd(91));
    setWords(daily?.wordsPerDay && isSet ? daily.wordsPerDay : 10);
    setRemindOn(isSet ? Boolean(reminder) : true);
    setTime(reminder?.reminderTime ?? "20:00");
    setDays(reminder?.daysOfWeek?.length ? reminder.daysOfWeek : [...WEEKDAY_KEYS]);
    setPushNote(null);
    setEditing(true);
  };

  const save = async () => {
    if (!date || busy) return;
    setBusy(true);
    try {
      const ids = await fetchLevelLessonIds(level);
      const { byLesson } = await getLessonProgressMapSmart(ids);
      const keepStart = goal && goal.level === level;
      await saveExamGoal({
        level,
        examDate: date,
        startDate: keepStart ? goal.startDate : todayYmd(),
        startCompleted: keepStart
          ? goal.startCompleted
          : ids.filter((id) => byLesson[id] === "completed").length,
      });

      const base = daily ?? { lessonsPerDay: 1, wordsPerDay: 5, quizzesPerDay: 1 };
      await setDailyGoalUnified({ ...base, wordsPerDay: Math.max(1, Math.min(200, words)) });

      const existing = (await getRemindersUnified()).filter((r) => r.reminderType === REMINDER_TYPE);
      for (const r of existing) await deleteReminderUnified(r.id);
      let note: string | null = null;
      if (remindOn && days.length) {
        await createReminderUnified({
          reminderType: REMINDER_TYPE,
          title: `Өнөөдрийн ${words} үгээ цээжлэх цаг боллоо`,
          reminderTime: time,
          daysOfWeek: days,
          enabled: true,
        });
        // Утсанд мэдэгдэл ирүүлэхийг оролдоно; болохгүй бол апп доторх сануулга үлдэнэ.
        let pushed = false;
        try {
          if (isNativeApp()) pushed = (await enableNativePush()).ok;
          else if (getPushAvailability() === "ready") pushed = (await subscribeToPush()).ok;
        } catch {
          pushed = false;
        }
        note = pushed
          ? `Өдөр бүр ${time}-д утсанд чинь мэдэгдэл ирнэ.`
          : `Мэдэгдлийн зөвшөөрөл аваагүй тул ${time}-аас хойш апп нээхэд сануулна.`;
      }
      try {
        window.localStorage.setItem(SET_KEY, "1");
      } catch {
        /* ignore */
      }
      setPushNote(note);
      setEditing(false);
      await refresh();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Нүүр хуудасны жижиг урилга ---------- */
  if (variant === "prompt") {
    if (isSet) return null;
    return (
      <Link href="/study-plan" className="bs-mss-prompt">
        <span className="bs-mss-prompt-ico" aria-hidden>
          🎯
        </span>
        <span className="bs-mss-prompt-body">
          <span className="bs-mss-prompt-title">Өөрийн сурах системээ тохируул</span>
          <span className="bs-mss-prompt-sub">Зорилго · өдөрт хэдэн үг · хэдэн цагт сануулах</span>
        </span>
        <span aria-hidden className="bs-mss-prompt-arrow">
          ›
        </span>
      </Link>
    );
  }

  /* ---------- Тохируулах хэсэг ---------- */
  if (editing) {
    return (
      <section className="bs-study-plan-goal-card bs-mss">
        <h2 className="bs-study-plan-goal-title">Миний сурах систем</h2>

        <p className="bs-mss-q">1. Аль түвшинд хүрэх вэ?</p>
        <div className="bs-mss-levels">
          {([1, 2, 3, 4, 5, 6] as const).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={level === n}
              onClick={() => setLevel(n)}
              className={`bs-mss-chip${level === n ? " bs-mss-chip--on" : ""}`}
            >
              HSK {n}
            </button>
          ))}
        </div>

        <p className="bs-mss-q">2. Хэзээ гэхэд?</p>
        <div className="bs-mss-chips">
          {DATE_CHIPS.map((c) => {
            const ymd = addDaysYmd(c.days);
            return (
              <button
                key={c.days}
                type="button"
                aria-pressed={date === ymd}
                onClick={() => setDate(ymd)}
                className={`bs-mss-chip${date === ymd ? " bs-mss-chip--on" : ""}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <input
          type="date"
          value={date}
          min={addDaysYmd(1)}
          onChange={(e) => setDate(e.target.value)}
          className="bs-mss-input"
          aria-label="Зорилгын өдөр"
        />

        <p className="bs-mss-q">3. Өдөрт хэдэн шинэ үг цээжлэх вэ?</p>
        <div className="bs-mss-chips">
          {WORD_CHIPS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={words === n}
              onClick={() => setWords(n)}
              className={`bs-mss-chip${words === n ? " bs-mss-chip--on" : ""}`}
            >
              {n}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={200}
            value={words}
            onChange={(e) => setWords(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
            className="bs-mss-num"
            aria-label="Өдрийн үгийн тоо"
          />
        </div>
        {calc && remainingWords != null ? (
          <p className={`bs-mss-calc${calc.ok ? "" : " bs-mss-calc--warn"}`}>
            HSK {level}-д цээжлээгүй {remainingWords} үг байна. Өдөрт {words} үг бол{" "}
            <b>{calc.needDays} өдөрт</b> дуусна —{" "}
            {calc.ok ? (
              "зорилгодоо амжина ✓"
            ) : (
              <>
                амжихгүй.{" "}
                <button type="button" className="bs-mss-fix" onClick={() => setWords(calc.needPerDay)}>
                  Өдөрт {calc.needPerDay} үг болгох
                </button>{" "}
                эсвэл өдрөө хойшлуул.
              </>
            )}
          </p>
        ) : null}

        <p className="bs-mss-q">4. Хэдэн цагт сануулах вэ?</p>
        <label className="bs-mss-toggle">
          <input type="checkbox" checked={remindOn} onChange={(e) => setRemindOn(e.target.checked)} />
          <span>Сануулга авна</span>
        </label>
        {remindOn ? (
          <>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value || "20:00")}
              className="bs-mss-input"
              aria-label="Сануулах цаг"
            />
            <div className="bs-mss-days">
              {WEEKDAY_KEYS.map((d) => {
                const on = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDays((prev) => (on ? prev.filter((x) => x !== d) : [...prev, d]))}
                    className={`bs-mss-day${on ? " bs-mss-chip--on" : ""}`}
                  >
                    {DAY_MN[d]}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        <div className="bs-mss-actions">
          <button type="button" className="bs-mss-save" disabled={!date || busy} onClick={() => void save()}>
            {busy ? "Хадгалж байна…" : "Хадгалах"}
          </button>
          <button type="button" className="bs-mss-cancel" onClick={() => setEditing(false)}>
            Болих
          </button>
        </div>
      </section>
    );
  }

  /* ---------- Тохируулаагүй ---------- */
  if (!isSet || !goal) {
    return (
      <section className="bs-study-plan-goal-card bs-mss">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/temee/v2/goal-sm.webp" alt="" width={96} height={96} className="bs-mss-img" />
        <h2 className="bs-study-plan-goal-title">Миний сурах систем</h2>
        <p className="bs-study-plan-goal-msg">
          Аль түвшинд, хэзээ гэхэд хүрэх, өдөрт хэдэн үг цээжлэх, хэдэн цагт сануулуулахаа өөрөө тохируул. 1 минут л
          болно.
        </p>
        <button type="button" className="bs-mss-save bs-mss-save--full" onClick={openEditor}>
          Тохируулах
        </button>
      </section>
    );
  }

  /* ---------- Тохируулсан — товч харагдац ---------- */
  const daysLeft = Math.max(0, daysBetween(todayYmd(), goal.examDate));
  return (
    <section className="bs-study-plan-goal-card bs-mss">
      <div className="bs-mss-head">
        <h2 className="bs-study-plan-goal-title">Миний сурах систем</h2>
        <button type="button" className="bs-mss-edit" onClick={openEditor}>
          Өөрчлөх
        </button>
      </div>
      <ul className="bs-mss-rows">
        <li>
          <span aria-hidden>🎯</span>
          <span>
            <b>HSK {goal.level}</b> · {formatMnDate(goal.examDate)} гэхэд ({daysLeft} өдөр үлдсэн)
          </span>
        </li>
        <li>
          <span aria-hidden>📚</span>
          <span>
            Өдөрт <b>{daily?.wordsPerDay ?? 5} шинэ үг</b>
          </span>
        </li>
        <li>
          <span aria-hidden>⏰</span>
          <span>
            {reminder?.reminderTime ? (
              <>
                <b>{reminder.reminderTime}</b>-д сануулна · {daysText(reminder.daysOfWeek)}
              </>
            ) : (
              "Сануулга унтраалттай"
            )}
          </span>
        </li>
      </ul>
      {calc && remainingWords != null ? (
        <p className={`bs-mss-calc${calc.ok ? "" : " bs-mss-calc--warn"}`}>
          {remainingWords === 0
            ? `HSK ${goal.level}-ийн бүх үгийг цээжилсэн байна 🎉`
            : calc.ok
              ? `Цээжлээгүй ${remainingWords} үг үлдсэн. Энэ хурдаар ${calc.needDays} өдөрт дуусна — амжина ✓`
              : `Цээжлээгүй ${remainingWords} үг үлдсэн. Амжихын тулд өдөрт ${calc.needPerDay} үг хэрэгтэй.`}
        </p>
      ) : null}
      {pushNote ? <p className="bs-mss-note">{pushNote}</p> : null}
      <Link href={`/dictionary/levels?level=${goal.level}`} className="bs-mss-save bs-mss-save--full">
        ▶ Өнөөдрийн үгээ цээжлэх
      </Link>
    </section>
  );
}
