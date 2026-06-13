import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { ctaOutlineClass, ctaPrimaryClass } from "@/components/ui/cta-button-row";
import { AUDIO_CMN_ATTRIBUTION } from "@/lib/tts/audio-cmn";

export const metadata = {
  title: "Тусламж — Бөөндөө Сурцгаая",
  description: "Түгээмэл асуултууд — account, ахиц, quiz, давталт.",
};

const faqs = [
  {
    q: "Энэ app яаж ажилладаг вэ?",
    a: "Курс сонго → хичээл үзэх → үгийн сан → quiz → давталт. Дэлгэрэнгүй: /onboarding",
  },
  {
    q: "Account хэрэгтэй юу?",
    a: "Заавал биш. Guest төхөөрөмж дээр ахиц хадгална. Account нэвтэрвэл ахиц cloud дээр хадгалагдана.",
  },
  {
    q: "Guest ахиц яах вэ?",
    a: "Профайл дээр нэвтэрсний дараа local ахицыг account руу sync хийх боломжтой.",
  },
  {
    q: "Quiz оноо хаана хадгалагдах вэ?",
    a: "Guest: browser localStorage. Нэвтэрсэн: Supabase account.",
  },
  {
    q: "Үгийн давталт гэж юу вэ?",
    a: "Сурсан гэж тэмдэглэсэн үгсийг /review хэсэгт давтан харах.",
  },
  {
    q: "Хятад хэлний түвшнээ яаж сонгох вэ?",
    a: "/courses дээр HSK4, HSK5, Taobao чиглэл байна. Одоогоор HSK5 бүрэн бэлэн.",
  },
  {
    q: "Төлбөртэй болох уу?",
    a: "Ирээдүйд төлөвлөгдсөн. Одоогоор /pricing — төлбөр идэвхгүй.",
  },
  {
    q: "Алдаа гарвал яах вэ?",
    a: "/feedback хуудас дээр template copy хийж илгээнэ үү.",
  },
];

export default function HelpPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          Тусламж / FAQ
        </h1>
        <p className="mt-2 text-slate-600">Түгээмэл асуултууд</p>
      </section>

      <div className="flex flex-col gap-4">
        {faqs.map((item) => (
          <article
            key={item.q}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl"
          >
            <h2 className="font-semibold text-slate-900">{item.q}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
          </article>
        ))}
      </div>

      <p className="text-xs text-slate-500">{AUDIO_CMN_ATTRIBUTION}</p>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/courses" className={ctaPrimaryClass}>
          Хичээлүүд
        </Link>
        <Link href="/onboarding" className={ctaOutlineClass}>
          Заавар
        </Link>
        <Link href="/feedback" className={ctaOutlineClass}>
          Санал хүсэлт
        </Link>
      </section>
    </PublicPageShell>
  );
}
