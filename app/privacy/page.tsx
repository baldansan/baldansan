import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { ctaOutlineClass, ctaPrimaryClass } from "@/components/ui/cta-button-row";

export const metadata = {
  title: "Нууцлалын бодлого — Бөөндөө Сурцгаая",
  description:
    "Бөөндөө Сурцгаая app ямар мэдээлэл цуглуулдаг, хэрхэн хамгаалдаг тухай.",
};

const LAST_UPDATED = "2026-08-18";
const CONTACT_EMAIL = "smileycatler1@gmail.com";

const sections = [
  {
    title: "1. Ямар мэдээлэл цуглуулдаг вэ?",
    body: [
      "Бүртгэл үүсгэхэд: имэйл хаяг, нууц үг (нууц үгийг Supabase аюулгүй хадгална — бид харах боломжгүй).",
      "Сурах явцад: хичээлийн ахиц, сурсан үгс, quiz оноо, давталтын түүх, өдрийн зорилго, streak.",
      "Зочноор (нэвтрэлгүй) ашиглавал ахиц зөвхөн таны төхөөрөмж дээр (browser storage) хадгалагдана — бидэнд илгээгдэхгүй.",
    ],
  },
  {
    title: "2. Мэдээллийг юунд ашигладаг вэ?",
    body: [
      "Зөвхөн app-ийн үндсэн үйлчилгээнд: таны сурах явцыг хадгалах, төхөөрөмж хооронд sync хийх, давталтын хуваарь гаргах.",
      "Бид таны мэдээллийг хэнд ч зардаггүй, сурталчилгаанд ашигладаггүй, гуравдагч этгээдэд дамжуулдаггүй.",
    ],
  },
  {
    title: "3. Хаана хадгалагддаг вэ?",
    body: [
      "Өгөгдөл Supabase (өгөгдлийн сан) болон Vercel (hosting) дээр хадгалагдана. Хэрэглэгч бүрийн мэдээлэл Row Level Security дүрмээр хамгаалагдсан — өөр хэрэглэгч таны мэдээлэлд хандах боломжгүй.",
      "Үгийн дуудлагын аудиог нээлттэй CDN-ээс татдаг — энэ үед таны хувийн мэдээлэл дамждаггүй.",
    ],
  },
  {
    title: "4. Бүртгэлээ устгах",
    body: [
      "Тохиргоо → «Бүртгэл устгах» хэсгээс бүртгэлээ бүрмөсөн устгаж болно. Устгахад таны имэйл, бүх сурах явц, оноо өгөгдлийн сангаас бүрмөсөн арилна — сэргээх боломжгүй.",
      `Эсвэл ${CONTACT_EMAIL} хаяг руу имэйл илгээж устгуулах хүсэлт гаргаж болно — 30 хоногийн дотор биелүүлнэ.`,
    ],
  },
  {
    title: "5. Хүүхдийн мэдээлэл",
    body: [
      "App нь хэл сурах зориулалттай бөгөөд насанд тохирсон контенттой. 13-аас доош насны хүүхэд эцэг эхийн зөвшөөрөлтэйгөөр ашиглахыг зөвлөнө.",
    ],
  },
  {
    title: "6. Өөрчлөлт ба холбоо барих",
    body: [
      "Энэ бодлогод өөрчлөлт орвол энэ хуудсан дээр шинэчилж, огноог тэмдэглэнэ.",
      `Асуулт байвал: ${CONTACT_EMAIL}`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          Нууцлалын бодлого
        </h1>
        <p className="mt-2 text-slate-600">
          Сүүлд шинэчилсэн: {LAST_UPDATED}
        </p>
      </section>

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl"
          >
            <h2 className="font-semibold text-slate-900">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-2 text-sm leading-6 text-slate-600"
              >
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>

      <article className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 sm:rounded-3xl">
        <h2 className="font-semibold text-slate-900">
          Privacy Policy (English summary)
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Бөөндөө Сурцгаая (&quot;Buunduu Surtsgaay&quot;) is a language
          learning app. We collect only your email address and learning
          progress (lesson completion, learned words, quiz scores), stored
          securely in Supabase and protected by row-level security. We do not
          sell your data or share it with third parties, and we show no ads.
          Guest usage stores progress only on your device. You can permanently
          delete your account and all associated data from Settings, or by
          emailing {CONTACT_EMAIL}. Questions: {CONTACT_EMAIL}.
        </p>
      </article>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/settings" className={ctaPrimaryClass}>
          Тохиргоо
        </Link>
        <Link href="/help" className={ctaOutlineClass}>
          Тусламж
        </Link>
      </section>
    </PublicPageShell>
  );
}
