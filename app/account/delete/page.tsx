import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { ctaOutlineClass, ctaPrimaryClass } from "@/components/ui/cta-button-row";

export const metadata = {
  title: "Бүртгэл устгах — Бөөндөө Сурцгаая",
  description: "Бөөндөө Сурцгаая бүртгэл болон өгөгдлөө устгах заавар.",
};

const CONTACT_EMAIL = "support@buunduu.mn";

export default function AccountDeletePage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Бүртгэл устгах</h1>
        <p className="mt-2 text-slate-600">
          Бөөндөө Сурцгаая (Буундуу Карго) — бүртгэл болон өгөгдлөө бүрмөсөн устгах заавар.
        </p>
      </section>

      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl">
        <h2 className="font-semibold text-slate-900">Арга 1 — Апп дотроос (хамгийн хурдан)</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-600">
          <li>Бүртгэлээрээ нэвтэрнэ.</li>
          <li>Тохиргоо хуудас руу орно.</li>
          <li>«Бүртгэл устгах» хэсгийг нээж, баталгаажуулах үгийг (УСТГАХ) бичнэ.</li>
          <li>Устгахад бүртгэл дуусч, бүх өгөгдөл тэр дор нь арилна.</li>
        </ol>
      </article>

      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl">
        <h2 className="font-semibold text-slate-900">Арга 2 — Имэйлээр хүсэлт</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Нэвтэрч чадахгүй бол бүртгэлтэй имэйл хаягаасаа{" "}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Бүртгэл устгах хүсэлт`} className="font-semibold text-emerald-700">
            {CONTACT_EMAIL}
          </a>{" "}
          хаяг руу «Бүртгэл устгах хүсэлт» гэсэн гарчигтай имэйл илгээнэ. Хүсэлтийг 30 хоногийн дотор биелүүлнэ.
        </p>
      </article>

      <article className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 sm:rounded-3xl">
        <h2 className="font-semibold text-slate-900">Юу устах вэ?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Имэйл хаяг, нэвтрэлтийн мэдээлэл, хичээлийн ахиц, сурсан үгс, quiz оноо, давталтын түүх, streak,
          push мэдэгдлийн бүртгэл. Энэ үйлдлийг буцаах боломжгүй. Хуулийн дагуу хадгалах шаардлагатай техникийн лог
          байвал хамгийн ихдээ 30 хоногт устана.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Account deletion (English): sign in → Settings → «Бүртгэл устгах», or email {CONTACT_EMAIL} from your
          registered address; all personal data and learning progress is permanently deleted.
        </p>
      </article>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/settings" className={ctaPrimaryClass}>
          Тохиргоо руу очих
        </Link>
        <Link href="/privacy" className={ctaOutlineClass}>
          Нууцлалын бодлого
        </Link>
      </section>
    </PublicPageShell>
  );
}
