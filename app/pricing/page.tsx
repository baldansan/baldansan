import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { ctaOutlineClass, ctaPrimaryClass } from "@/components/ui/cta-button-row";

export const metadata = {
  title: "Үнийн мэдээлэл — Бөөндөө Сурцгаая",
  description: "Бөөндөө Сурцгаая app одоогоор бүрэн үнэгүй.",
};

export default function PricingPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          Үнийн мэдээлэл
        </h1>
      </section>

      <article className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200 sm:rounded-3xl">
        <h2 className="text-lg font-semibold text-emerald-900">
          Одоогоор бүрэн үнэгүй 🎉
        </h2>
        <p className="mt-3 text-sm leading-6 text-emerald-800">
          Бөөндөө Сурцгаая app-ийн бүх хичээл, үгийн сан, quiz, давталтын
          хэрэгслүүд одоогоор ямар ч төлбөргүй. Бүртгэл үүсгээд л суралцаж
          эхлээрэй — ахиц тань cloud дээр хадгалагдана.
        </p>
        <p className="mt-3 text-sm leading-6 text-emerald-800">
          Ирээдүйд төлбөртэй нэмэлт багц гарвал энэ хуудсан дээр урьдчилан
          зарлана. Одоо байгаа хэрэглэгчдийн эрх ямар нэг байдлаар
          хумигдахгүй.
        </p>
      </article>

      <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl">
        <h2 className="font-semibold text-slate-900">
          Сургууль, багш нарт
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Ангиараа ашиглах сонирхолтой сургууль, багш нар бидэнтэй холбогдоорой
          — хамтран ажиллах боломжийг ярилцъя.
        </p>
      </article>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/courses" className={ctaPrimaryClass}>
          Үнэгүй эхлэх
        </Link>
        <Link href="/feedback" className={ctaOutlineClass}>
          Холбоо барих
        </Link>
      </section>
    </PublicPageShell>
  );
}
