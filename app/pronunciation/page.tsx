import Link from "next/link";
import { L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { DailyToneCard } from "@/components/pronunciation/daily-tone-card";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { AUDIO_CMN_ATTRIBUTION } from "@/lib/tts/audio-cmn";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "发音 — Бөөндөө Сурцгаая",
};

export default async function PronunciationPage() {
  const locale = await getServerUiLocale();

  const sections = [
    {
      href: "/pronunciation/basics",
      emoji: "🔤",
      zh: "拼音基础",
      mn: "Пиньинь суурь",
      descZh: "像一年级小朋友一样：a o e → b p m f → 复韵母 → 鼻韵母 → 整体认读 → 规则 + 蒙古学生易错点。听、跟读、练、测。",
      descMn: "Пиньинь суурь — бо по мо фо-оос эхэлнэ. 13 нэгж + 🇲🇳 Монголчуудын 6 алдаа: сонс, дагаж хэл, дасгал, шалгалт.",
      bg: "bg-violet-50",
    },
    {
      href: "/pronunciation/chart",
      emoji: "🔤",
      zh: "拼音表",
      mn: "Пиньинь самбар",
      descZh: "414 个音节 × 4 声，真人录音。点格子听、跟读。",
      descMn: "414 үе × 4 аялгуу, хүний дуугаар. Нүд дараад сонс, дагаж хэл.",
      bg: "bg-emerald-50",
    },
    {
      href: "/pronunciation/tones",
      emoji: "🎧",
      zh: "声调听辨",
      mn: "Аялгуу таних",
      descZh: "听一个音节，选出是第几声。10 轮，记分、连对。",
      descMn: "Үе сонсоод аль аялгуу болохыг таа. 10 раунд, оноо, дараалан зөв.",
      bg: "bg-sky-50",
    },
    {
      href: "/pronunciation/pairs",
      emoji: "👂",
      zh: "近音辨析",
      mn: "Ойрхон дуу",
      descZh: "z/zh、n/l、in/ing、ü/u、第二声/第三声……听出区别。",
      descMn: "z/zh, n/l, in/ing, ü/u, 2/3-р аялгуу… ялгааг нь сонсож сур.",
      bg: "bg-amber-50",
    },
    {
      href: "/pronunciation/tone-pairs",
      emoji: "🎵",
      zh: "双音节声调",
      mn: "Аялгуу хос",
      descZh: "HSK 1–3 双音节词按声调组合练：听、跟读、看曲线。",
      descMn: "HSK 1–3 хоёр үет үгсийг аялгуугийн хэвээр: сонс, дагаж хэл, муруйг хар.",
      bg: "bg-rose-50",
    },
  ];

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title={L(locale, "发音", "Дуудлага")}
        subtitle={L(
          locale,
          "拼音、声调、近音——真人录音，麦克风跟读，声调曲线反馈。",
          "Пиньинь, аялгуу, ойрхон дуу — хүний дуугаар сонсоод микрофоноор дагаж хэл, аялгуугийн муруйгаар шалгуул.",
        )}
      />
      <DailyToneCard />
      <div className="grid grid-cols-1 gap-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="app-card block p-4 transition-colors active:bg-slate-50">
            <div className="flex items-start gap-3">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${s.bg} text-3xl`}>
                {s.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-[var(--app-text)]">
                  {s.zh}
                  {locale === "mn" ? (
                    <span className="block text-xs font-semibold text-[var(--app-muted)]">{s.mn}</span>
                  ) : null}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--app-text)]">{L(locale, s.descZh, s.descMn)}</p>
              </div>
              <span className="text-lg text-[var(--app-muted)]">›</span>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--app-muted)]">
        {L(
          locale,
          "音节录音：Chen Wang（audio-cmn，Hugo Lopez / INALCO），词语录音：Yue Tan（Shtooka），CC BY-SA。",
          `Үеийн дуу: Chen Wang (audio-cmn, Hugo Lopez / INALCO). ${AUDIO_CMN_ATTRIBUTION}.`,
        )}
      </p>
    </MobileAppShell>
  );
}
