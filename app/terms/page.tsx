import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { ctaOutlineClass, ctaPrimaryClass } from "@/components/ui/cta-button-row";

export const metadata = {
  title: "Үйлчилгээний нөхцөл — Бөөндөө Сурцгаая",
  description: "Бөөндөө Сурцгаая аппыг ашиглах нөхцөл, хэрэглэгчийн үүрэг, хариуцлага.",
};

const LAST_UPDATED = "2026-11-03";
const CONTACT_EMAIL = "support@buunduu.mn";

const sections = [
  {
    title: "1. Үйлчилгээ үзүүлэгч",
    body: [
      "«Бөөндөө Сурцгаая» (хэрэглэхдээ «Апп») нь Буундуу Карго (Улаанбаатар, Монгол)-ын ажиллуулдаг Хятад болон Солонгос хэл сурах үйлчилгээ мөн. Аппыг ашигласнаар та доорх нөхцөлийг зөвшөөрсөнд тооцно.",
    ],
  },
  {
    title: "2. Бүртгэл",
    body: [
      "Зочноор ашиглаж болно, харин ахицаа төхөөрөмж хооронд хадгалахын тулд имэйлээр бүртгүүлнэ. Нэвтрэх мэдээллээ нууцалж, бусдад бүү дамжуул.",
      "Өгсөн мэдээлэл үнэн зөв байх ёстой. Хүүхэд ашиглахдаа эцэг эх, асран хамгаалагчийн хяналттай байхыг зөвлөнө.",
    ],
  },
  {
    title: "3. Зөвшөөрөгдөх ашиглалт",
    body: [
      "Аппыг хувийн, сурах зорилгоор ашиглана. Дараахийг хориглоно: системд зөвшөөрөлгүй нэвтрэх, автоматаар контент татах (scraping), бусад хэрэглэгчид саад болох, хууль бус зорилгоор ашиглах.",
    ],
  },
  {
    title: "4. Контент ба оюуны өмч",
    body: [
      "Аппын хичээл, дизайн, лого, програм хангамж нь Буундуу Карго болон тус тусын эзэмшигчийн өмч. Зөвшөөрөлгүй хуулбарлах, түгээх, арилжаалахыг хориглоно.",
      "Хичээлийн контентыг боловсролын зорилгоор бэлтгэсэн; нарийн шалгалтын (HSK, TOPIK г.м) үр дүнг баталгаажуулдаггүй.",
    ],
  },
  {
    title: "5. Хариуцлагын хязгаарлалт",
    body: [
      "Апп «байгаагаар нь» үзүүлэгдэнэ. Тасралтгүй, алдаагүй ажиллахыг бүрэн баталгаажуулж чадахгүй. Хууль зөвшөөрсөн хэмжээнд аппыг ашигласнаас үүссэн шууд бус хохирлыг бид хариуцахгүй.",
    ],
  },
  {
    title: "6. Бүртгэл устгах, хаах",
    body: [
      "Та хүссэн үедээ бүртгэлээ устгаж болно (Тохиргоо → «Бүртгэл устгах», эсвэл /account/delete). Нөхцөлийг зөрчсөн бүртгэлийг бид түр хаах эсвэл устгах эрхтэй.",
    ],
  },
  {
    title: "7. Өөрчлөлт, холбоо барих",
    body: [
      "Нөхцөл өөрчлөгдвөл энэ хуудсанд шинэчилж огноог тэмдэглэнэ. Үйлчилгээг үргэлжлүүлэн ашиглах нь шинэ нөхцөлийг зөвшөөрсөн гэсэн үг.",
      `Асуулт, санал: ${CONTACT_EMAIL}`,
    ],
  },
];

export default function TermsPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Үйлчилгээний нөхцөл</h1>
        <p className="mt-2 text-slate-600">Сүүлд шинэчилсэн: {LAST_UPDATED}</p>
      </section>

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl"
          >
            <h2 className="font-semibold text-slate-900">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-6 text-slate-600">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/privacy" className={ctaPrimaryClass}>
          Нууцлалын бодлого
        </Link>
        <Link href="/account/delete" className={ctaOutlineClass}>
          Бүртгэл устгах
        </Link>
      </section>
    </PublicPageShell>
  );
}
