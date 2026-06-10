import Link from "next/link";
import { getWordsByLevel } from "@/lib/hsk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "HSK үгс шалгах — debug",
  robots: "noindex",
};

export default async function HskWordsCheckPage() {
  let words: Awaited<ReturnType<typeof getWordsByLevel>> = [];
  let error: string | null = null;

  try {
    words = await getWordsByLevel("1");
  } catch (err) {
    error = err instanceof Error ? err.message : "Ачаалахад алдаа гарлаа";
  }

  const sample = words.slice(0, 10);

  return (
    <main className="mx-auto min-h-screen max-w-[480px] bg-[var(--bs-bg)] px-4 py-6">
      <p className="text-xs font-bold text-[var(--bs-muted)]">DEBUG · түр шалгалт</p>
      <h1 className="mt-1 text-xl font-extrabold text-[var(--bs-ink)]">
        HSK1 — эхний 10 үг
      </h1>
      <p className="mt-1 text-sm text-[var(--bs-muted)]">
        Supabase <code className="text-xs">hsk_words</code> · нийт HSK1:{" "}
        {words.length}
      </p>

      {error ? (
        <p className="mt-4 rounded-[14px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!error && sample.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--bs-muted)]">
          Үг олдсонгүй. <code>npm run load:hsk</code> ажиллуулсан эсэхээ шалгана уу.
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-3">
        {sample.map((word) => (
          <li
            key={word.id}
            className="rounded-[18px] border border-[var(--bs-line)] bg-white p-4 shadow-[var(--bs-shadow)]"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className="font-[family-name:var(--bs-zh)] text-3xl font-black text-[var(--bs-ink)]"
              >
                {word.simplified}
              </span>
              <span className="shrink-0 rounded-full bg-[var(--bs-green-50)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--bs-green-700)]">
                #{word.frequency ?? "—"}
              </span>
            </div>
            <p className="mt-1 text-lg font-extrabold text-[var(--bs-green)]">
              {word.pinyin ?? "—"}
            </p>
            <p className="mt-1 text-[15px] font-bold leading-snug text-[var(--bs-ink)]">
              {word.meaning_mn ?? "—"}
            </p>
            {word.example_mn ? (
              <p className="mt-2 text-xs leading-relaxed text-[var(--bs-ink-2)]">
                <span className="font-[family-name:var(--bs-zh)]">
                  {word.example_zh}
                </span>
                <br />
                {word.example_pinyin}
                <br />
                {word.example_mn}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <Link
        href="/review"
        className="mt-6 block text-center text-sm font-bold text-[var(--bs-green-700)] underline"
      >
        ← Давтах руу
      </Link>
    </main>
  );
}
