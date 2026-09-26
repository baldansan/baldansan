"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import {
  HELZUI_LESSON_ID,
  HSK30_LESSON_ID,
  MIN_AREA_ATTEMPTS,
  WEAK_SPOT_AREA_ICONS,
  WEAK_SPOT_AREA_LABELS,
  type AreaStat,
  type GrammarStat,
  type LessonStat,
} from "@/lib/analytics/weak-spots";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { seedWeakWordsIntoSrs } from "@/lib/srs/seed-weak-words";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  fetchWeakSpots,
  WEAK_SPOT_ATTEMPT_LIMIT,
  type MissedWord,
  type WeakSpotsData,
} from "@/lib/supabase/weak-spots";

type Props = {
  /** hsk30-durem: levelId → гарчиг */
  hsk30LevelTitles: Record<string, string>;
  /** helzui-suuri: moduleId → гарчиг */
  helzuiModuleTitles: Record<string, string>;
};

type SeedState = {
  added: number;
  already: number;
  skipped: number;
  error: string | null;
};

/** Үгийн дасгалын lesson_id нь «hsk5», «hsk7-9» гэх мэт түвшний нэр байдаг. */
const WORD_PRACTICE_LESSON_RE = /^hsk([1-6]|7-9)$/;

function formatDate(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "—";
}

/** Хувь байхгүй бол 0 биш «—». */
function formatPct(value: number | null): string {
  return value == null ? "—" : `${value}%`;
}

function accuracyBarClass(value: number | null): string {
  if (value == null) return "bg-slate-200";
  if (value >= 80) return "bg-[var(--bs-green)]";
  if (value >= 60) return "bg-amber-400";
  return "bg-red-400";
}

export function WeakSpotsClient({
  hsk30LevelTitles,
  helzuiModuleTitles,
}: Props) {
  useActivityTracker("review", "weak-spots");
  const locale = useUiLocale();

  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<WeakSpotsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seeding, setSeeding] = useState(false);
  const [seedState, setSeedState] = useState<SeedState | null>(null);

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await fetchWeakSpots(uid);
    if (err) setError(err);
    setData(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      if (!hasSupabaseConfig) {
        setAuthChecked(true);
        setLoading(false);
        return;
      }
      const { userId: uid } = await getAuthenticatedUserId().catch(() => ({
        userId: null,
      }));
      setUserId(uid);
      setAuthChecked(true);
      if (uid) {
        void load(uid);
      } else {
        setLoading(false);
      }
    }
    void init();
  }, [load]);

  const lessonLabel = useCallback(
    (lessonId: string): string => {
      if (lessonId === HSK30_LESSON_ID) return tr(locale, "HSK 3.0 дүрэм");
      if (lessonId === HELZUI_LESSON_ID) {
        return tr(locale, "Өгүүлбэрийн бүтэц");
      }
      const match = WORD_PRACTICE_LESSON_RE.exec(lessonId);
      if (match) {
        return `${tr(locale, "Үгийн дасгал")} · HSK ${match[1]}`;
      }
      return data?.lessonTitles[lessonId] ?? lessonId;
    },
    [data, locale]
  );

  const lessonHref = useCallback((lessonId: string): string => {
    if (lessonId === HSK30_LESSON_ID) return "/review/grammar/hsk30";
    if (lessonId === HELZUI_LESSON_ID) return "/review/grammar/structure";
    if (WORD_PRACTICE_LESSON_RE.test(lessonId)) return "/games/hsk-vocab-quiz";
    return `/lessons/${lessonId}`;
  }, []);

  const grammarLabel = useCallback(
    (row: GrammarStat): string => {
      if (row.lessonId === HSK30_LESSON_ID) {
        return hsk30LevelTitles[row.stage] ?? row.stage;
      }
      if (row.lessonId === HELZUI_LESSON_ID) {
        return helzuiModuleTitles[row.stage] ?? row.stage;
      }
      return lessonLabel(row.lessonId);
    },
    [hsk30LevelTitles, helzuiModuleTitles, lessonLabel]
  );

  const grammarHref = useCallback((row: GrammarStat): string => {
    if (row.lessonId === HSK30_LESSON_ID) {
      return `/review/grammar/hsk30/${row.stage}`;
    }
    if (row.lessonId === HELZUI_LESSON_ID) {
      return `/review/grammar/structure/${row.stage}`;
    }
    return `/lessons/${row.lessonId}`;
  }, []);

  const enrollableWords = useMemo(
    () => (data?.missedWords ?? []).filter((w) => !w.isFunctionWord),
    [data]
  );

  async function handleSeedWords() {
    if (enrollableWords.length === 0 || seeding) return;
    setSeeding(true);
    setSeedState(null);
    const result = await seedWeakWordsIntoSrs(
      enrollableWords.map((w) => w.wordId)
    );
    setSeedState(result);
    setSeeding(false);
  }

  /* ---------- Зочин ---------- */
  if (authChecked && !userId) {
    return (
      <div className="bs-mem-wizard">
        <h2 className="bs-mem-step-title">
          📉 {tr(locale, "Миний сул тал")}
        </h2>
        <div className="mt-4 rounded-[20px] bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-4xl" aria-hidden>
            🔐
          </p>
          <p className="mt-3 text-sm font-bold text-[var(--app-text)]">
            {tr(locale, "Нэвтэрч орвол сул талаа харах боломжтой")}
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">
            {tr(
              locale,
              "Энэ хуудас зөвхөн таны өөрийн хариултууд дээр тулгуурлан бодогдоно."
            )}
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-full bg-[var(--app-primary)] px-6 py-2.5 text-sm font-bold text-white"
          >
            {tr(locale, "Нэвтрэх")} →
          </Link>
        </div>
      </div>
    );
  }

  if (!authChecked || loading) {
    return (
      <p className="py-12 text-center text-sm text-[var(--app-muted)]">
        {tr(locale, "Ачааллаж байна…")}
      </p>
    );
  }

  return (
    <div className="bs-mem-wizard">
      <h2 className="bs-mem-step-title">📉 {tr(locale, "Миний сул тал")}</h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        {tr(locale, "Зөвхөн таны өөрийн хариултууд дээр үндэслэв")}
      </p>

      {error ? (
        <p className="mt-3 rounded-[16px] bg-red-50 p-3 text-sm text-red-600">
          {tr(locale, "Мэдээлэл татахад алдаа гарлаа:")} {error}
        </p>
      ) : null}

      {data ? (
        <>
          <VerdictCard data={data} locale={locale} />
          <AreaSection areas={data.areas} locale={locale} />
          <LessonSection
            lessons={data.lessons}
            label={lessonLabel}
            href={lessonHref}
            locale={locale}
          />
          <GrammarSection
            rows={data.grammar}
            label={grammarLabel}
            href={grammarHref}
            locale={locale}
          />
          <WordSection
            words={data.missedWords}
            enrollableCount={enrollableWords.length}
            unresolvedCount={data.unresolvedWordCount}
            seeding={seeding}
            seedState={seedState}
            onSeed={() => void handleSeedWords()}
            locale={locale}
          />

          <p className="mt-6 text-center text-[11px] leading-5 text-[var(--app-muted)]">
            {tr(locale, "Сүүлийн")} {data.attemptCount}{" "}
            {tr(locale, "хариултад дүн шинжилгээ хийв")}
            {data.attemptCount >= WEAK_SPOT_ATTEMPT_LIMIT
              ? ` (${tr(locale, "дээд хязгаар")} ${WEAK_SPOT_ATTEMPT_LIMIT})`
              : ""}
            {data.lastAttemptAt
              ? ` · ${tr(locale, "сүүлд")} ${formatDate(data.lastAttemptAt)}`
              : ""}
          </p>
        </>
      ) : null}
    </div>
  );
}

/* ---------- Дүгнэлт ---------- */

type LocaleProp = { locale: ReturnType<typeof useUiLocale> };

function VerdictCard({ data, locale }: { data: WeakSpotsData } & LocaleProp) {
  const { verdict } = data;

  let title: string;
  let body: string;
  let icon: string;

  if (verdict.kind === "no_data") {
    icon = "📭";
    title = tr(locale, "Мэдээлэл хараахан алга");
    body = tr(
      locale,
      "Та одоогоор нэг ч асуулт хариулаагүй байна. Хичээл, дасгал хийж эхлэхэд сул талаа энд харна."
    );
  } else if (verdict.kind === "too_little") {
    icon = "📭";
    title = tr(locale, "Дүгнэлт гаргахад хангалтгүй");
    body = `${tr(locale, "Одоогоор")} ${verdict.total} ${tr(
      locale,
      "хариулт бүртгэгдсэн байна. Нэг хэсэгт дор хаяж"
    )} ${MIN_AREA_ATTEMPTS} ${tr(
      locale,
      "хариулт өгсний дараа хамгийн сул талыг нэрлэж чадна."
    )}`;
  } else if (verdict.kind === "clean") {
    icon = "✅";
    title = tr(locale, "Буруу хариулт алга");
    body = `${tr(locale, "Сүүлийн")} ${verdict.total} ${tr(
      locale,
      "хариултын аль нь ч буруу байгаагүй. Одоогоор сул тал илрээгүй байна."
    )}`;
  } else {
    icon = WEAK_SPOT_AREA_ICONS[verdict.area];
    title = `${tr(locale, "Хамгийн сул тал:")} ${tr(
      locale,
      WEAK_SPOT_AREA_LABELS[verdict.area]
    )}`;
    const base = `${verdict.total} ${tr(locale, "хариултаас")} ${
      verdict.wrong
    } ${tr(locale, "нь буруу — зөв хариултын хувь")} ${verdict.accuracyPct}%.`;
    const gap =
      verdict.gapPct == null
        ? ` ${tr(
            locale,
            "Харьцуулах өөр хэсэг хараахан хангалттай мэдээлэлгүй байна."
          )}`
        : verdict.gapPct >= 5
          ? ` ${tr(locale, "Дараагийн хэсгээс")} ${verdict.gapPct} ${tr(
              locale,
              "пунктээр доогуур байна."
            )}`
          : ` ${tr(locale, "Бусад хэсгээс ялгаа бага")} (${verdict.gapPct} ${tr(
              locale,
              "пункт"
            )}).`;
    body = base + gap;
  }

  return (
    <div className="mt-4 rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <p className="text-3xl" aria-hidden>
        {icon}
      </p>
      <p className="mt-2 text-base font-extrabold text-[var(--app-text)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">{body}</p>
    </div>
  );
}

/* ---------- Хэсгүүд ---------- */

function AreaSection({
  areas,
  locale,
}: { areas: AreaStat[] } & LocaleProp) {
  return (
    <>
      <p className="bs-tm-sec" style={{ marginTop: 18 }}>
        {tr(locale, "Хаана оноогоо алдаж байна вэ?")}
      </p>
      {areas.length === 0 ? (
        <EmptyNote
          text={tr(
            locale,
            "Хариултын мэдээлэл алга — дасгал хийсний дараа энд гарна."
          )}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {areas.map((row) => (
            <li
              key={row.area}
              className="rounded-[16px] bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {WEAK_SPOT_AREA_ICONS[row.area]}
                </span>
                <span className="flex-1 text-sm font-bold text-[var(--app-text)]">
                  {tr(locale, WEAK_SPOT_AREA_LABELS[row.area])}
                </span>
                <span className="text-sm font-extrabold text-[var(--app-text)]">
                  {formatPct(row.accuracyPct)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e1ebe5]">
                <div
                  className={`h-full rounded-full ${accuracyBarClass(row.accuracyPct)}`}
                  style={{ width: `${row.accuracyPct ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-semibold text-[var(--app-muted)]">
                {row.wrong} {tr(locale, "алдаа")} / {row.total}{" "}
                {tr(locale, "хариулт")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function LessonSection({
  lessons,
  label,
  href,
  locale,
}: {
  lessons: LessonStat[];
  label: (lessonId: string) => string;
  href: (lessonId: string) => string;
} & LocaleProp) {
  return (
    <>
      <p className="bs-tm-sec" style={{ marginTop: 18 }}>
        {tr(locale, "Аль хичээл рүү буцах вэ?")}
      </p>
      {lessons.length === 0 ? (
        <EmptyNote
          text={tr(locale, "Алдаа гарсан хичээл алга — давтах зүйл олдсонгүй.")}
        />
      ) : (
        lessons.map((row) => (
          <Link key={row.lessonId} href={href(row.lessonId)} className="bs-tm-card">
            <span className="bs-tm-card-ic bs-tm-card-ic--red" aria-hidden>
              📕
            </span>
            <span className="bs-tm-card-body">
              <span className="bs-tm-card-title" translate="no">{label(row.lessonId)}</span>
              <span className="bs-tm-card-sub">
                {row.wrong} {tr(locale, "алдаа")} / {row.total}{" "}
                {tr(locale, "хариулт")} · {formatPct(row.accuracyPct)}
              </span>
            </span>
            <span className="bs-tm-card-chev" aria-hidden>
              ›
            </span>
          </Link>
        ))
      )}
    </>
  );
}

function GrammarSection({
  rows,
  label,
  href,
  locale,
}: {
  rows: GrammarStat[];
  label: (row: GrammarStat) => string;
  href: (row: GrammarStat) => string;
} & LocaleProp) {
  return (
    <>
      <p className="bs-tm-sec" style={{ marginTop: 18 }}>
        {tr(locale, "Аль дүрмийг илүү судлах вэ?")}
      </p>
      {rows.length === 0 ? (
        <EmptyNote
          text={tr(
            locale,
            "Дүрмийн хэсэгт алдаа бүртгэгдээгүй байна. Доорх хичээлүүдээс дүрмээ давтаж болно."
          )}
        />
      ) : (
        rows.map((row) => (
          <Link key={row.key} href={href(row)} className="bs-tm-card">
            <span className="bs-tm-card-ic bs-tm-card-ic--green" aria-hidden>
              🧩
            </span>
            <span className="bs-tm-card-body">
              <span className="bs-tm-card-title" translate="no">{label(row)}</span>
              <span className="bs-tm-card-sub">
                {row.wrong} {tr(locale, "алдаа")} / {row.total}{" "}
                {tr(locale, "хариулт")} · {formatPct(row.accuracyPct)}
              </span>
            </span>
            <span className="bs-tm-card-chev" aria-hidden>
              ›
            </span>
          </Link>
        ))
      )}

      <div className="mt-1 flex gap-2">
        <Link
          href="/review/grammar/hsk30"
          className="flex-1 rounded-[14px] bg-white px-3 py-2.5 text-center text-xs font-bold text-[var(--bs-green-700)] shadow-sm ring-1 ring-slate-100"
        >
          📚 {tr(locale, "HSK 3.0 дүрэм")}
        </Link>
        <Link
          href="/review/grammar/structure"
          className="flex-1 rounded-[14px] bg-white px-3 py-2.5 text-center text-xs font-bold text-[var(--bs-green-700)] shadow-sm ring-1 ring-slate-100"
        >
          🧩 {tr(locale, "Өгүүлбэрийн бүтэц")}
        </Link>
      </div>
    </>
  );
}

function WordSection({
  words,
  enrollableCount,
  unresolvedCount,
  seeding,
  seedState,
  onSeed,
  locale,
}: {
  words: MissedWord[];
  enrollableCount: number;
  unresolvedCount: number;
  seeding: boolean;
  seedState: SeedState | null;
  onSeed: () => void;
} & LocaleProp) {
  return (
    <>
      <p className="bs-tm-sec" style={{ marginTop: 18 }}>
        {tr(locale, "Аль үг чамайг байнга бүдрүүлэв?")}
      </p>

      {words.length === 0 ? (
        <EmptyNote
          text={
            unresolvedCount > 0
              ? `${tr(
                  locale,
                  "Алдсан хариултаас үгийн сангийн үг таарсангүй."
                )} (${unresolvedCount} ${tr(locale, "хариулт шалгав")})`
              : tr(
                  locale,
                  "Үгийн алдаа бүртгэгдээгүй байна — үгийн дасгал, хичээлийн шалгалт хийхэд энд цугларна."
                )
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {words.map((word) => (
              <li
                key={word.wordId}
                className="rounded-[16px] bg-white p-4 shadow-sm ring-1 ring-slate-100"
              >
                <div className="flex items-start gap-3">
                  <span className="hanzi text-2xl font-bold text-[var(--bs-green-700)]">
                    {word.simplified}
                  </span>
                  <div className="min-w-0 flex-1">
                    {word.pinyin ? (
                      <p className="text-xs text-[var(--app-muted)]">
                        {word.pinyin}
                      </p>
                    ) : null}
                    {word.meaningMn ? (
                      <p className="break-words text-sm font-semibold text-[var(--app-text)]" translate="no">
                        {word.meaningMn}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-extrabold text-red-600">
                    ×{word.wrongCount}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-[var(--app-muted)]">
                  {word.hskLevel ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      HSK {word.hskLevel}
                    </span>
                  ) : null}
                  {word.fromWordPractice ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      {tr(locale, "Үгийн дасгал")}
                    </span>
                  ) : null}
                  {word.fromQuiz ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      {tr(locale, "Хичээлийн шалгалт")}
                    </span>
                  ) : null}
                  <span>{formatDate(word.lastWrongAt)}</span>
                </div>
              </li>
            ))}
          </ul>

          {unresolvedCount > 0 ? (
            <p className="mt-2 text-[11px] leading-5 text-[var(--app-muted)]">
              {unresolvedCount}{" "}
              {tr(
                locale,
                "буруу хариулт үгийн сангаас олдсонгүй — тэдгээрийг жагсаалтад оруулаагүй."
              )}
            </p>
          ) : null}

          {enrollableCount > 0 ? (
            <button
              type="button"
              className="bs-mock-primary-btn mt-3"
              disabled={seeding}
              onClick={onSeed}
            >
              {seeding
                ? tr(locale, "Нэмж байна…")
                : `🔁 ${tr(locale, "Алдсан үгсээ давталтад нэмэх")}`}
            </button>
          ) : (
            <p className="mt-2 text-[11px] leading-5 text-[var(--app-muted)]">
              {tr(
                locale,
                "Эдгээр үг давталтын системд ордоггүй (нөхцөл, хэрэглэгдэхүүн үг)."
              )}
            </p>
          )}

          {seedState ? (
            <p
              className={`mt-2 text-xs font-semibold leading-5 ${
                seedState.error ? "text-red-600" : "text-[var(--bs-green-700)]"
              }`}
            >
              {seedState.error
                ? `${tr(locale, "Алдаа:")} ${seedState.error}`
                : `${seedState.added} ${tr(
                    locale,
                    "үг маргаашаас давтагдана"
                  )} · ${seedState.already} ${tr(
                    locale,
                    "үг аль хэдийн давталтад байсан"
                  )}${
                    seedState.skipped > 0
                      ? ` · ${seedState.skipped} ${tr(locale, "үг алгасав")}`
                      : ""
                  }`}
            </p>
          ) : null}

          {seedState && !seedState.error ? (
            <Link
              href="/review/words"
              className="mt-2 inline-block text-xs font-bold text-[var(--bs-green-700)]"
            >
              {tr(locale, "Миний үгс")} →
            </Link>
          ) : null}
        </>
      )}
    </>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] bg-white p-4 text-center text-xs leading-5 text-[var(--app-muted)] shadow-sm ring-1 ring-slate-100">
      {text}
    </div>
  );
}
