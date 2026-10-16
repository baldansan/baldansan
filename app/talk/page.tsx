import Link from "next/link";
import { L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { TalkClient } from "@/components/talk/talk-client";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getTalkScenario, TALK_SCENARIOS } from "@/lib/talk/scenarios";
import "@/components/talk/talk.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ярилцах — Бөөндөө Сурцгаая",
};

type PageProps = {
  searchParams: Promise<{ scenario?: string }>;
};

export default async function TalkPage({ searchParams }: PageProps) {
  const { scenario: scenarioId } = await searchParams;
  const locale = await getServerUiLocale();
  const scenario = getTalkScenario(scenarioId);

  if (scenario) {
    return (
      <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
        <TalkClient key={scenario.id} scenario={scenario} />
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title={L(locale, "💬 口语练习", "💬 Ярилцах")}
        subtitle={L(
          locale,
          "选一个场景，用汉语对话。可以打字，也可以用麦克风说。",
          "Сценар сонгоод хятадаар ярилц: бичиж эсвэл микрофоноор хэлж хариул. AI реплик бүрд пиньинь, орчуулга, 🔊 бий."
        )}
      />
      <div className="bs-talk-grid">
        {TALK_SCENARIOS.map((s) => (
          <Link key={s.id} href={`/talk?scenario=${s.id}`} className="app-card bs-talk-card p-4 active:bg-slate-50">
            <span className="bs-talk-card-ic" aria-hidden>
              {s.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <h2>
                {L(locale, s.title_zh, s.title_mn)}
                <span className="bs-talk-lvl">{s.level}</span>
              </h2>
              <p translate="no">{L(locale, s.setting_zh, s.setting_mn)}</p>
            </span>
            <span className="text-lg text-[var(--app-muted)]">›</span>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--app-muted)]">
        {L(
          locale,
          "没有 AI 密钥时使用内置剧本（每句 3 个选项）；配置 AI_API_KEY 后为自由对话。",
          "AI түлхүүр тохируулаагүй үед сценар бүрийн бэлэн скрипт (3 сонголт) ажиллана; AI_API_KEY тохируулбал чөлөөт яриа болно."
        )}
      </p>
    </MobileAppShell>
  );
}
