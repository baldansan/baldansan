import Link from "next/link";
import { L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getFables, getIdioms, getMengxue, getSentences, getStories, getTangshi } from "@/lib/library/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "文库 — Бөөндөө Сурцгаая",
};

export default async function LibraryPage() {
  const [locale, stories, mengxue, tangshi, idioms, proverbs, xiehouyu, fables, tatoeba, zhongdex] =
    await Promise.all([
      getServerUiLocale(),
      getStories(),
      getMengxue(),
      getTangshi(),
      getIdioms("idioms"),
      getIdioms("proverbs"),
      getIdioms("xiehouyu"),
      getFables(),
      getSentences("tatoeba"),
      getSentences("zhongdex"),
    ]);
  const withAudio = stories.filter((s) => s.provider === "gsb").length;

  const sections = [
    {
      href: "/library/books",
      emoji: "📚",
      zh: "绘本",
      mn: "Хүүхдийн зурагт ном",
      descZh: `${stories.length} 本图画书，${withAudio} 本带朗读音频。按阅读级别选书。`,
      descMn: `${stories.length} зурагт ном, ${withAudio} нь уншсан дуутай. Уншлагын түвшнээр сонгоно.`,
      bg: "bg-amber-50",
    },
    {
      href: "/library/classics",
      emoji: "📜",
      zh: "蒙学经典 · 唐诗",
      mn: "Сонгодог бичвэр · Тан шүлэг",
      descZh: `《三字经》《弟子规》《千字文》等 ${mengxue.works.length} 部蒙学经典，唐诗三百首 ${tangshi.poems.length} 首，全部注音。`,
      descMn: `三字经, 弟子规, 千字文 зэрэг ${mengxue.works.length} сонгодог, Тан шүлэг ${tangshi.poems.length}. Бүгд пиньинтэй.`,
      bg: "bg-rose-50",
    },
    {
      href: "/library/idioms",
      emoji: "🀄",
      zh: "成语 · 谚语 · 歇后语",
      mn: "Хэлц үг · Зүйр цэцэн үг",
      descZh: `${idioms.length} 条成语、${proverbs.length} 条谚语、${xiehouyu.length} 条歇后语，${fables.items.length} 篇成语寓言原文。`,
      descMn: `${idioms.length} хэлц (成语), ${proverbs.length} зүйр үг, ${xiehouyu.length} 歇后语, ${fables.items.length} үлгэр домгийн эх.`,
      bg: "bg-emerald-50",
    },
    {
      href: "/library/sentences",
      emoji: "💬",
      zh: "例句",
      mn: "Жишээ өгүүлбэр",
      descZh: `${(tatoeba.length + zhongdex.length).toLocaleString("en-US")} 个例句，按 HSK 级别筛选，带拼音和英文。`,
      descMn: `${(tatoeba.length + zhongdex.length).toLocaleString("en-US")} өгүүлбэр, HSK түвшнээр шүүнэ, пиньинь + англи.`,
      bg: "bg-sky-50",
    },
  ];

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title={L(locale, "文库", "Уншлагын сан")}
        subtitle={L(
          locale,
          "开放授权的中文阅读材料：图画书、经典、成语、例句。",
          "Нээлттэй лицензтэй хятад уншлагын материал: зурагт ном, сонгодог, хэлц, жишээ өгүүлбэр.",
        )}
      />
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
          "所有材料均为公有领域或 CC BY / CC BY-SA 授权，来源与署名见每页底部及「帮助」。拼音由程序生成，多音字待老师校对。蒙古语翻译将在老师审核后逐步加入。",
          "Бүх материал нийтийн өмч эсвэл CC BY / CC BY-SA лицензтэй; эх сурвалж, зохиогчийг хуудас бүрийн доод хэсэг болон «Тусламж»-аас үзнэ. Пиньинийг програм үүсгэсэн тул олон дуудлагатай ханзыг багш шалгана. Монгол орчуулга багшийн хяналтын дараа нэмэгдэнэ.",
        )}
      </p>
    </MobileAppShell>
  );
}
