import Link from "next/link";

const cardClass =
  "flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md sm:p-8";

const btnPrimary =
  "mt-5 inline-flex w-fit rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600";

export function ImportHub() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lesson Import</h1>
        <p className="mt-2 text-sm text-slate-600">
          Хэл бүрийн номын бүтэц өөр тул зөв import төрлөө сонгоно уу.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article className={cardClass}>
          <span className="text-3xl" aria-hidden>
            🇨🇳
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Хятад / HSK хичээл импортлох
          </h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">
            HSK, subtitle, pinyin, hanzi, vocabulary, quiz, workbook/audio
            package.
          </p>
          <Link href="/admin/import/chinese" className={btnPrimary}>
            Chinese Import
          </Link>
        </article>

        <article className={cardClass}>
          <span className="text-3xl" aria-hidden>
            ▶
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Бичлэг хадмал импортлох
          </h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">
            Богино видеоны JSON хадмал (video_id, youtube_id, subtitles, words).
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/import/bichleg" className={btnPrimary}>
              Импортлох
            </Link>
            <Link
              href="/admin/bichleg"
              className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              Удирдах
            </Link>
          </div>
        </article>

        <article className={cardClass}>
          <span className="text-3xl" aria-hidden>
            🇰🇷
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Солонгос номын хичээл импортлох
          </h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">
            한글, romanization, grammar, practice, vocabulary, quiz,
            audio/images package.
          </p>
          <Link href="/admin/import/korean" className={btnPrimary}>
            Korean Import
          </Link>
        </article>
      </div>

      <p className="text-sm text-slate-500">
        Legacy unified ZIP import (auto-detect track):{" "}
        <Link
          href="/admin/import/legacy"
          className="font-medium text-emerald-700 hover:text-emerald-800"
        >
          /admin/import/legacy
        </Link>
      </p>
    </div>
  );
}
