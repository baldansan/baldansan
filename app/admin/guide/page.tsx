import Link from "next/link";

import { ADMIN_GUIDE_TOPICS } from "@/lib/admin/admin-guide-content";

export const metadata = {
  title: "Хэрэглэгчийн заавар — Админ",
};

function resolveTopic(raw: string | string[] | undefined) {
  const id = Array.isArray(raw) ? raw[0] : raw;
  return (
    ADMIN_GUIDE_TOPICS.find((topic) => topic.id === id) ?? ADMIN_GUIDE_TOPICS[0]
  );
}

export default async function AdminGuidePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const active = resolveTopic((await searchParams).topic);
  const activeIndex = ADMIN_GUIDE_TOPICS.indexOf(active);
  const next = ADMIN_GUIDE_TOPICS[activeIndex + 1];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs font-medium text-slate-500">
          <Link href="/admin" className="hover:text-emerald-700">
            Хяналтын самбар
          </Link>{" "}
          › Хэрэглэгчийн заавар
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Хэрэглэгчийн заавар
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          Удирдлагын хэсгийн ажлуудыг алхам алхмаар тайлбарласан гарын авлага.
          Зүүн талын сэдвээс сонгоно уу.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav
          aria-label="Зааврын сэдвүүд"
          className="admin-panel h-max overflow-hidden p-2"
        >
          <ul className="flex flex-col gap-0.5">
            {ADMIN_GUIDE_TOPICS.map((topic) => {
              const isActive = topic.id === active.id;
              return (
                <li key={topic.id}>
                  <Link
                    href={`/admin/guide?topic=${topic.id}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-emerald-50 font-semibold text-emerald-800 ring-1 ring-emerald-200"
                        : "font-medium text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span aria-hidden className="w-5 shrink-0 text-center">
                      {topic.icon}
                    </span>
                    <span className="min-w-0">{topic.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <article className="admin-panel p-5 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">
            <span aria-hidden className="mr-2">
              {active.icon}
            </span>
            {active.title}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {active.summary}
          </p>

          <ol className="mt-5 flex flex-col gap-3">
            {active.steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-slate-900">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-6 text-slate-600">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {active.tips && active.tips.length > 0 ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-sm font-semibold text-amber-900">
                💡 Санамж
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {active.tips.map((tip) => (
                  <li key={tip} className="text-sm leading-6 text-amber-900">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
            {active.links?.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="admin-btn-secondary text-sm"
              >
                {link.label} →
              </Link>
            ))}
            {next ? (
              <Link
                href={`/admin/guide?topic=${next.id}`}
                className="admin-btn-primary ml-auto text-sm"
              >
                Дараагийн: {next.title} →
              </Link>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}
