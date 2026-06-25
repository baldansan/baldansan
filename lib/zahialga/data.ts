import type { ZahialgaCountry, ZahialgaLesson } from "@/lib/zahialga/types";

export const ZAHIALGA_CARGO_URL = "https://cargo.buunduu.mn";

export const ZAHIALGA_COUNTRIES: ZahialgaCountry[] = [
  {
    id: "cn",
    flag: "🇨🇳",
    label: "Хятад",
    subtitle: "Taobao",
    disabled: false,
    panelNote: "Taobao — Хятадаас захиалах хамгийн том платформ",
  },
  {
    id: "kr",
    flag: "🇰🇷",
    label: "Солонгос",
    disabled: true,
  },
  {
    id: "us",
    flag: "🇺🇸",
    label: "Америк",
    disabled: true,
  },
];

export const ZAHIALGA_LESSONS: ZahialgaLesson[] = [
  {
    number: 1,
    title: "Taobao гэж юу вэ?",
    subtitle: "Танилцуулга · 2 минут",
    locked: false,
    defaultOpen: true,
    content: {
      kind: "taobao-intro",
      introParagraph:
        'Taobao-г 2003 онд Хятадын Alibaba компани нээсэн. Нэр нь хятадаар "эрдэнэс хайх" гэсэн утгатай. Америкийн eBay-тэй өрсөлдөхөөр гарч ирээд, бараа байршуулахыг үнэгүй болгож, мөнгийг зөвхөн бараагаа гартаа авсны дараа худалдагчид шилжүүлдэг "хамгаалалттай төлбөр"-ийн системээр итгэл олж аваад хоёрхон жилд Хятадынхаа зах зээлийг бүрэн эзэлсэн.',
      facts: [
        { value: "~928 сая", label: "сар бүр ашигладаг хүн" },
        { value: "№1", label: "Хятадын худалдааны апп" },
        { value: "2003", label: "үүсгэн байгуулагдсан он" },
        { value: "Бүх юм", label: "хувцаснаас электрон хүртэл" },
      ],
      sectionTitle: "Яагаад Taobao вэ?",
      sectionParagraph:
        "Сонголт асар их — хувцас, гутал, гар утас, гэр ахуй, гоо сайхан, тоног төхөөрөмж, юу ч олдоно. Үнэ хямд — шууд үйлдвэр, жижиг худалдагчаас авдаг тул дэлгүүрээс хямд. Хамгийн чухал нь зургаар хайдаг тул хятад үг огт мэдэхгүй хүн ч ижил барааг олж чадна.",
      },
  },
  {
    number: 2,
    title: "Апп татах & бүртгүүлэх",
    subtitle: "6 алхам · 4 минут",
    locked: false,
    content: {
      kind: "app-register",
      intro:
        "Доорх 6 алхмыг дагаад л бүртгэл дуусна. Хятад товчнуудын утгыг хажууд нь тайлбарласан.",
      tip: "Код ирэхгүй бол хэдэн минут хүлээгээд дахин код авах дар, эсвэл вай-фай биш гар утасны датагаар оролдоорой. Дугаараа эхний 0-гүй бичнэ.",
      termsTitle: "Чухал хятад үгс",
      terms: [
        { hanzi: "淘宝", pinyin: "táobǎo", meaningMn: "Taobao (апп нэр)" },
        { hanzi: "注册", pinyin: "zhùcè", meaningMn: "Бүртгүүлэх" },
        { hanzi: "登录", pinyin: "dēnglù", meaningMn: "Нэвтрэх" },
        { hanzi: "同意", pinyin: "tóngyì", meaningMn: "Зөвшөөрөх" },
        {
          hanzi: "获取验证码",
          pinyin: "huòqǔ yànzhèngmǎ",
          meaningMn: "Код авах",
        },
        {
          hanzi: "设置登录密码",
          pinyin: "shèzhì dēnglù mìmǎ",
          meaningMn: "Нууц үг тавих",
        },
      ],
    },
  },
  {
    number: 3,
    title: "Бараа хайх",
    subtitle: "Зургаар & нэрээр хайх",
    locked: true,
  },
  {
    number: 4,
    title: "Худалдагч шалгах",
    subtitle: "Оноо, сэтгэгдэл, хэмжээ",
    locked: true,
  },
  {
    number: 5,
    title: "Захиалга өгөх",
    subtitle: "Сагс, өнгө, хэмжээ, хаяг",
    locked: true,
  },
  {
    number: 6,
    title: "Төлбөр төлөх",
    subtitle: "Бөөндөөгөөр хэрхэн төлөх",
    locked: true,
  },
  {
    number: 7,
    title: "Карго руу хүлээж авах",
    subtitle: "Хянах & Монгол руу авах",
    locked: true,
    lockIcon: "🏁",
  },
];
