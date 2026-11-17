import Link from "next/link";

type Slide = { img: string; title: string; text: string; href?: string; cta?: string };

const SLIDES: Slide[] = [
  {
    img: "/intro/2.webp",
    title: "1. Хичээл — алхам алхмаар",
    text: "HSK 1-ээс 6 хүртэл сурах бичгийн дарааллаар явна. Хичээл бүрт шинэ үг, дүрэм, сонсгол, дасгал бий. Хаанаас эхлэхээ мэдэхгүй бол HSK 1-ээс эхэл.",
    href: "/home",
    cta: "Хичээл үзэх",
  },
  {
    img: "/intro/3.webp",
    title: "2. Үг цээжлэх — зүрхлээд тогло",
    text: "Түвшнийхээ бүх үгийг гүйлгэж хараад мэдэхгүй үгээ ♥ дар. Дараа нь зүрхэлсэн үгсээрээ тоглож цээжил. Цээжилсэн үг жагсаалтаас чинь хасагдана.",
    href: "/dictionary/levels",
    cta: "Үгс үзэх",
  },
  {
    img: "/intro/4.webp",
    title: "3. Дуу-Бичлэг — кино үзэж сур",
    text: "Хятад, монгол хадмалтай бичлэг. Үг дээр дарахад утга нь гарна. Өгүүлбэрийг удаашруулж, давтаж сонсож болно.",
    href: "/bichleg",
    cta: "Бичлэг үзэх",
  },
  {
    img: "/intro/5.webp",
    title: "4. Тоглоом — уйдахгүй давт",
    text: "Сурсан үгээ тоглоомоор бататга. Өдөрт 5–10 минут тоглоход л үг толгойд үлдэнэ.",
    href: "/games",
    cta: "Тоглох",
  },
  {
    img: "/intro/6.webp",
    title: "5. Жишиг шалгалт — өөрийгөө сорь",
    text: "HSK-ийн шинэ хэлбэрийн (3.0) жишиг шалгалтыг жинхэнэ шалгалт шиг цагтай өгөөд оноогоо шууд хар.",
    href: "/mock-tests",
    cta: "Шалгалт өгөх",
  },
];

/** Шинэ хүнд аппыг танилцуулах зурагтай тайлбар (/tanilts + анхны удаагийн цонх). */
export function IntroContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="bs-intro">
      <section className="bs-intro-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/intro/1.webp" alt="" width={960} height={640} className="bs-intro-img" />
        <h1 className="bs-intro-h1">Сайн уу! Тавтай морил 👋</h1>
        <p className="bs-intro-lead">
          «Бөөндөө Сурцгаая» бол монгол хүнд зориулсан хятад хэл сурах апп.
        </p>
        <p className="bs-intro-free">🎁 Одоогоор бүрэн ҮНЭГҮЙ</p>
        <p className="bs-intro-sub">Ингэж сурдаг шүү 👇</p>
      </section>

      {SLIDES.map((s) => (
        <section key={s.img} className="bs-intro-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.img} alt="" width={960} height={640} loading="lazy" className="bs-intro-img" />
          <h2 className="bs-intro-h2">{s.title}</h2>
          <p className="bs-intro-text">{s.text}</p>
          {s.href ? (
            <Link href={s.href} className="bs-intro-link" onClick={onNavigate}>
              {s.cta} →
            </Link>
          ) : null}
        </section>
      ))}

      <section className="bs-intro-card bs-intro-card--thanks">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/intro/7.webp" alt="" width={960} height={640} loading="lazy" className="bs-intro-img" />
        <h2 className="bs-intro-h2">Баярласан бол 🙏</h2>
        <p className="bs-intro-text">
          Энэ апп танд хэрэг болж байвал миний <b>Бөөндөө Карго</b>-г дэмжээрэй. Хятадаас бараа
          захиалахдаа биднийг сонговол хамгийн том дэмжлэг болно.
        </p>
        <p className="bs-intro-final">Амжилт хүсье! Одоо чамд хичээх л үлдлээ 💪</p>
      </section>
    </div>
  );
}
