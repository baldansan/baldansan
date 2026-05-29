import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata = {
  title: "Help — Бөөндөө Сурцгаая",
  description: "Түгээмэл асуултууд — account, progress, quiz, review.",
};

const faqs = [
  {
    q: "Энэ app яаж ажилладаг вэ?",
    a: "Course сонго → watch → vocabulary → quiz → review. Дэлгэрэнгүй: /onboarding",
  },
  {
    q: "Account хэрэгтэй юу?",
    a: "Заавал биш. Guest device дээр ахиц хадгална. Account нэвтэрвэл ахиц cloud дээр хадгалагдана.",
  },
  {
    q: "Guest progress яах вэ?",
    a: "Profile дээр нэвтэрсний дараа local progress-ийг account руу sync хийх боломжтой.",
  },
  {
    q: "Quiz оноо хаана хадгалагдах вэ?",
    a: "Guest: browser localStorage. Logged-in: Supabase user_quiz_attempts.",
  },
  {
    q: "Vocabulary review гэж юу вэ?",
    a: "Сурсан гэж тэмдэглэсэн үгсийг /review хэсэгт давтан харах.",
  },
  {
    q: "Хятад хэлний түвшнээ яаж сонгох вэ?",
    a: "/courses дээр HSK4, HSK5, Taobao чиглэл байна. Одоогоор HSK5 бүрэн бэлэн.",
  },
  {
    q: "Taobao Chinese гэж юу вэ?",
    a: "E-commerce дээр хэрэглэгдэх бодит хятад үг, өгүүлбэр — удахгүй нэмэгдэнэ.",
  },
  {
    q: "Төлбөртэй болох уу?",
    a: "Ирээдүйд төлөвлөгдсөн. Одоогоор /pricing placeholder — төлбөр идэвхгүй.",
  },
  {
    q: "Алдаа гарвал яах вэ?",
    a: "/feedback хуудас дээр template copy хийж admin/developer рүү илгээнэ үү.",
  },
];

export default function HelpPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Help / FAQ</h1>
        <p className="mt-2 text-slate-600">Түгээмэл асуултууд</p>
      </section>

      <div className="flex flex-col gap-4">
        {faqs.map((item) => (
          <article
            key={item.q}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="font-semibold text-slate-900">{item.q}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
          </article>
        ))}
      </div>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/courses"
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Courses
        </Link>
        <Link
          href="/onboarding"
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800"
        >
          Onboarding
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700"
        >
          Login
        </Link>
        <Link
          href="/profile"
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700"
        >
          Profile
        </Link>
      </section>
    </PublicPageShell>
  );
}
